import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { AppToastService } from 'src/app/core/services/app-toast.service';
import { ErrorMapperService } from 'src/app/core/services/error-mapper.service';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { TeamApiService } from 'src/app/features/teams/services/team-api.service';
import { MatchService } from '../../services/match.service';
import { NotificationBadgeService } from '../../services/notification-badge.service';
import { MatchType } from '../../models/progressive-match.models';
import { MatchesCreatePage } from './matches-create.page';

describe('MatchesCreatePage convocatoria', () => {
  let page: MatchesCreatePage;
  let matchService: jasmine.SpyObj<MatchService>;

  beforeEach(() => {
    matchService = jasmine.createSpyObj('MatchService', ['createDraft', 'sendInvitations']);
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthSessionService, useValue: { currentSession: { user: { atletaUuid: 'captain' } } } },
        { provide: TeamApiService, useValue: { getActiveMembers: () => of([
          { playerUuid: 'captain', alias: 'Capitán' },
          { playerUuid: 'player-1', alias: 'Ana' },
        ]) } },
        { provide: MatchService, useValue: matchService },
        { provide: NavigationService, useValue: {} },
        { provide: AppToastService, useValue: { success: () => {}, info: () => {} } },
        { provide: ErrorMapperService, useValue: {} },
        { provide: Router, useValue: { navigate: async () => true } },
        { provide: NotificationBadgeService, useValue: {} },
      ],
    });
    page = TestBed.runInInjectionContext(() => new MatchesCreatePage());
  });

  it('counts the creator once and removes duplicate invitees', () => {
    page.onSelectionChange(['captain', 'player-1', 'player-1']);
    expect(page.selectedPlayerIds()).toEqual(['player-1']);
    expect(page.totalInvitedWithCreator()).toBe(2);
    page.onSelectionChange([]);
    expect(page.totalInvitedWithCreator()).toBe(1);
  });

  for (const minimum of [10, 12, 14]) {
    it(`requires ${minimum - 1} other players for a minimum of ${minimum}`, () => {
      page.step.set(2);
      page.schedule.update(value => ({ ...value, minRequired: minimum }));
      const others = Array.from({ length: minimum - 2 }, (_, index) => `player-${index}`);
      page.onSelectionChange(['captain', ...others]);
      expect(page.canContinue()).toBeFalse();
      expect(page.viabilityLabel()).toContain('Faltan 1');
      page.onSelectionChange(['captain', ...others, 'last-player']);
      expect(page.canContinue()).toBeTrue();
      expect(page.totalInvitedWithCreator()).toBe(minimum);
    });
  }

  it('does not offer the creator as an invitation recipient', async () => {
    page.schedule.update(value => ({ ...value, teamId: 1 }));
    await page.onRetryLoadPlayers();
    await Promise.resolve();
    expect(page.teamPlayers().map(player => player.uuid)).toEqual(['player-1']);
  });

  it('sends exactly the unique invitees shown by the selection', async () => {
    page.teams.set([{ id: 1, nombre: 'Equipo' }]);
    page.schedule.update(value => ({ ...value, teamId: 1 }));
    page.selectedMatchType.set(MatchType.INTERNAL);
    page.rotativeGoalkeeper.set(true);
    page.teamPlayers.set([
      { uuid: 'captain', name: 'Capitán', position: 'Defensa', role: 'CAPITAN' },
      { uuid: 'player-1', name: 'Ana', position: 'Defensa', role: 'JUGADOR' },
    ]);
    page.onSelectionChange(['captain', 'player-1', 'player-1']);
    matchService.createDraft.and.returnValue({ id: 'draft' } as never);
    matchService.sendInvitations.and.resolveTo({ id: 'draft', backendMatchId: 4 } as never);
    await page.onSendInvitations();
    expect(matchService.createDraft).toHaveBeenCalledWith(jasmine.objectContaining({ rotativeGoalkeeper: true }));
    expect(matchService.sendInvitations).toHaveBeenCalledOnceWith('draft', [page.teamPlayers()[1]]);
    expect(page.selectedPlayerIds().length).toBe(1);
  });
});
