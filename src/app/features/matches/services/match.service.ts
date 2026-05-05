import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import {
  Match,
  MatchGenderCategory,
  MatchSize,
  MatchDraftInput,
  Invitation,
  MatchProgressView,
  MatchStatus,
  MatchType,
  Player,
  PlayerInvitationStatus,
  Venue,
} from '../models/progressive-match.models';
import { MatchPlayerSummary } from '../models/match.models';
import { MatchesApiService } from './matches-api.service';
import { InvitationService } from './invitation.service';
import { NotificationService } from './notification.service';
import { InvitationsStore } from '../stores/invitations.store';

interface TeamAssignmentSnapshot {
  homeIds: string[];
  awayIds: string[];
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class MatchService {
  private static readonly TEAM_ASSIGNMENTS_KEY = 'atleta.match.team-assignments.v1';
  private readonly authSessionService = inject(AuthSessionService);
  private readonly matchesApiService = inject(MatchesApiService);
  private readonly invitationService = inject(InvitationService);
  private readonly invitationsStore = inject(InvitationsStore);
  private readonly notificationService = inject(NotificationService);
  private readonly matchesStore = signal<Match[]>([]);
  private readonly isSubmittingStore = signal(false);
  private readonly teamAssignmentsStore = signal<Record<string, TeamAssignmentSnapshot>>(this.loadTeamAssignments());
  private readonly pendingStatusRecalc = new Set<string>();
  private statusRecalcTimer?: ReturnType<typeof setTimeout>;

  readonly matches = this.matchesStore.asReadonly();
  readonly isSubmitting = this.isSubmittingStore.asReadonly();
  readonly activeMatches = computed(() =>
    this.matchesStore().filter(
      (match) => match.status !== MatchStatus.FINISHED && match.status !== MatchStatus.INVALID,
    ),
  );

  constructor() {
    effect(() => {
      const invitations = this.invitationsStore.invitations();
      const matchIds = [...new Set(invitations.map((item) => item.matchId))];
      this.queueStatusRecalculation(matchIds);
    });

    effect(() => {
      const assignments = this.teamAssignmentsStore();
      try {
        localStorage.setItem(MatchService.TEAM_ASSIGNMENTS_KEY, JSON.stringify(assignments));
      } catch {
        // no-op
      }
    });
  }

  createDraft(input: MatchDraftInput): Match {
    const session = this.authSessionService.currentSession;
    const creatorUuid = session?.user.atletaUuid ?? 'anon';
    const creatorName = session?.user.nombre ?? 'Jugador';

    const draft: Match = {
      id: `match-${Date.now()}`,
      creatorUuid,
      creatorName,
      type: input.type,
      modality: input.modality,
      genderCategory: input.genderCategory,
      status: MatchStatus.CREATED,
      team: input.team,
      location: input.location,
      venueId: input.venue?.id,
      venueName: input.venue?.name,
      venueAddress: input.venue?.address,
      latitude: input.venue?.coordinates?.lat,
      longitude: input.venue?.coordinates?.lng,
      googlePlaceId: input.venue?.googlePlaceId,
      scheduledAt: input.scheduledAt,
      startedAt: undefined,
      finalizedAt: undefined,
      invitedCount: 0,
      minRequired: input.minRequired,
      maxPlayers: input.maxPlayers,
      themeId: input.themeId,
      homeKitColor: input.homeKitColor ?? 'Azul',
      awayKitColor: input.awayKitColor ?? 'Rojo',
      homePlayers: [],
      awayPlayers: [],
      createdAt: new Date().toISOString(),
    };

    this.matchesStore.update((matches) => [draft, ...matches]);
    return draft;
  }

  async sendInvitations(matchId: string, invitedPlayers: Player[]): Promise<Match | null> {
    const draft = this.matchesStore().find((item) => item.id === matchId);
    const session = this.authSessionService.currentSession;

    if (!draft || !session) {
      return null;
    }

    this.isSubmittingStore.set(true);

    try {
      const created = await firstValueFrom(
        this.matchesApiService.createMatch({
          creadorUuid: session.user.atletaUuid,
          modalidad: draft.modality,
          categoriaGenero: draft.genderCategory,
          fechaHoraProgramada: this.toApiLocalDateTime(draft.scheduledAt),
          latitud: draft.latitude,
          longitud: draft.longitude,
        }).pipe(timeout(10000)),
      );

      await firstValueFrom(
        this.matchesApiService.addTeamToMatch({
          matchId: created.id,
          teamId: draft.team.id,
          esLocal: true,
        }).pipe(timeout(10000)),
      );

      const inviteTargets = new Set(invitedPlayers.map((item) => item.uuid));
      inviteTargets.add(session.user.atletaUuid);

      const updatedDraft: Match = {
        ...draft,
        backendMatchId: created.id,
        invitedCount: inviteTargets.size,
        status: MatchStatus.CREATED,
      };

      this.upsertMatch(updatedDraft);
      const optimisticInvites = this.buildOptimisticInvitations(updatedDraft, invitedPlayers);
      this.invitationsStore.upsertInvitations(optimisticInvites);
      this.recalculateStatus(updatedDraft.id);
      // No bloquea el flujo de UI en caso de latencia/atasco del batch.
      void this.dispatchInvitationsInBackground(updatedDraft, invitedPlayers);

      return this.getMatchById(updatedDraft.id);
    } catch {
      return null;
    } finally {
      this.isSubmittingStore.set(false);
    }
  }

  getMatchById(matchId: string): Match | null {
    return this.matchesStore().find((item) => item.id === matchId) ?? null;
  }

  async ensureMatchLoaded(routeMatchId: string): Promise<Match | null> {
    const direct = this.getMatchById(routeMatchId);
    if (direct) {
      return direct;
    }

    const backendId = this.extractBackendMatchId(routeMatchId);
    if (!backendId) {
      return null;
    }

    const existingByBackend = this.matchesStore().find((item) => item.backendMatchId === backendId) ?? null;
    if (existingByBackend) {
      return existingByBackend;
    }

    try {
      const response = await firstValueFrom(this.matchesApiService.getById(backendId));
      const hydrated = this.mapApiMatchToLocal(response);
      this.upsertMatch(hydrated);
      return hydrated;
    } catch {
      return null;
    }
  }

  syncMatchFromApi(response: import('../models/match.models').MatchResponse): Match {
    const hydrated = this.mapApiMatchToLocal(response);
    this.upsertMatch(hydrated);
    return hydrated;
  }

  getProgress(matchId: string): MatchProgressView {
    const invitations = this.invitationsStore.getMatchInvitations(matchId);
    const match = this.getMatchById(matchId);

    if (!match) {
      return {
        confirmed: 0,
        invited: 0,
        minRequired: 0,
        percentage: 0,
        missing: 0,
        statusMessage: 'Partido no encontrado.',
      };
    }

    const confirmed = invitations.filter((item) => item.status === PlayerInvitationStatus.ACCEPTED).length;
    const invited = invitations.length || match.invitedCount;
    const missing = Math.max(match.minRequired - confirmed, 0);
    const percentage = match.minRequired > 0 ? Math.min((confirmed / match.minRequired) * 100, 100) : 0;

    return {
      confirmed,
      invited,
      minRequired: match.minRequired,
      percentage,
      missing,
      statusMessage: this.resolveStatusMessage(match, missing, confirmed),
    };
  }

  getConfirmedPlayers(matchId: string): Player[] {
    const invitations = this.invitationsStore
      .getMatchInvitations(matchId)
      .filter((item) => item.status === PlayerInvitationStatus.ACCEPTED);

    return invitations.map((invitation) => ({
      uuid: invitation.targetUuid,
      name: invitation.targetName,
      gender: undefined,
      role: 'JUGADOR',
      position: 'Sin posicion',
    }));
  }

  async setTeams(matchId: string, homePlayers: Player[], awayPlayers: Player[]): Promise<void> {
    const match = this.getMatchById(matchId);
    if (!match) {
      return;
    }
    this.validateTeamGenderBalance(match, homePlayers, awayPlayers);

    const updated = { ...match, homePlayers, awayPlayers };
    this.upsertMatch(updated);
    this.persistTeamAssignment(updated, homePlayers, awayPlayers);
    await this.persistTeamAssignmentsToBackend(updated, homePlayers, awayPlayers);
  }

  setTheme(matchId: string, themeId: string): void {
    const match = this.getMatchById(matchId);
    if (!match) {
      return;
    }

    this.upsertMatch({ ...match, themeId });
  }

  setVenue(matchId: string, venue: Venue): void {
    const match = this.getMatchById(matchId);
    if (!match) {
      return;
    }

    this.upsertMatch({
      ...match,
      venueId: venue.id,
      venueName: venue.name,
      venueAddress: venue.address,
      location: venue.address || venue.name || match.location,
      latitude: venue.coordinates?.lat ?? match.latitude,
      longitude: venue.coordinates?.lng ?? match.longitude,
    });
  }

  async finishMatch(matchId: string): Promise<void> {
    const match = this.getMatchById(matchId);
    if (!match) {
      throw new Error('Partido no encontrado.');
    }

    if (!match.backendMatchId) {
      this.upsertMatch({ ...match, status: MatchStatus.FINISHED });
      return;
    }

    const actorUuid = this.authSessionService.currentSession?.user.atletaUuid;
    if (!actorUuid) {
      throw new Error('Sesion no disponible.');
    }

    await firstValueFrom(this.matchesApiService.updateMatchStatus(match.backendMatchId, 'FINALIZADO', actorUuid));
    this.upsertMatch({ ...match, status: MatchStatus.FINISHED, closePending: false });
  }

  recalculateStatusFromCounts(matchId: string, accepted: number, pending: number, totalInvited: number): void {
    const match = this.getMatchById(matchId);
    if (!match || match.status === MatchStatus.FINISHED || match.status === MatchStatus.INVALID) {
      return;
    }

    const nextStatus = this.resolveLifecycleStatus(match, accepted, pending, totalInvited);
    if (nextStatus === match.status && Math.max(match.invitedCount, totalInvited) === match.invitedCount) {
      return;
    }

    this.upsertMatch({
      ...match,
      status: nextStatus,
      invitedCount: Math.max(match.invitedCount, totalInvited),
    });
  }

  private recalculateStatus(matchId: string): void {
    const match = this.getMatchById(matchId);
    if (!match || match.status === MatchStatus.FINISHED || match.status === MatchStatus.INVALID) {
      return;
    }

    const invitations = this.invitationsStore.getMatchInvitations(matchId);
    const accepted = invitations.filter((item) => item.status === PlayerInvitationStatus.ACCEPTED).length;
    const pending = invitations.filter(
      (item) => item.status === PlayerInvitationStatus.PENDING || item.status === PlayerInvitationStatus.INVITED,
    ).length;
    const nextInvitedCount = Math.max(match.invitedCount, invitations.length);
    const nextStatus = this.resolveLifecycleStatus(match, accepted, pending, invitations.length);

    const changed = match.status !== nextStatus;
    if (!changed && nextInvitedCount === match.invitedCount) {
      return;
    }

    this.upsertMatch({ ...match, status: nextStatus, invitedCount: nextInvitedCount });

    if (changed && nextStatus === MatchStatus.PARTIAL_CONFIRMATIONS) {
      const missing = Math.max(match.minRequired - accepted, 0);
      void this.notificationService.notifyAlmostReady(missing);
    }

    if (changed && nextStatus === MatchStatus.CONFIRMED) {
      void this.notificationService.notifyMatchConfirmed();
    }
  }

  private upsertMatch(match: Match): void {
    this.matchesStore.update((items) => {
      const index = items.findIndex((item) => item.id === match.id);
      if (index < 0) {
        return [match, ...items];
      }

      const clone = [...items];
      clone[index] = match;
      return clone;
    });
  }

  private queueStatusRecalculation(matchIds: string[]): void {
    for (const matchId of matchIds) {
      if (matchId) {
        this.pendingStatusRecalc.add(matchId);
      }
    }

    if (this.statusRecalcTimer) {
      return;
    }

    const processChunk = (): void => {
      const iterator = this.pendingStatusRecalc.values();
      let processed = 0;
      while (processed < 25) {
        const next = iterator.next();
        if (next.done) {
          break;
        }
        this.pendingStatusRecalc.delete(next.value);
        this.recalculateStatus(next.value);
        processed += 1;
      }

      if (this.pendingStatusRecalc.size > 0) {
        this.statusRecalcTimer = setTimeout(processChunk, 0);
      } else {
        this.statusRecalcTimer = undefined;
      }
    };

    this.statusRecalcTimer = setTimeout(processChunk, 0);
  }

  private toApiLocalDateTime(value: string): string {
    if (!value.includes(':')) {
      return value;
    }

    return value.length === 16 ? `${value}:00` : value;
  }

  private resolveStatusMessage(match: Match, missing: number, confirmed: number): string {
    if (match.status === MatchStatus.INVALID) {
      return 'Partido invalido por tiempo o confirmaciones insuficientes.';
    }

    if (match.status === MatchStatus.LIVE) {
      return 'El partido esta en juego.';
    }

    if (match.status === MatchStatus.CONFIRMED) {
      return 'Partido confirmado. Ya puedes formar equipos.';
    }

    if (match.status === MatchStatus.PARTIAL_CONFIRMATIONS) {
      return 'Armandose el partido.';
    }

    if (match.status === MatchStatus.CREATED) {
      return 'Invitaciones enviadas.';
    }

    return missing > 0 ? `Faltan ${missing} para confirmar el partido` : 'Partido finalizado.';
  }

  private extractBackendMatchId(routeMatchId: string): number | null {
    if (!routeMatchId) {
      return null;
    }

    if (/^\d+$/.test(routeMatchId)) {
      return Number(routeMatchId);
    }

    const prefixed = /^match-(\d+)$/.exec(routeMatchId);
    if (prefixed) {
      return Number(prefixed[1]);
    }

    return null;
  }

  private mapApiMatchToLocal(response: import('../models/match.models').MatchResponse): Match {
    const session = this.authSessionService.currentSession;
    const existingMatch = this.matchesStore().find((item) => item.backendMatchId === response.id);
    const localTeam = response.matchTeams?.find((item) => item.esLocal)?.team;
    const awayTeam = response.matchTeams?.find((item) => !item.esLocal)?.team;
    const captain = (response.players ?? []).find((item) => item.rol === 'CAPITAN')?.player;
    const latitude = response.latitud !== undefined && response.latitud !== null ? Number(response.latitud) : undefined;
    const longitude = response.longitud !== undefined && response.longitud !== null ? Number(response.longitud) : undefined;
    const locationLabel =
      Number.isFinite(latitude) && Number.isFinite(longitude)
        ? `Lat/Lng: ${latitude!.toFixed(6)}, ${longitude!.toFixed(6)}`
        : 'Cancha por definir';
    const resolvedType = this.resolveMatchType(response, existingMatch);

    const hasBackendTeamSides = (response.players ?? []).some(
      (item) => item.teamSide === 'LOCAL' || item.teamSide === 'VISITA',
    );

    const toPlayer = (item: MatchPlayerSummary): Player => ({
      uuid: item.player?.atletaUuid ?? `player-${item.id}`,
      name: item.player?.alias ?? 'Jugador',
      gender: item.player?.genero,
      position: item.position?.nombre ?? 'Sin posicion',
      role: item.rol ?? 'JUGADOR',
      teamId: item.team?.id,
    });

    const uniqueByUuid = (players: Player[]): Player[] => {
      const seen = new Set<string>();
      const result: Player[] = [];
      for (const player of players) {
        if (seen.has(player.uuid)) {
          continue;
        }
        seen.add(player.uuid);
        result.push(player);
      }
      return result;
    };

    let homePlayers: Player[] = hasBackendTeamSides
      ? uniqueByUuid(
          (response.players ?? [])
            .filter((item) => item.teamSide === 'LOCAL')
            .map(toPlayer),
        )
      : uniqueByUuid(
          (response.players ?? [])
            .filter((item) => item.team?.id === localTeam?.id)
            .map(toPlayer),
        );

    let awayPlayers: Player[] = hasBackendTeamSides
      ? uniqueByUuid(
          (response.players ?? [])
            .filter((item) => item.teamSide === 'VISITA')
            .map(toPlayer),
        )
      : uniqueByUuid(
          (response.players ?? [])
            .filter((item) => item.team?.id === awayTeam?.id)
            .map(toPlayer),
        );

    const persisted = this.getTeamAssignmentByBackendId(response.id);
    if (persisted) {
      const playersById = new Map<string, Player>(
        (response.players ?? []).map((item) => [
          item.player?.atletaUuid ?? `player-${item.id}`,
          {
            uuid: item.player?.atletaUuid ?? `player-${item.id}`,
            name: item.player?.alias ?? 'Jugador',
            gender: item.player?.genero,
            position: item.position?.nombre ?? 'Sin posicion',
            role: item.rol ?? 'JUGADOR',
            teamId:
              item.teamSide === 'VISITA'
                ? awayTeam?.id ?? item.team?.id ?? localTeam?.id
                : item.teamSide === 'LOCAL'
                  ? localTeam?.id ?? item.team?.id ?? awayTeam?.id
                  : item.team?.id ?? localTeam?.id ?? awayTeam?.id,
          } as Player,
        ]),
      );

      const persistedHome = persisted.homeIds
        .map((id) => playersById.get(id))
        .filter((player): player is Player => Boolean(player));
      const persistedAway = persisted.awayIds
        .map((id) => playersById.get(id))
        .filter((player): player is Player => Boolean(player));

      if (!hasBackendTeamSides && (persistedHome.length || persistedAway.length)) {
        homePlayers = persistedHome;
        awayPlayers = persistedAway;
      } else if (hasBackendTeamSides && (persistedHome.length || persistedAway.length)) {
        const homeIds = new Set(homePlayers.map((player) => player.uuid));
        const awayIds = new Set(awayPlayers.map((player) => player.uuid));

        const missingHome = persistedHome
          .filter((player) => !homeIds.has(player.uuid) && !awayIds.has(player.uuid))
          .map((player) => ({ ...player, teamId: localTeam?.id ?? player.teamId }));
        const missingAway = persistedAway
          .filter((player) => !homeIds.has(player.uuid) && !awayIds.has(player.uuid))
          .map((player) => ({ ...player, teamId: awayTeam?.id ?? player.teamId }));

        if (missingHome.length || missingAway.length) {
          homePlayers = [...homePlayers, ...missingHome];
          awayPlayers = [...awayPlayers, ...missingAway];
        }
      }
    }

    const initial: Match = {
      id: `match-${response.id}`,
      backendMatchId: response.id,
      creatorUuid:
        response.creador?.atletaUuid ?? captain?.atletaUuid ?? existingMatch?.creatorUuid ?? session?.user.atletaUuid ?? 'unknown',
      creatorName:
        response.creador?.alias ?? captain?.alias ?? existingMatch?.creatorName ?? session?.user.nombre ?? 'Organizador',
      type: resolvedType,
      modality: response.modalidad as MatchSize,
      genderCategory: (response.categoriaGenero as MatchGenderCategory) ?? MatchGenderCategory.MIXED,
      status: this.mapBackendStatus(response.estado, response.fechaHoraProgramada),
      team: {
        id: localTeam?.id ?? awayTeam?.id ?? 0,
        name: localTeam?.nombre ?? awayTeam?.nombre ?? 'Equipo',
      },
      location: locationLabel,
      latitude,
      longitude,
      scheduledAt: response.fechaHoraProgramada,
      startedAt: response.startedAt ?? undefined,
      finalizedAt: response.finalizedAt ?? undefined,
      closePending: !!response.closePending,
      mvpVotingClosedAt: response.mvpVotingClosedAt ?? undefined,
      finalScoreLocal: response.finalScoreLocal ?? undefined,
      finalScoreAway: response.finalScoreAway ?? undefined,
      mvpUserUuid: response.mvpUser?.atletaUuid ?? undefined,
      mvpUserAlias: response.mvpUser?.alias ?? undefined,
      invitedCount: response.players?.length ?? 0,
      minRequired: this.resolveMinByModality(response.modalidad),
      maxPlayers:
        response.modalidad === 'SIETE_VS_SIETE'
          ? 14
          : response.modalidad === 'SEIS_VS_SEIS'
            ? 12
            : 10,
      homeKitColor: 'Azul',
      awayKitColor: 'Rojo',
      homePlayers,
      awayPlayers,
      createdAt: new Date().toISOString(),
    };

    if (response.estado === 'CREADO') {
      const accepted = (response.players ?? []).filter((item) => Boolean(item.confirmado) || item.rol === 'CAPITAN').length;
      const total = response.players?.length ?? 0;
      const pending = Math.max(total - accepted, 0);
      return {
        ...initial,
        status: this.resolveLifecycleStatus(initial, accepted, pending, total),
      };
    }

    return initial;
  }

  private resolveMatchType(
    response: import('../models/match.models').MatchResponse,
    existingMatch: Match | undefined,
  ): MatchType {
    if (existingMatch?.type) {
      return existingMatch.type;
    }

    const teamIds = new Set(
      (response.matchTeams ?? [])
        .map((item) => item.team?.id)
        .filter((id): id is number => typeof id === 'number' && Number.isFinite(id)),
    );

    if (teamIds.size <= 1) {
      return MatchType.INTERNAL;
    }

    return MatchType.POINTS;
  }

  private mapBackendStatus(status: import('../models/match.models').MatchStatus, _scheduledAt?: string): MatchStatus {
    if (status === 'FINALIZADO') {
      return MatchStatus.FINISHED;
    }
    if (status === 'INVALIDO') {
      return MatchStatus.INVALID;
    }
    if (status === 'INICIADO') {
      return MatchStatus.LIVE;
    }
    return MatchStatus.CREATED;
  }

  private resolveLifecycleStatus(match: Match, accepted: number, pending: number, totalInvited: number): MatchStatus {
    if (match.status === MatchStatus.FINISHED || match.status === MatchStatus.INVALID) {
      return match.status;
    }

    const scheduled = new Date(match.scheduledAt).getTime();
    const allConfirmed = totalInvited > 0 && accepted === totalInvited && pending === 0;

    if (Number.isFinite(scheduled) && scheduled <= Date.now() && allConfirmed) {
      return MatchStatus.LIVE;
    }

    if (allConfirmed) {
      return MatchStatus.CONFIRMED;
    }

    if (accepted > 0) {
      return MatchStatus.PARTIAL_CONFIRMATIONS;
    }

    if (totalInvited > 0 || match.invitedCount > 0) {
      return MatchStatus.CREATED;
    }

    return MatchStatus.CREATED;
  }

  private resolveMinByModality(modality: import('../models/match.models').MatchModality): number {
    if (modality === 'SIETE_VS_SIETE') {
      return 14;
    }
    if (modality === 'SEIS_VS_SEIS') {
      return 12;
    }
    return 10;
  }

  async registerMatchEvent(input: {
    matchId: string;
    playerUuid: string;
    teamId: number;
    eventType: 'GOL' | 'ASISTENCIA';
    assistPlayerUuid?: string;
  }): Promise<void> {
    const match = this.getMatchById(input.matchId);
    if (!match?.backendMatchId) {
      throw new Error('Partido no disponible para registrar evento.');
    }

    await firstValueFrom(
      this.matchesApiService.registerEvent({
        matchId: match.backendMatchId,
        playerUuid: input.playerUuid,
        teamId: input.teamId,
        eventType: input.eventType,
        assistPlayerUuid: input.assistPlayerUuid,
      }),
    );
  }

  private persistTeamAssignment(match: Match, homePlayers: Player[], awayPlayers: Player[]): void {
    const key = this.getAssignmentKey(match);
    if (!key) {
      return;
    }

    this.teamAssignmentsStore.update((state) => ({
      ...state,
      [key]: {
        homeIds: homePlayers.map((player) => player.uuid),
        awayIds: awayPlayers.map((player) => player.uuid),
        updatedAt: new Date().toISOString(),
      },
    }));
  }

  private getTeamAssignmentByBackendId(backendMatchId: number): TeamAssignmentSnapshot | null {
    return this.teamAssignmentsStore()[`backend-${backendMatchId}`] ?? null;
  }

  private getAssignmentKey(match: Match): string | null {
    if (match.backendMatchId) {
      return `backend-${match.backendMatchId}`;
    }
    if (match.id) {
      return `local-${match.id}`;
    }
    return null;
  }

  private loadTeamAssignments(): Record<string, TeamAssignmentSnapshot> {
    try {
      const raw = localStorage.getItem(MatchService.TEAM_ASSIGNMENTS_KEY);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw) as Record<string, TeamAssignmentSnapshot>;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<T>((resolve) => {
          timer = setTimeout(() => resolve(fallback), timeoutMs);
        }),
      ]);
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  private async dispatchInvitationsInBackground(match: Match, invitedPlayers: Player[]): Promise<void> {
    try {
      const createdInvitations = await this.withTimeout(
        this.invitationService.sendInvitations(match, invitedPlayers),
        12000,
        this.buildOptimisticInvitations(match, invitedPlayers),
      );
      this.invitationsStore.upsertInvitations(createdInvitations);
      this.recalculateStatus(match.id);
    } catch {
      // Si falla el lote, el partido ya fue creado y el usuario puede continuar desde estado/historial.
    }
  }

  private buildOptimisticInvitations(match: Match, invitedPlayers: Player[]): Invitation[] {
    const session = this.authSessionService.currentSession;
    const creatorUuid = session?.user.atletaUuid ?? match.creatorUuid;
    const creatorName = session?.user.nombre ?? match.creatorName;

    const uniqueTargets = new Map<string, Player>();
    uniqueTargets.set(creatorUuid, {
      uuid: creatorUuid,
      name: creatorName,
      role: 'CAPITAN',
      position: 'Creador',
    });
    for (const player of invitedPlayers) {
      uniqueTargets.set(player.uuid, player);
    }

    const now = new Date().toISOString();
    return Array.from(uniqueTargets.values()).map((player) => ({
      id: `inv-${match.id}-${player.uuid}`,
      matchId: match.id,
      backendMatchId: match.backendMatchId,
      targetUuid: player.uuid,
      targetName: player.name,
      status: player.uuid === creatorUuid ? PlayerInvitationStatus.ACCEPTED : PlayerInvitationStatus.PENDING,
      createdAt: now,
    }));
  }

  private async persistTeamAssignmentsToBackend(match: Match, homePlayers: Player[], awayPlayers: Player[]): Promise<void> {
    if (!match.backendMatchId) {
      return;
    }

    const actorUuid = this.authSessionService.currentSession?.user?.atletaUuid;
    if (!actorUuid) {
      return;
    }

    const response = await firstValueFrom(
      this.matchesApiService.updateTeamAssignments(match.backendMatchId, {
        actorUuid,
        homePlayerUuids: homePlayers.map((player) => player.uuid),
        awayPlayerUuids: awayPlayers.map((player) => player.uuid),
      }),
    );

    const hydrated = this.mapApiMatchToLocal(response);
    this.upsertMatch(hydrated);
  }

  private validateTeamGenderBalance(match: Match, homePlayers: Player[], awayPlayers: Player[]): void {
    const countByGender = (players: Player[]) => ({
      women: players.filter((player) => player.gender === 'FEMENINO').length,
      men: players.filter((player) => player.gender === 'MASCULINO').length,
      unknown: players.filter((player) => !player.gender).length,
    });

    const home = countByGender(homePlayers);
    const away = countByGender(awayPlayers);

    if (home.unknown > 0 || away.unknown > 0) {
      throw new Error('Hay jugadores sin genero definido. Completa su perfil para armar equipos.');
    }

    if (match.genderCategory === MatchGenderCategory.WOMEN_ONLY && (home.men > 0 || away.men > 0)) {
      throw new Error('La convocatoria es solo mujeres. No puedes asignar hombres.');
    }

    if (match.genderCategory === MatchGenderCategory.MEN_ONLY && (home.women > 0 || away.women > 0)) {
      throw new Error('La convocatoria es solo hombres. No puedes asignar mujeres.');
    }

    if (
      match.genderCategory === MatchGenderCategory.MIXED &&
      (Math.abs(home.women - home.men) > 1 || Math.abs(away.women - away.men) > 1)
    ) {
      throw new Error(
        'En mixto, cada equipo debe tener balance por genero (misma cantidad o diferencia maxima de 1).',
      );
    }
  }
}


