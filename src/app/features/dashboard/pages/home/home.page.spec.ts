import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { MatchHistoryService } from 'src/app/features/matches/services/match-history.service';
import { NotificationBadgeService } from 'src/app/features/matches/services/notification-badge.service';
import { InvitationsStore } from 'src/app/features/matches/stores/invitations.store';
import { RatingsApiService } from 'src/app/features/ratings/services/ratings-api.service';
import { TeamApiService } from 'src/app/features/teams/services/team-api.service';
import { HomePage } from './home.page';

describe('HomePage OVR', () => {
  let fixture: ComponentFixture<HomePage>;
  let rating: number | null;

  beforeEach(async () => {
    rating = 63.4;
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        { provide: AuthSessionService, useValue: { currentSession: { user: { atletaUuid: 'player-1', nombre: 'Ana' } } } },
        { provide: NavigationService, useValue: {} },
        { provide: RatingsApiService, useValue: { getOverall: () => of(rating === null ? null : { hybridOVR: rating }) } },
        { provide: MatchHistoryService, useValue: { getPlayerHistory: () => of([]) } },
        { provide: TeamApiService, useValue: { getByPlayer: () => of([]) } },
        { provide: InvitationsStore, useValue: { loadPendingInvitations: async () => {}, pendingInvitations: () => [] } },
        { provide: NotificationBadgeService, useValue: { refresh: async () => {}, totalPending: () => 0 } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HomePage);
  });

  for (const scenario of [
    { value: 63.4, expected: '63' },
    { value: 0, expected: '0' },
    { value: null, expected: '--' },
  ]) {
    it(`shows ${scenario.expected} for API OVR ${scenario.value}`, async () => {
      rating = scenario.value;
      fixture.componentInstance.ionViewWillEnter();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.home-metric strong').textContent.trim()).toBe(scenario.expected);
    });
  }
});
