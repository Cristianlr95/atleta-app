import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { APP_CONFIG } from 'src/app/core/config/app-config.token';
import { MatchStatus } from '../models/progressive-match.models';
import { MatchService } from './match.service';
import { MatchStore } from '../stores/match.store';

interface MatchLiveState {
  matchId: string;
  connected: boolean;
  source: 'sse' | 'polling';
  lastUpdatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class MatchLiveService implements OnDestroy {
  private readonly appConfig = inject(APP_CONFIG);
  private readonly liveStateStore = signal<Record<string, MatchLiveState>>({});
  private readonly livePulseStore = signal<Record<string, number>>({});
  private readonly timers = new Map<string, number>();
  private readonly errorCount = new Map<string, number>();
  private readonly inFlight = new Set<string>();
  private readonly eventSources = new Map<string, EventSource>();
  private readonly watched = new Set<string>();
  private readonly lastKnownStatusByMatch = new Map<string, MatchStatus>();
  private readonly visibilityHandler = () => this.onVisibilityChange();

  readonly liveState = this.liveStateStore.asReadonly();
  readonly livePulse = this.livePulseStore.asReadonly();

  constructor(
    private readonly matchService: MatchService,
    private readonly matchStore: MatchStore,
  ) {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  ngOnDestroy(): void {
    this.stopAll();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  watchMatch(matchId: string): void {
    this.watchParticipants(matchId);
    this.watchMatchState(matchId);
  }

  watchParticipants(matchId: string): void {
    this.start(matchId);
  }

  watchMatchState(matchId: string): void {
    this.start(matchId);
  }

  stopWatching(matchId: string): void {
    this.clearTimer(matchId);
    this.errorCount.delete(matchId);
    this.inFlight.delete(matchId);
    this.watched.delete(matchId);
    this.lastKnownStatusByMatch.delete(matchId);
    this.closeEventSource(matchId);
    this.liveStateStore.update((state) => {
      const clone = { ...state };
      delete clone[matchId];
      return clone;
    });
    this.livePulseStore.update((state) => {
      const clone = { ...state };
      delete clone[matchId];
      return clone;
    });
  }

  private stopAll(): void {
    for (const key of this.watched) {
      this.stopWatching(key);
    }
  }

  private start(matchId: string): void {
    if (this.watched.has(matchId)) {
      return;
    }
    this.watched.add(matchId);
    void this.establishChannel(matchId);
  }

  private async establishChannel(matchId: string): Promise<void> {
    if (typeof document !== 'undefined' && document.hidden) {
      this.scheduleNext(matchId, 1200);
      return;
    }

    const connected = await this.tryEventSource(matchId);
    if (connected) {
      return;
    }

    this.startPolling(matchId);
  }

  private startPolling(matchId: string): void {
    this.closeEventSource(matchId);
    this.setState(matchId, true, 'polling');
    void this.tick(matchId);
  }

  private async tick(matchId: string): Promise<void> {
    if (!this.watched.has(matchId)) {
      return;
    }

    if (this.inFlight.has(matchId)) {
      this.scheduleNext(matchId, this.resolveDelay(matchId));
      return;
    }

    if (typeof document !== 'undefined' && document.hidden) {
      this.scheduleNext(matchId, 10000);
      return;
    }

    try {
      await this.runSync(matchId);
      this.errorCount.set(matchId, 0);
      this.setState(matchId, true, this.eventSources.has(matchId) ? 'sse' : 'polling');
      this.bumpPulse(matchId);
    } catch {
      const nextErrors = (this.errorCount.get(matchId) ?? 0) + 1;
      this.errorCount.set(matchId, nextErrors);
      this.setState(matchId, false, this.eventSources.has(matchId) ? 'sse' : 'polling');
    }

    const match = this.matchService.getMatchById(matchId);
    if (!match || match.status === MatchStatus.FINISHED) {
      this.stopWatching(matchId);
      return;
    }

    if (!this.eventSources.has(matchId)) {
      this.scheduleNext(matchId, this.resolveDelay(matchId));
    }
  }

  private async tryEventSource(matchId: string): Promise<boolean> {
    if (typeof EventSource === 'undefined') {
      return false;
    }

    const backendMatchId = this.matchService.getMatchById(matchId)?.backendMatchId;
    if (!backendMatchId) {
      return false;
    }

    return new Promise((resolve) => {
      const url = `${this.appConfig.apiBaseUrl}/matches/${backendMatchId}/live`;
      const source = new EventSource(url);
      let settled = false;

      const timeout = window.setTimeout(() => {
        if (!settled) {
          settled = true;
          source.close();
          resolve(false);
        }
      }, 2500);

      source.onopen = () => {
        if (!this.watched.has(matchId)) {
          source.close();
          return;
        }
        window.clearTimeout(timeout);
        settled = true;
        this.closeEventSource(matchId);
        this.eventSources.set(matchId, source);
        this.clearTimer(matchId);
        this.setState(matchId, true, 'sse');
        resolve(true);
      };

      source.addEventListener('match-invite-created', () => {
        void this.handleRealtimeMessage(matchId);
      });
      source.addEventListener('match-invite-updated', () => {
        void this.handleRealtimeMessage(matchId);
      });

      source.onerror = () => {
        source.close();
        this.eventSources.delete(matchId);

        if (!settled) {
          window.clearTimeout(timeout);
          settled = true;
          resolve(false);
          return;
        }

        this.setState(matchId, false, 'sse');
        this.startPolling(matchId);
      };
    });
  }

  private async handleRealtimeMessage(matchId: string): Promise<void> {
    if (this.inFlight.has(matchId)) {
      return;
    }

    try {
      await this.runSync(matchId);
      this.setState(matchId, true, this.eventSources.has(matchId) ? 'sse' : 'polling');
      this.bumpPulse(matchId);
    } catch {
      this.setState(matchId, false, this.eventSources.has(matchId) ? 'sse' : 'polling');
    }
  }

  private async runSync(matchId: string): Promise<void> {
    this.inFlight.add(matchId);
    try {
      await this.syncFromServer(matchId);
    } finally {
      this.inFlight.delete(matchId);
    }
  }

  private closeEventSource(matchId: string): void {
    const source = this.eventSources.get(matchId);
    if (source) {
      source.close();
      this.eventSources.delete(matchId);
    }
  }

  private clearTimer(matchId: string): void {
    const timer = this.timers.get(matchId);
    if (timer) {
      window.clearTimeout(timer);
    }
    this.timers.delete(matchId);
  }

  private scheduleNext(matchId: string, delayMs: number): void {
    if (!this.watched.has(matchId) || delayMs <= 0) {
      return;
    }

    this.clearTimer(matchId);
    const handle = window.setTimeout(() => void this.tick(matchId), delayMs);
    this.timers.set(matchId, handle);
  }

  private resolveDelay(matchId: string): number {
    const match = this.matchService.getMatchById(matchId);
    const status = match?.status ?? MatchStatus.CREATED;
    const errors = this.errorCount.get(matchId) ?? 0;

    const baseDelay =
      status === MatchStatus.CONFIRMED || status === MatchStatus.LIVE ? 20000 :
      status === MatchStatus.FINISHED ? 0 :
      5000;

    if (baseDelay === 0 || errors <= 0) {
      return baseDelay;
    }

    return Math.min(baseDelay * Math.pow(2, errors), 20000);
  }

  private setState(matchId: string, connected: boolean, source: 'sse' | 'polling'): void {
    this.liveStateStore.update((state) => ({
      ...state,
      [matchId]: {
        matchId,
        connected,
        source,
        lastUpdatedAt: new Date().toISOString(),
      },
    }));
  }

  private async syncFromServer(matchId: string): Promise<void> {
    const backendMatchId = this.matchService.getMatchById(matchId)?.backendMatchId;
    if (!backendMatchId) {
      return;
    }

    await Promise.race([
      this.matchStore.refreshByBackendMatchId(backendMatchId, true),
      new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error('match_refresh_timeout')), 6000);
      }),
    ]);

    const refreshed = this.matchService.getMatchById(matchId);
    if (refreshed) {
      const previousStatus = this.lastKnownStatusByMatch.get(matchId);
      if (previousStatus && previousStatus !== refreshed.status) {
        this.matchStore.applyLiveEvent({
          id: `${backendMatchId}:status:${refreshed.status}`,
          type: 'MATCH_STATUS_CHANGED',
          createdAt: new Date().toISOString(),
          backendMatchId,
          localMatchId: matchId,
          nextMatchStatus: refreshed.status,
        });
      }
      this.lastKnownStatusByMatch.set(matchId, refreshed.status);
    }
  }

  private bumpPulse(matchId: string): void {
    this.livePulseStore.update((state) => ({
      ...state,
      [matchId]: (state[matchId] ?? 0) + 1,
    }));
  }

  private onVisibilityChange(): void {
    if (typeof document !== 'undefined' && document.hidden) {
      for (const key of this.watched) {
        this.clearTimer(key);
        this.closeEventSource(key);
      }
      return;
    }

    for (const matchId of this.watched) {
      void this.establishChannel(matchId);
    }
  }
}
