import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { APP_CONFIG } from 'src/app/core/config/app-config.token';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
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
  private readonly matchService = inject(MatchService);
  private readonly matchStore = inject(MatchStore);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly liveStateStore = signal<Record<string, MatchLiveState>>({});
  private readonly livePulseStore = signal<Record<string, number>>({});
  private readonly timers = new Map<string, number>();
  private readonly errorCount = new Map<string, number>();
  private readonly inFlight = new Set<string>();
  private readonly sseControllers = new Map<string, AbortController>();
  private readonly reconnectTimers = new Map<string, number>();
  private readonly watched = new Set<string>();
  private readonly lastKnownStatusByMatch = new Map<string, MatchStatus>();
  private readonly visibilityHandler = () => this.onVisibilityChange();

  readonly liveState = this.liveStateStore.asReadonly();
  readonly livePulse = this.livePulseStore.asReadonly();

  constructor() {
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
    this.clearReconnectTimer(matchId);
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

    const connected = await this.tryAuthenticatedSse(matchId);
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
      this.setState(matchId, true, this.sseControllers.has(matchId) ? 'sse' : 'polling');
      this.bumpPulse(matchId);
    } catch {
      const nextErrors = (this.errorCount.get(matchId) ?? 0) + 1;
      this.errorCount.set(matchId, nextErrors);
      this.setState(matchId, false, this.sseControllers.has(matchId) ? 'sse' : 'polling');
    }

    const match = this.matchService.getMatchById(matchId);
    if (!match || match.status === MatchStatus.FINISHED) {
      this.stopWatching(matchId);
      return;
    }

    if (!this.sseControllers.has(matchId)) {
      this.scheduleNext(matchId, this.resolveDelay(matchId));
    }
  }

  private async tryAuthenticatedSse(matchId: string): Promise<boolean> {
    if (typeof fetch === 'undefined' || typeof AbortController === 'undefined') return false;
    const backendMatchId = this.matchService.getMatchById(matchId)?.backendMatchId;
    const token = this.authSessionService.currentSession?.tokens.accessToken;
    if (!backendMatchId || !token) return false;

    const controller = new AbortController();
    const url = `${this.appConfig.apiBaseUrl}/matches/${backendMatchId}/live`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'text/event-stream', Authorization: `Bearer ${token}` },
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!response.ok || !response.body || !this.watched.has(matchId)) {
        controller.abort();
        return false;
      }
      this.closeEventSource(matchId);
      this.sseControllers.set(matchId, controller);
      this.clearTimer(matchId);
      this.clearReconnectTimer(matchId);
      this.errorCount.set(matchId, 0);
      this.setState(matchId, true, 'sse');
      void this.consumeSse(matchId, response.body, controller);
      return true;
    } catch {
      controller.abort();
      return false;
    }
  }

  private async consumeSse(
    matchId: string,
    stream: ReadableStream<Uint8Array>,
    controller: AbortController,
  ): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      while (this.watched.has(matchId) && !controller.signal.aborted) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
        let boundary = buffer.indexOf('\n\n');
        while (boundary >= 0) {
          const block = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          const eventName = block.split('\n').find((line) => line.startsWith('event:'))?.slice(6).trim();
          if (eventName === 'match-invite-created' || eventName === 'match-invite-updated') {
            await this.handleRealtimeMessage(matchId);
          }
          boundary = buffer.indexOf('\n\n');
        }
      }
    } catch {
      // La desconexion se refleja abajo y activa recuperacion observable.
    } finally {
      reader.releaseLock();
      if (this.sseControllers.get(matchId) === controller) this.sseControllers.delete(matchId);
      if (this.watched.has(matchId) && !controller.signal.aborted) {
        this.setState(matchId, false, 'sse');
        this.startPolling(matchId);
        this.scheduleReconnect(matchId);
      }
    }
  }

  private async handleRealtimeMessage(matchId: string): Promise<void> {
    if (this.inFlight.has(matchId)) {
      return;
    }

    try {
      await this.runSync(matchId);
      this.setState(matchId, true, this.sseControllers.has(matchId) ? 'sse' : 'polling');
      this.bumpPulse(matchId);
    } catch {
      this.setState(matchId, false, this.sseControllers.has(matchId) ? 'sse' : 'polling');
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
    const controller = this.sseControllers.get(matchId);
    if (controller) {
      controller.abort();
      this.sseControllers.delete(matchId);
    }
  }

  private scheduleReconnect(matchId: string): void {
    this.clearReconnectTimer(matchId);
    const errors = (this.errorCount.get(matchId) ?? 0) + 1;
    this.errorCount.set(matchId, errors);
    const delay = Math.min(1000 * Math.pow(2, errors - 1), 20000);
    this.reconnectTimers.set(matchId, window.setTimeout(() => {
      this.reconnectTimers.delete(matchId);
      if (this.watched.has(matchId)) void this.establishChannel(matchId);
    }, delay));
  }

  private clearReconnectTimer(matchId: string): void {
    const timer = this.reconnectTimers.get(matchId);
    if (timer) window.clearTimeout(timer);
    this.reconnectTimers.delete(matchId);
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
