import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { InvitationsStore } from '../stores/invitations.store';
import { Invitation, MatchGenderCategory, MatchSize, MatchStatus, MatchType, PlayerInvitationStatus } from '../models/progressive-match.models';
import { MatchService } from './match.service';
import { MatchesApiService } from './matches-api.service';
import { InvitationService } from './invitation.service';
import { NotificationService } from './notification.service';
import { MatchTeamAssignmentPersistenceService } from './match-team-assignment-persistence.service';

describe('MatchService progress notifications', () => {
  it('sends the selected goalkeeper mode in the creation request', async () => {
    const api = jasmine.createSpyObj('MatchesApiService', ['createMatchOrchestrated']);
    api.createMatchOrchestrated.and.returnValue(of({ match: { id: 5, rotativeGoalkeeper: false }, invitations: [] }));
    TestBed.configureTestingModule({ providers: [
      { provide: AuthSessionService, useValue: { currentSession: { user: { atletaUuid: 'captain' } } } },
      { provide: MatchesApiService, useValue: api },
      { provide: InvitationsStore, useValue: {
        invitations: signal<Invitation[]>([]), getMatchInvitations: () => [], upsertInvitations: () => {},
      } },
      { provide: InvitationService, useValue: {} },
      { provide: NotificationService, useValue: {} },
      { provide: MatchTeamAssignmentPersistenceService, useValue: {
        loadAll: () => ({}), saveAll: () => {}, keyForBackendMatch: (id: number) => `backend:${id}`,
      } },
    ] });
    const service = TestBed.inject(MatchService);
    const draft = service.createDraft({
      type: MatchType.INTERNAL, rotativeGoalkeeper: true, modality: MatchSize.FIVE_VS_FIVE,
      genderCategory: MatchGenderCategory.MIXED, team: { id: 1, name: 'Equipo' },
      location: 'Cancha', scheduledAt: '2026-10-30T18:00', minRequired: 10,
    });

    const created = await service.sendInvitations(draft.id, []);
    expect(created?.rotativeGoalkeeper).toBeFalse();

    expect(api.createMatchOrchestrated).toHaveBeenCalledWith(
      jasmine.objectContaining({ match: jasmine.objectContaining({ rotativeGoalkeeper: true }) }),
      jasmine.any(String),
    );
    const reloaded = service.syncMatchFromApi({
      id: 5, modalidad: 'CINCO_VS_CINCO', estado: 'CREADO',
      fechaHoraProgramada: '2026-10-30T18:00:00', rotativeGoalkeeper: true,
    });
    expect(reloaded.rotativeGoalkeeper).toBeTrue();
  });

  it('does not announce incomplete invitation snapshots while loading a confirmed match', fakeAsync(() => {
    const invitations = signal<Invitation[]>([]);
    const notifications = jasmine.createSpyObj('NotificationService', ['notifyAlmostReady', 'notifyMatchConfirmed']);
    TestBed.configureTestingModule({ providers: [
      { provide: AuthSessionService, useValue: { currentSession: { user: { atletaUuid: 'captain' } } } },
      { provide: MatchesApiService, useValue: {} },
      { provide: InvitationsStore, useValue: {
        invitations,
        getMatchInvitations: (id: string) => invitations().filter(invite => invite.matchId === id),
      } },
      { provide: InvitationService, useValue: {} },
      { provide: NotificationService, useValue: notifications },
      { provide: MatchTeamAssignmentPersistenceService, useValue: { loadAll: () => ({}), saveAll: () => {} } },
    ] });
    const service = TestBed.inject(MatchService);
    const match = service.createDraft({
      type: MatchType.INTERNAL, modality: MatchSize.FIVE_VS_FIVE, genderCategory: MatchGenderCategory.MIXED,
      team: { id: 1, name: 'Equipo' }, location: 'Cancha', scheduledAt: new Date(Date.now() + 86_400_000).toISOString(), minRequired: 10,
    });
    const accepted = (index: number): Invitation => ({
      id: String(index), matchId: match.id, targetUuid: `player-${index}`, targetName: `Jugador ${index}`,
      status: PlayerInvitationStatus.ACCEPTED, createdAt: '2026-10-26T00:00:00Z',
    });
    invitations.set([accepted(1)]);
    TestBed.flushEffects();
    tick();
    expect(notifications.notifyAlmostReady).not.toHaveBeenCalled();
    invitations.set(Array.from({ length: 9 }, (_, index) => accepted(index + 1)));
    TestBed.flushEffects();
    tick();
    expect(service.getMatchById(match.id)?.status).toBe(MatchStatus.CONFIRMED);
    expect(notifications.notifyAlmostReady).not.toHaveBeenCalled();
  }));
});
