import { TestBed } from '@angular/core/testing';
import { TeamApiService } from 'src/app/features/teams/services/team-api.service';
import { SocialApiService } from '../../social/services/social-api.service';
import { MatchLiveEvent } from '../models/match-live-event.models';
import { MatchesApiService } from '../services/matches-api.service';
import { MatchService } from '../services/match.service';
import { VenueService } from '../services/venue.service';
import { InvitationsStore } from './invitations.store';
import { MatchStore } from './match.store';

describe('MatchStore', () => {
  let store: MatchStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MatchStore,
        { provide: MatchService, useValue: {} },
        { provide: MatchesApiService, useValue: {} },
        { provide: SocialApiService, useValue: {} },
        { provide: TeamApiService, useValue: {} },
        { provide: VenueService, useValue: {} },
        { provide: InvitationsStore, useValue: {} },
      ],
    });

    store = TestBed.inject(MatchStore);
    (store as unknown as { processedLiveEventLimit: number }).processedLiveEventLimit = 3;
  });

  it('deduplicates recent live events and prunes old ids', () => {
    expect(store.applyLiveEvent(buildLiveEvent('event-0'))).toBeTrue();
    expect(store.applyLiveEvent(buildLiveEvent('event-0'))).toBeFalse();

    expect(store.applyLiveEvent(buildLiveEvent('event-1'))).toBeTrue();
    expect(store.applyLiveEvent(buildLiveEvent('event-2'))).toBeTrue();
    expect(store.applyLiveEvent(buildLiveEvent('event-3'))).toBeTrue();

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
