import { TestBed } from '@angular/core/testing';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { ErrorMapperService } from 'src/app/core/services/error-mapper.service';
import {
  InvitationDeliveryStatus,
  PlayerInvitationStatus,
} from '../models/progressive-match.models';
import { InvitationService } from '../services/invitation.service';
import { InvitationsStore } from './invitations.store';

describe('InvitationsStore', () => {
  let store: InvitationsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        InvitationsStore,
        { provide: InvitationService, useValue: {} },
        { provide: ErrorMapperService, useValue: { toUserMessage: () => 'Error' } },
        {
          provide: AuthSessionService,
          useValue: { currentSession: { user: { atletaUuid: 'creator' } } },
        },
      ],
    });
    store = TestBed.inject(InvitationsStore);
  });

  it('hydrates confirmed deliveries and keeps unresolved failures for selective retry', () => {
    store.upsertInvitations([
      {
        id: 'inv-match-42-player-1',
        matchId: 'match-42',
        backendMatchId: 42,
        targetUuid: 'player-1',
        targetName: 'Uno',
        status: PlayerInvitationStatus.PENDING,
        deliveryStatus: InvitationDeliveryStatus.PENDING,
        createdAt: '2026-07-21T20:00:00.000Z',
      },
      {
        id: 'inv-match-42-player-2',
        matchId: 'match-42',
        backendMatchId: 42,
        targetUuid: 'player-2',
        targetName: 'Dos',
        status: PlayerInvitationStatus.PENDING,
        deliveryStatus: InvitationDeliveryStatus.FAILED,
        deliveryMessage: 'Entrega no confirmada',
        createdAt: '2026-07-21T20:00:00.000Z',
      },
    ]);

    store.hydrateMatchInvitations('match-42', 42, [
      {
        id: 101,
        type: 'MATCH_INVITE',
        status: 'PENDIENTE',
        requesterUuid: 'creator',
        requesterAlias: 'Creador',
        targetUuid: 'player-1',
        targetAlias: 'Uno',
        matchId: 42,
      },
    ]);

    const invitations = store.getMatchInvitations('match-42');
    expect(invitations.find((item) => item.targetUuid === 'player-1')?.deliveryStatus)
      .toBe(InvitationDeliveryStatus.SENT);
    expect(invitations.find((item) => item.targetUuid === 'player-2')?.deliveryStatus)
      .toBe(InvitationDeliveryStatus.FAILED);
  });
});
