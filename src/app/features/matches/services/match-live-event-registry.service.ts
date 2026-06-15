import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MatchLiveEventRegistryService {
  private processedLiveEventLimit = 500;
  private processedLiveEventIds: string[] = [];
  private readonly processedLiveEventsStore = signal<Record<string, true>>({});

  readonly processedLiveEvents = this.processedLiveEventsStore.asReadonly();

  hasProcessed(eventId: string): boolean {
    return !!this.processedLiveEventsStore()[eventId];
  }

  markProcessed(eventId: string): void {
    this.processedLiveEventIds.push(eventId);
    const overflow = this.processedLiveEventIds.length - this.processedLiveEventLimit;
    const prunedIds = overflow > 0 ? this.processedLiveEventIds.splice(0, overflow) : [];

    this.processedLiveEventsStore.update((state) => {
      const next: Record<string, true> = { ...state, [eventId]: true };
      for (const prunedId of prunedIds) {
        delete next[prunedId];
      }
      return next;
    });
  }

  clear(): void {
    this.processedLiveEventsStore.set({});
    this.processedLiveEventIds = [];
  }

  setLimitForTesting(limit: number): void {
    this.processedLiveEventLimit = limit;
  }
}
