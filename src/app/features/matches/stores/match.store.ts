import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, firstValueFrom, of, timeout } from 'rxjs';
import { ResourceStore } from 'src/app/core/store/resource-store';
import { SocialRequestItem } from 'src/app/features/social/models/social.models';
import { SocialApiService } from '../../social/services/social-api.service';
import { MatchResponse } from '../models/match.models';
import { MatchLiveEvent } from '../models/match-live-event.models';
import {
  MatchParticipant,
  MatchStatus,
  PlayerInvitationStatus,
  Venue,
} from '../models/progressive-match.models';
import { MatchLifecycleState, MatchState, resolveLifecycleState } from '../models/match-state.models';
import { MatchService } from '../services/match.service';
import { MatchLiveEventRegistryService } from '../services/match-live-event-registry.service';
import { MatchTeamPositionService } from '../services/match-team-position.service';
import { MatchVenueResolverService } from '../services/match-venue-resolver.service';
import { MatchesApiService } from '../services/matches-api.service';
import { buildConfirmedPlayers, buildMatchProgress } from '../utils/match-state-presenter.util';
import { buildUnifiedMatchParticipants } from '../utils/match-participant-mapper.util';
import { withLocalMatchInviteFallback } from '../utils/match-invite-fallback.util';
import { isClosePendingFallback, mapBackendMatchStatus } from '../utils/match-backend-state.util';
import { InvitationsStore } from './invitations.store';

interface MatchStorePatch {
  actorUuid: string;
  status: PlayerInvitationStatus;
}

@Injectable({ providedIn: 'root' })
export class MatchStore extends ResourceStore<MatchState> {
  private readonly ttlMs = 20000;
  private readonly requestTimeoutMs = 5000;
  private readonly matchService = inject(MatchService);
  private readonly liveEventRegistry = inject(MatchLiveEventRegistryService);
  private readonly matchTeamPositionService = inject(MatchTeamPositionService);
  private readonly matchesApiService = inject(MatchesApiService);
  private readonly socialApiService = inject(SocialApiService);
  private readonly matchVenueResolverService = inject(MatchVenueResolverService);
  private readonly invitationsStore = inject(InvitationsStore);
  private readonly liveVersionStore = signal<Record<string, number>>({});

  readonly liveVersion = this.liveVersionStore.asReadonly();
  readonly hasData = (matchId: string) => computed(() => !!this.selectState(matchId)().data);

  constructor() {
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
    if (!event.id || this.liveEventRegistry.hasProcessed(event.id)) {
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

    this.liveEventRegistry.markProcessed(event.id);
    return true;
  }

  override clear(matchId?: string): void {
    super.clear(matchId);
    if (!matchId) {
      this.liveEventRegistry.clear();
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
      this.matchTeamPositionService.fetchTeamPositionMap(loadedMatch.team.id),
      this.matchVenueResolverService.resolveVenue(loadedMatch),
    ]);

    const apiHydratedMatch = matchResponse ? this.matchService.syncMatchFromApi(matchResponse) : loadedMatch;
    const effectiveInvites = withLocalMatchInviteFallback(
      apiHydratedMatch,
      invites,
      this.invitationsStore.getMatchInvitations(apiHydratedMatch.id),
    );
    const participants = buildUnifiedMatchParticipants(apiHydratedMatch, matchResponse, effectiveInvites, positionMap);
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
          status: mapBackendMatchStatus(matchResponse.estado, accepted, pending, totalInvited),
          startedAt: matchResponse.startedAt ?? refreshedMatch.startedAt,
          finalizedAt: matchResponse.finalizedAt ?? refreshedMatch.finalizedAt,
          closePending:
            !!matchResponse.closePending ||
            isClosePendingFallback(matchResponse.estado, matchResponse.fechaHoraProgramada, accepted, pending, totalInvited),
        }
      : refreshedMatch;
    const lifecycleState = resolveLifecycleState(hydratedFromApi.status, accepted, pending, totalInvited);
    const progress = buildMatchProgress(
      hydratedFromApi.status,
      accepted,
      totalInvited,
      hydratedFromApi.minRequired,
      hydratedFromApi.closePending,
    );
    const confirmedParticipants = participants.filter((item) => item.status === PlayerInvitationStatus.ACCEPTED);
    const confirmedPlayers = buildConfirmedPlayers(hydratedFromApi, confirmedParticipants);

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
    const progress = buildMatchProgress(
      refreshedMatch.status,
      accepted.length,
      totalInvited,
      refreshedMatch.minRequired,
    );
    const confirmedPlayers = buildConfirmedPlayers(refreshedMatch, accepted);

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

}
