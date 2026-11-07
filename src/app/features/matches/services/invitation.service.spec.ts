import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { HttpErrorService } from 'src/app/core/services/http-error.service';
import { SocialApiService } from '../../social/services/social-api.service';
import {
  Invitation,
  InvitationDeliveryStatus,
  Match,
  Player,
  PlayerInvitationStatus,
} from '../models/progressive-match.models';
import { InvitationService } from './invitation.service';
import { NotificationService } from './notification.service';

describe('InvitationService', () => {
  let service: InvitationService;
  let socialApi: jasmine.SpyObj<SocialApiService>;

  beforeEach(() => {
    socialApi = jasmine.createSpyObj<SocialApiService>('SocialApiService', [
      'createMatchInvitesBatchDetailed',
    ]);

    TestBed.configureTestingModule({
      providers: [
        InvitationService,
        { provide: SocialApiService, useValue: socialApi },
        {
          provide: AuthSessionService,
          useValue: { currentSession: { user: { atletaUuid: 'creator', nombre: 'Creador' } } },
        },
        {
          provide: NotificationService,
          useValue: { notifyInvitationsBatchSent: jasmine.createSpy().and.resolveTo() },
        },
        { provide: HttpErrorService, useValue: { map: (error: unknown) => error } },
      ],
    });

    service = TestBed.inject(InvitationService);
  });

  it('reports sent and failed recipients without converting failures to pending delivery', async () => {
    socialApi.createMatchInvitesBatchDetailed.and.returnValue(of([
      {
        targetUuid: 'player-1',
        status: 'SENT',
        invitation: socialInvite(101, 'player-1'),
      },
      {
        targetUuid: 'player-2',
        status: 'FAILED',
        invitation: null,
        message: 'Jugador no encontrado',
      },
    ]));

    const result = await service.sendInvitations(match(), [player('player-1'), player('player-2')]);

    expect(result.find((item) => item.targetUuid === 'player-1')?.deliveryStatus)
      .toBe(InvitationDeliveryStatus.SENT);
    const failed = result.find((item) => item.targetUuid === 'player-2');
    expect(failed?.deliveryStatus).toBe(InvitationDeliveryStatus.FAILED);
    expect(failed?.deliveryMessage).toBe('Jugador no encontrado');
  });

  it('retries only failed recipients', async () => {
    socialApi.createMatchInvitesBatchDetailed.and.returnValue(of([
      {
        targetUuid: 'player-2',
        status: 'ALREADY_SENT',
        invitation: socialInvite(102, 'player-2'),
      },
    ]));

    const invitations: Invitation[] = [
      invitation('player-1', InvitationDeliveryStatus.SENT),
      invitation('player-2', InvitationDeliveryStatus.FAILED),
    ];
    const result = await service.retryFailedInvitations(match(), invitations);

    expect(socialApi.createMatchInvitesBatchDetailed).toHaveBeenCalledWith(
      jasmine.objectContaining({ targetUuids: ['player-2'] }),
    );
    expect(result.length).toBe(1);
    expect(result[0].deliveryStatus).toBe(InvitationDeliveryStatus.SENT);
    expect(result[0].backendInviteId).toBe(102);
  });
});

function match(): Match {
  return {
    id: 'match-42',
    backendMatchId: 42,
    creatorUuid: 'creator',
    creatorName: 'Creador',
    team: { id: 7, name: 'Atleta' },
    scheduledAt: '2026-07-22T20:00:00.000Z',
  } as Match;
}

function player(uuid: string): Player {
  return { uuid, name: uuid, role: 'JUGADOR', position: 'Delantero' };
}

function invitation(targetUuid: string, deliveryStatus: InvitationDeliveryStatus): Invitation {
  return {
    id: `inv-match-42-${targetUuid}`,
    matchId: 'match-42',
    backendMatchId: 42,
    targetUuid,
    targetName: targetUuid,
    status: PlayerInvitationStatus.PENDING,
    deliveryStatus,
    createdAt: '2026-07-21T20:00:00.000Z',
  };
}

function socialInvite(id: number, targetUuid: string) {
  return {
    id,
    type: 'MATCH_INVITE' as const,
    status: 'PENDIENTE' as const,
    requesterUuid: 'creator',
    requesterAlias: 'Creador',
    targetUuid,
    targetAlias: targetUuid,
    matchId: 42,
  };
}
