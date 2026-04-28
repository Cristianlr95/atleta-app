import { Injectable } from '@angular/core';
import { catchError, firstValueFrom, timeout } from 'rxjs';
import { ResourceStore } from 'src/app/core/store/resource-store';
import { MatchMvpResponse, MatchMvpState } from '../models/match-mvp.models';
import { MatchService } from '../services/match.service';
import { MatchesApiService } from '../services/matches-api.service';

@Injectable({ providedIn: 'root' })
export class MvpVoteStore extends ResourceStore<MatchMvpState> {
  private readonly ttlMs = 5000;
  private readonly requestTimeoutMs = 5000;

  constructor(
    private readonly matchService: MatchService,
    private readonly matchesApiService: MatchesApiService,
  ) {
    super();
  }

  load(routeMatchId: string): Promise<MatchMvpState | null> {
    return this.loadWithPolicy(routeMatchId, () => this.fetchState(routeMatchId), { ttlMs: this.ttlMs });
  }

  refresh(routeMatchId: string, force = false): Promise<MatchMvpState | null> {
    return this.loadWithPolicy(routeMatchId, () => this.fetchState(routeMatchId), { force, ttlMs: this.ttlMs });
  }

  async vote(routeMatchId: string, votedUserId: string): Promise<MatchMvpState | null> {
    const entry = this.getData(routeMatchId);
    if (!entry) {
      throw new Error('No se pudo cargar la votacion MVP.');
    }

    const response = await firstValueFrom(
      this.matchesApiService.voteMatchMvp(entry.backendMatchId, votedUserId).pipe(
        timeout(this.requestTimeoutMs),
      ),
    );

    const next = this.toState(entry.routeMatchId, entry.localMatchId, entry.backendMatchId, response);
    this.setData(routeMatchId, next);
    return next;
  }

  private async fetchState(routeMatchId: string): Promise<MatchMvpState | null> {
    const match = await this.matchService.ensureMatchLoaded(routeMatchId);
    if (!match?.backendMatchId) {
      throw new Error('No se pudo cargar el partido para MVP.');
    }

    const response = await firstValueFrom(
      this.matchesApiService.getMatchMvp(match.backendMatchId).pipe(
        timeout(this.requestTimeoutMs),
        catchError((error) => {
          throw error;
        }),
      ),
    );

    return this.toState(routeMatchId, match.id, match.backendMatchId, response);
  }

  private toState(
    routeMatchId: string,
    localMatchId: string,
    backendMatchId: number,
    response: MatchMvpResponse,
  ): MatchMvpState {
    return {
      routeMatchId,
      localMatchId,
      backendMatchId,
      finalizedAt: response.finalizedAt ?? null,
      closesAt: response.closesAt ?? null,
      isOpen: !!response.open,
      myVote: response.myVote ?? null,
      winnerUserId: response.winnerUserId ?? null,
      winnerAlias: response.winnerAlias ?? null,
      candidates: response.candidates ?? [],
      tally: response.tally ?? [],
    };
  }
}
