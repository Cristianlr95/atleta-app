import { Injectable, computed, signal } from '@angular/core';
import { catchError, firstValueFrom, of, timeout } from 'rxjs';
import { ResourceStore } from 'src/app/core/store/resource-store';
import { TeamApiService } from 'src/app/features/teams/services/team-api.service';
import { SocialRequestItem } from 'src/app/features/social/models/social.models';
import { SocialApiService } from '../../social/services/social-api.service';
import { MatchResponse, MatchStatus as BackendMatchStatus } from '../models/match.models';
import { MatchLiveEvent } from '../models/match-live-event.models';
import {
  MatchParticipant,
  MatchProgressView,
  MatchStatus,
  Player,
  PlayerInvitationStatus,
  Venue,
} from '../models/progressive-match.models';
import { MatchLifecycleState, MatchState, resolveLifecycleState } from '../models/match-state.models';
import { MatchService } from '../services/match.service';
import { MatchesApiService } from '../services/matches-api.service';
import { VenueService } from '../services/venue.service';
import { InvitationsStore } from './invitations.store';

interface MatchStorePatch {
  actorUuid: string;
  status: PlayerInvitationStatus;
}

@Injectable({ providedIn: 'root' })
export class MatchStore extends ResourceStore<MatchState> {
  private readonly ttlMs = 20000;
  private readonly requestTimeoutMs = 5000;
  private readonly liveVersionStore = signal<Record<string, number>>({});
  private readonly processedLiveEventsStore = signal<Record<string, true>>({});

  readonly liveVersion = this.liveVersionStore.asReadonly();
  readonly hasData = (matchId: string) => computed(() => !!this.selectState(matchId)().data);

  constructor(
    private readonly matchService: MatchService,
    private readonly matchesApiService: MatchesApiService,
    private readonly socialApiService: SocialApiService,
    private readonly teamApiService: TeamApiService,
    private readonly venueService: VenueService,
    private readonly invitationsStore: InvitationsStore,
  ) {
    super();
  }

  load(matchId: string): Promise<MatchState | null> {
    return this.loadWithPolicy(matchId, () => this.fetchMatchState(matchId), { ttlMs: this.ttlMs });
  }

  refresh(matchId: string, force = false): Promise<MatchState | null> {
    return this.loadWithPolicy(matchId, () => this.fetchMatchState(matchId), { force, ttlMs: this.ttlMs });
  }

  optimisticPatch(matchId: string, patch: MatchStorePatch): void {
    const current = this.getData(matchId);
    if (!current) {
      return;
    }

    const nextParticipants = current.participants.map((item) =>
      item.userId === patch.actorUuid ? { ...item, status: patch.status } : item,
    );

    this.setData(matchId, this.rebuildDerivedState(current, nextParticipants));
  }

  optimisticPatchByBackendMatchId(backendMatchId: number, patch: MatchStorePatch): void {
    if (!backendMatchId) {
      return;
    }

    const entries = this.entries();
    for (const [key, entry] of Object.entries(entries)) {
      if (!entry.data || entry.data.backendMatchId !== backendMatchId) {
        continue;
      }
      this.optimisticPatch(key, patch);
    }
  }

  async refreshByBackendMatchId(backendMatchId: number, force = true): Promise<void> {
    if (!backendMatchId) {
      return;
    }

    const entries = this.entries();
    const targets = Object.entries(entries)
      .filter(([, entry]) => entry.data?.backendMatchId === backendMatchId)
      .map(([key]) => key);

    if (targets.length === 0) {
      await this.refresh(String(backendMatchId), force);
      await this.refresh(`match-${backendMatchId}`, force);
      return;
    }

    await Promise.all(
      targets.map((key) =>
        this.refresh(key, force).catch(() => null),
      ),
    );
  }

  acknowledgeLiveUpdate(matchId: string): void {
    this.liveVersionStore.update((state) => ({
      ...state,
      [matchId]: (state[matchId] ?? 0) + 1,
    }));
  }

  applyLiveEvent(event: MatchLiveEvent): boolean {
    if (!event.id || this.processedLiveEventsStore()[event.id]) {
      return false;
    }

    if (
      (event.type === 'INVITE_ACCEPTED' ||
        event.type === 'INVITE_DECLINED' ||
        event.type === 'INVITE_PENDING') &&
      event.actorUuid &&
      event.status
    ) {
      this.optimisticPatchByBackendMatchId(event.backendMatchId, {
        actorUuid: event.actorUuid,
        status: event.status,
      });
    }

    if (event.type === 'MATCH_STATUS_CHANGED' && event.nextMatchStatus) {
      const entries = this.entries();
      for (const [key, entry] of Object.entries(entries)) {
        const data = entry.data;
        if (!data || data.backendMatchId !== event.backendMatchId) {
          continue;
        }

        const rebuilt = this.rebuildDerivedState(
          { ...data, match: { ...data.match, status: event.nextMatchStatus } },
          data.participants,
        );
        this.setData(key, rebuilt);
      }
    }

    this.processedLiveEventsStore.update((state) => ({
      ...state,
      [event.id]: true,
    }));
    return true;
  }

  override clear(matchId?: string): void {
    super.clear(matchId);
    if (!matchId) {
      this.processedLiveEventsStore.set({});
    }
  }

  private async fetchMatchState(routeMatchId: string): Promise<MatchState | null> {
    const loadedMatch = await this.matchService.ensureMatchLoaded(routeMatchId);
    if (!loadedMatch) {
      throw new Error('No se pudo cargar el partido.');
    }

    const localMatchId = loadedMatch.id;
    const backendMatchId = loadedMatch.backendMatchId;
    if (!backendMatchId) {
      throw new Error('El partido no tiene identificador de backend.');
    }

    const [matchResponse, invites, positionMap, venue] = await Promise.all([
      firstValueFrom(
        this.matchesApiService.getById(backendMatchId).pipe(
          timeout(this.requestTimeoutMs),
          catchError(() => of(null)),
        ),
      ),
      firstValueFrom(
        this.socialApiService.getMatchInvitesByMatch(backendMatchId).pipe(
          timeout(this.requestTimeoutMs),
          catchError(() => of([])),
        ),
      ),
      this.fetchTeamPositionMap(loadedMatch.team.id),
      this.resolveVenue(loadedMatch),
    ]);

    const apiHydratedMatch = matchResponse ? this.matchService.syncMatchFromApi(matchResponse) : loadedMatch;
    const effectiveInvites = this.withLocalInviteFallback(apiHydratedMatch, invites);
    const participants = this.buildUnifiedParticipants(apiHydratedMatch, matchResponse, effectiveInvites, positionMap);
    const accepted = participants.filter((item) => item.status === PlayerInvitationStatus.ACCEPTED).length;
    const pending = participants.filter(
      (item) => item.status === PlayerInvitationStatus.PENDING || item.status === PlayerInvitationStatus.INVITED,
    ).length;
    const declined = participants.filter((item) => item.status === PlayerInvitationStatus.DECLINED).length;
    const totalInvited = participants.length;

    this.matchService.recalculateStatusFromCounts(localMatchId, accepted, pending, totalInvited);
    const refreshedMatch = this.matchService.getMatchById(localMatchId) ?? apiHydratedMatch;
    const hydratedFromApi = matchResponse
      ? {
          ...refreshedMatch,
          status: this.mapBackendStatus(matchResponse.estado, matchResponse.fechaHoraProgramada, accepted, pending, totalInvited),
          startedAt: matchResponse.startedAt ?? refreshedMatch.startedAt,
          finalizedAt: matchResponse.finalizedAt ?? refreshedMatch.finalizedAt,
          closePending:
            !!matchResponse.closePending ||
            this.isClosePendingFallback(matchResponse.estado, matchResponse.fechaHoraProgramada, accepted, pending, totalInvited),
        }
      : refreshedMatch;
    const lifecycleState = resolveLifecycleState(hydratedFromApi.status, accepted, pending, totalInvited);
    const progress = this.toProgress(hydratedFromApi.status, accepted, totalInvited, hydratedFromApi.minRequired, hydratedFromApi.closePending);
    const confirmedParticipants = participants.filter((item) => item.status === PlayerInvitationStatus.ACCEPTED);
    const confirmedPlayers = this.toConfirmedPlayers(hydratedFromApi, confirmedParticipants);

    return {
      routeMatchId,
      localMatchId,
      backendMatchId,
      match: { ...hydratedFromApi, invitedCount: totalInvited },
      participants,
      confirmedParticipants,
      pendingParticipants: participants.filter(
        (item) => item.status === PlayerInvitationStatus.PENDING || item.status === PlayerInvitationStatus.INVITED,
      ),
      declinedParticipants: participants.filter((item) => item.status === PlayerInvitationStatus.DECLINED),
      confirmedPlayers,
      progress,
      venue,
      lifecycleState,
    };
  }

  private rebuildDerivedState(current: MatchState, participants: MatchParticipant[]): MatchState {
    const accepted = participants.filter((item) => item.status === PlayerInvitationStatus.ACCEPTED);
    const pending = participants.filter(
      (item) => item.status === PlayerInvitationStatus.PENDING || item.status === PlayerInvitationStatus.INVITED,
    );
    const declined = participants.filter((item) => item.status === PlayerInvitationStatus.DECLINED);
    const totalInvited = participants.length;
    this.matchService.recalculateStatusFromCounts(current.localMatchId, accepted.length, pending.length, totalInvited);
    const refreshedMatch = this.matchService.getMatchById(current.localMatchId) ?? current.match;
    const lifecycleState = resolveLifecycleState(refreshedMatch.status, accepted.length, pending.length, totalInvited);
    const progress = this.toProgress(
      refreshedMatch.status,
      accepted.length,
      totalInvited,
      refreshedMatch.minRequired,
    );
    const confirmedPlayers = this.toConfirmedPlayers(refreshedMatch, accepted);

    return {
      ...current,
      participants,
      confirmedParticipants: accepted,
      pendingParticipants: pending,
      declinedParticipants: declined,
      confirmedPlayers,
      progress,
      lifecycleState,
      match: {
        ...refreshedMatch,
        invitedCount: totalInvited,
      },
    };
  }

  private toProgress(
    status: MatchStatus,
    accepted: number,
    invited: number,
    minRequired: number,
    closePending?: boolean,
  ): MatchProgressView {
    const missing = Math.max(minRequired - accepted, 0);
    const percentage = minRequired > 0 ? Math.min((accepted / minRequired) * 100, 100) : 0;

    const statusMessage =
      status === MatchStatus.CONFIRMED
        ? 'Partido confirmado. Ya puedes formar equipos.'
        : status === MatchStatus.INVALID
          ? 'Partido invalido por tiempo o confirmaciones insuficientes.'
        : status === MatchStatus.LIVE
          ? closePending
            ? 'Partido terminado. Pendiente cierre de resultados.'
            : 'El partido esta en juego.'
          : status === MatchStatus.PARTIAL_CONFIRMATIONS
            ? 'Armandose el partido.'
            : missing > 0
              ? `Faltan ${missing} para confirmar el partido`
              : 'Invitaciones enviadas.';

    return {
      confirmed: accepted,
      invited,
      minRequired,
      percentage,
      missing,
      statusMessage,
    };
  }

  private toConfirmedPlayers(match: MatchState['match'], participants: MatchParticipant[]): Player[] {
    const linked = new Map(
      [...(match.homePlayers ?? []), ...(match.awayPlayers ?? [])].map((item) => [item.uuid, item]),
    );

    return participants.map((item) => {
      const fallback = linked.get(item.userId);
      return {
        uuid: item.userId,
        name: item.name,
        gender: item.gender ?? fallback?.gender,
        role: fallback?.role ?? 'JUGADOR',
        position: item.position ?? fallback?.position ?? 'Sin posicion',
        teamId: fallback?.teamId,
        avatarUrl: item.avatarUrl,
        ovr: fallback?.ovr ?? 65,
      };
    });
  }

  private buildUnifiedParticipants(
    match: MatchState['match'],
    response: MatchResponse | null,
    invites: SocialRequestItem[],
    positionMap: Record<string, string>,
  ): MatchParticipant[] {
    const fromApi = new Map<string, MatchParticipant>();

    for (const player of response?.players ?? []) {
      const playerUuid = player.player?.atletaUuid;
      if (!playerUuid || fromApi.has(playerUuid)) {
        continue;
      }

      fromApi.set(playerUuid, {
        userId: playerUuid,
        name: player.player?.alias ?? 'Jugador',
        status:
          player.confirmado || player.rol === 'CAPITAN'
            ? PlayerInvitationStatus.ACCEPTED
            : PlayerInvitationStatus.PENDING,
        gender: player.player?.genero,
        position: player.position?.nombre ?? positionMap[playerUuid] ?? 'Sin posicion',
        teamSide: player.teamSide === 'LOCAL' ? 'HOME' : player.teamSide === 'VISITA' ? 'AWAY' : undefined,
      });
    }

    const merged = new Map<string, MatchParticipant>(fromApi);

    for (const invite of invites) {
      const apiDetail = merged.get(invite.targetUuid) ?? fromApi.get(invite.targetUuid);
      const inviteStatus =
        invite.status === 'ACEPTADA'
          ? PlayerInvitationStatus.ACCEPTED
          : invite.status === 'RECHAZADA'
            ? PlayerInvitationStatus.DECLINED
            : PlayerInvitationStatus.PENDING;

      const resolvedStatus =
        apiDetail?.status === PlayerInvitationStatus.ACCEPTED || inviteStatus === PlayerInvitationStatus.ACCEPTED
          ? PlayerInvitationStatus.ACCEPTED
          : inviteStatus === PlayerInvitationStatus.DECLINED
            ? PlayerInvitationStatus.DECLINED
            : apiDetail?.status ?? PlayerInvitationStatus.PENDING;

      merged.set(invite.targetUuid, {
        userId: invite.targetUuid,
        name: invite.targetAlias || apiDetail?.name || 'Jugador',
        status: resolvedStatus,
        gender: apiDetail?.gender,
        position: apiDetail?.position ?? positionMap[invite.targetUuid] ?? 'Sin posicion',
        teamSide: apiDetail?.teamSide,
      });
    }

    if (match.creatorUuid && !merged.has(match.creatorUuid)) {
      const creatorPlayer = [...(match.homePlayers ?? []), ...(match.awayPlayers ?? [])].find(
        (player) => player.uuid === match.creatorUuid,
      );
      merged.set(match.creatorUuid, {
        userId: match.creatorUuid,
        name: match.creatorName || 'Creador',
        status: PlayerInvitationStatus.ACCEPTED,
        gender: creatorPlayer?.gender,
        position: positionMap[match.creatorUuid] ?? 'Creador',
      });
    }

    const homeSet = new Set(match.homePlayers.map((item) => item.uuid));
    const awaySet = new Set(match.awayPlayers.map((item) => item.uuid));

    return Array.from(merged.values()).map((item) => {
      if (homeSet.has(item.userId)) {
        return { ...item, teamSide: 'HOME', kitColor: match.homeKitColor || 'Azul' };
      }
      if (awaySet.has(item.userId)) {
        return { ...item, teamSide: 'AWAY', kitColor: match.awayKitColor || 'Rojo' };
      }
      return item;
    });
  }

  private withLocalInviteFallback(match: MatchState['match'], invites: SocialRequestItem[]): SocialRequestItem[] {
    if (invites.length > 0) {
      return invites;
    }

    const local = this.invitationsStore
      .getMatchInvitations(match.id)
      .filter((item) => item.backendMatchId === undefined || item.backendMatchId === match.backendMatchId);

    return local.map((item, index) => ({
      id: item.backendInviteId ?? -(index + 1),
      type: 'MATCH_INVITE',
      status:
        item.status === PlayerInvitationStatus.ACCEPTED
          ? 'ACEPTADA'
          : item.status === PlayerInvitationStatus.DECLINED
            ? 'RECHAZADA'
            : 'PENDIENTE',
      requesterUuid: match.creatorUuid,
      requesterAlias: match.creatorName,
      targetUuid: item.targetUuid,
      targetAlias: item.targetName,
      teamId: match.team.id,
      teamName: match.team.name,
      matchId: match.backendMatchId,
      createdAt: item.createdAt,
      respondedAt: item.respondedAt,
    }));
  }

  private async fetchTeamPositionMap(teamId: number): Promise<Record<string, string>> {
    if (!teamId) {
      return {};
    }

    const members = await firstValueFrom(
      this.teamApiService.getActiveMembers(teamId).pipe(
        timeout(this.requestTimeoutMs),
        catchError(() => of([])),
      ),
    );

    return members.reduce<Record<string, string>>((acc, member) => {
      acc[member.playerUuid] = member.primaryPositionName ?? 'Sin posicion';
      return acc;
    }, {});
  }

  private async resolveVenue(match: MatchState['match']): Promise<Venue | null> {
    if (match.venueId) {
      const byId = await this.venueService.getVenueById(match.venueId);
      if (byId) {
        return byId;
      }
    }

    if (match.latitude !== undefined && match.longitude !== undefined) {
      const byCoordinates = await this.venueService.getVenueByCoordinates(match.latitude, match.longitude);
      if (byCoordinates) {
        return byCoordinates;
      }
    }

    if (!match.venueName && !match.venueAddress && !match.location) {
      return null;
    }

    return {
      id: match.venueId ?? 0,
      name: match.venueName ?? 'Cancha seleccionada',
      address: match.venueAddress ?? match.location ?? 'Sin direccion',
      coordinates:
        match.latitude !== undefined && match.longitude !== undefined
          ? { lat: match.latitude, lng: match.longitude }
          : undefined,
      googlePlaceId: match.googlePlaceId,
    };
  }

  private mapBackendStatus(
    status: BackendMatchStatus | undefined,
    _scheduledAt: string | undefined,
    accepted: number,
    pending: number,
    totalInvited: number,
  ): MatchStatus {
    if (status === 'FINALIZADO') {
      return MatchStatus.FINISHED;
    }
    if (status === 'INVALIDO') {
      return MatchStatus.INVALID;
    }
    if (status === 'INICIADO') {
      return MatchStatus.LIVE;
    }

    const allConfirmed = totalInvited > 0 && accepted === totalInvited && pending === 0;

    if (allConfirmed) {
      return MatchStatus.CONFIRMED;
    }
    if (accepted > 0) {
      return MatchStatus.PARTIAL_CONFIRMATIONS;
    }
    return MatchStatus.CREATED;
  }

  private isClosePendingFallback(
    status: BackendMatchStatus | undefined,
    scheduledAt: string | undefined,
    accepted: number,
    pending: number,
    totalInvited: number,
  ): boolean {
    if (status === 'FINALIZADO' || status === 'INVALIDO') {
      return false;
    }

    const scheduledAtMs = scheduledAt ? new Date(scheduledAt).getTime() : Number.NaN;
    if (!Number.isFinite(scheduledAtMs)) {
      return false;
    }

    const oneHourAfterKickoff = scheduledAtMs + 60 * 60 * 1000;
    const allConfirmed = totalInvited > 0 && accepted === totalInvited && pending === 0;
    return allConfirmed && Date.now() >= oneHourAfterKickoff;
  }
}
