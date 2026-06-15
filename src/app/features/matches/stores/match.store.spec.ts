import { TestBed } from '@angular/core/testing';
import { SocialApiService } from '../../social/services/social-api.service';
import { MatchLiveEvent } from '../models/match-live-event.models';
import { MatchLiveEventRegistryService } from '../services/match-live-event-registry.service';
import { MatchTeamPositionService } from '../services/match-team-position.service';
import { MatchVenueResolverService } from '../services/match-venue-resolver.service';
import { MatchesApiService } from '../services/matches-api.service';
import { MatchService } from '../services/match.service';
import { InvitationsStore } from './invitations.store';
import { MatchStore } from './match.store';

describe('MatchStore', () => {
  let store: MatchStore;
  let liveEventRegistry: MatchLiveEventRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MatchStore,
        { provide: MatchService, useValue: {} },
        { provide: MatchesApiService, useValue: {} },
        { provide: SocialApiService, useValue: {} },
        { provide: MatchTeamPositionService, useValue: {} },
        { provide: MatchVenueResolverService, useValue: {} },
        { provide: InvitationsStore, useValue: {} },
      ],
    });

    store = TestBed.inject(MatchStore);
    liveEventRegistry = TestBed.inject(MatchLiveEventRegistryService);
    liveEventRegistry.setLimitForTesting(3);
  });

  it('delegates live event deduplication to the registry', () => {
    expect(store.applyLiveEvent(buildLiveEvent('event-0'))).toBeTrue();
    expect(store.applyLiveEvent(buildLiveEvent('event-0'))).toBeFalse();

    expect(liveEventRegistry.hasProcessed('event-0')).toBeTrue();
  });

  it('allows pruned live events to be processed again', () => {
    expect(store.applyLiveEvent(buildLiveEvent('event-0'))).toBeTrue();
    store.applyLiveEvent(buildLiveEvent('event-1'));
    store.applyLiveEvent(buildLiveEvent('event-2'));
    store.applyLiveEvent(buildLiveEvent('event-3'));

    expect(store.applyLiveEvent(buildLiveEvent('event-3'))).toBeFalse();
    expect(store.applyLiveEvent(buildLiveEvent('event-0'))).toBeTrue();
  });
});

function buildLiveEvent(id: string): MatchLiveEvent {
  return {
    id,
    type: 'TEAM_UPDATED',
    backendMatchId: 10,
    createdAt: '2026-05-04T20:00:00',
  };
}
