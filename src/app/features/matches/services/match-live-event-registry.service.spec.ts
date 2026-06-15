import { MatchLiveEventRegistryService } from './match-live-event-registry.service';

describe('MatchLiveEventRegistryService', () => {
  let service: MatchLiveEventRegistryService;

  beforeEach(() => {
    service = new MatchLiveEventRegistryService();
    service.setLimitForTesting(3);
  });

  it('deduplicates recent live events and prunes old ids', () => {
    service.markProcessed('event-0');
    expect(service.hasProcessed('event-0')).toBeTrue();

    service.markProcessed('event-1');
    service.markProcessed('event-2');
    service.markProcessed('event-3');

    expect(service.hasProcessed('event-3')).toBeTrue();
    expect(service.hasProcessed('event-0')).toBeFalse();
  });

  it('clears processed live event ids', () => {
    service.markProcessed('event-0');

    service.clear();

    expect(service.hasProcessed('event-0')).toBeFalse();
    expect(service.processedLiveEvents()).toEqual({});
  });
});
