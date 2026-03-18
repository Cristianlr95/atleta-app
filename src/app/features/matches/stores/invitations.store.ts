import { computed, Injectable, signal } from '@angular/core';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { ErrorMapperService } from 'src/app/core/services/error-mapper.service';
import { Invitation, PlayerInvitationStatus } from '../models/progressive-match.models';
import { InvitationService } from '../services/invitation.service';

@Injectable({ providedIn: 'root' })
export class InvitationsStore {
  private readonly invitationStore = signal<Invitation[]>([]);
  private readonly loadingStore = signal(false);
  private readonly errorStore = signal<string | null>(null);
  private readonly requestTimeoutMs = 5000;

  readonly invitations = this.invitationStore.asReadonly();
  readonly loading = this.loadingStore.asReadonly();
  readonly error = this.errorStore.asReadonly();
  readonly pendingInvitations = computed(() =>
    this.invitationStore().filter((invitation) => {
      const currentUserUuid = this.authSessionService.currentSession?.user?.atletaUuid;
      if (!currentUserUuid) {
        return false;
      }

      if (invitation.targetUuid !== currentUserUuid) {
        return false;
      }

      return (
        invitation.status === PlayerInvitationStatus.PENDING ||
        invitation.status === PlayerInvitationStatus.INVITED
      );
    }),
  );

  constructor(
    private readonly invitationApi: InvitationService,
    private readonly errorMapper: ErrorMapperService,
    private readonly authSessionService: AuthSessionService,
  ) {}

  async loadPendingInvitations(): Promise<boolean> {
    this.loadingStore.set(true);
    this.errorStore.set(null);

    try {
      const invites = await this.invitationApi.fetchInvitesForCurrentUser();
      const currentUserUuid = this.authSessionService.currentSession?.user?.atletaUuid;
      const mapped: Invitation[] = invites.map((invite) => ({
        id: `api-${invite.id}`,
        matchId: `match-${invite.matchId ?? 0}`,
        backendMatchId: invite.matchId ?? undefined,
        backendInviteId: invite.id,
        targetUuid: invite.targetUuid,
        targetName: invite.targetAlias,
        status:
          invite.status === 'ACEPTADA'
            ? PlayerInvitationStatus.ACCEPTED
            : invite.status === 'RECHAZADA'
              ? PlayerInvitationStatus.DECLINED
              : PlayerInvitationStatus.PENDING,
        createdAt: invite.createdAt ?? new Date().toISOString(),
        respondedAt: invite.respondedAt,
      }))
      .filter((invite) => !currentUserUuid || invite.targetUuid === currentUserUuid);
      this.invitationStore.set(mapped);
      return true;
    } catch (error) {
      this.errorStore.set(this.errorMapper.toUserMessage(error, 'invitations'));
      return false;
    } finally {
      this.loadingStore.set(false);
    }
  }

  async respondInvitation(invitationId: string, accept: boolean): Promise<Invitation | null> {
    const current = this.invitationStore().find((item) => item.id === invitationId);
    if (!current || !current.backendInviteId) {
      return null;
    }

    const previousStatus = current.status;
    const nextStatus = accept ? PlayerInvitationStatus.ACCEPTED : PlayerInvitationStatus.DECLINED;
    const optimistic: Invitation = {
      ...current,
      status: nextStatus,
      respondedAt: new Date().toISOString(),
    };

    this.invitationStore.update((items) =>
      items.map((item) => (item.id === invitationId ? optimistic : item)),
    );

    try {
      await this.invitationApi.respondInviteByBackendId(current.backendInviteId, accept);
      return optimistic;
    } catch (error) {
      this.invitationStore.update((items) =>
        items.map((item) =>
          item.id === invitationId
            ? { ...item, status: previousStatus, respondedAt: current.respondedAt }
            : item,
        ),
      );
      this.errorStore.set(this.errorMapper.toUserMessage(error, 'invitations'));
      return null;
    }
  }

  getMatchInvitations(matchId: string): Invitation[] {
    return this.invitationStore().filter((item) => item.matchId === matchId);
  }

  syncMatchInvitations(
    matchId: string,
    updates: Array<{ backendInviteId: number; status: PlayerInvitationStatus }>,
  ): void {
    if (updates.length === 0) {
      return;
    }

    const statusById = new Map(updates.map((item) => [item.backendInviteId, item.status]));
    this.invitationStore.update((items) =>
      items.map((item) => {
        if (item.matchId !== matchId || !item.backendInviteId) {
          return item;
        }
        const nextStatus = statusById.get(item.backendInviteId);
        if (!nextStatus || nextStatus === item.status) {
          return item;
        }
        return {
          ...item,
          status: nextStatus,
          respondedAt:
            nextStatus === PlayerInvitationStatus.ACCEPTED ||
            nextStatus === PlayerInvitationStatus.DECLINED
              ? item.respondedAt ?? new Date().toISOString()
              : item.respondedAt,
        };
      }),
    );
  }

  upsertInvitations(invitations: Invitation[]): void {
    if (invitations.length === 0) {
      return;
    }

    const incoming = new Map(invitations.map((item) => [item.id, item]));
    const preserved = this.invitationStore().filter((item) => !incoming.has(item.id));
    this.invitationStore.set([...invitations, ...preserved]);
  }

  replaceMatchInvitesByBackendMatch(
    backendMatchId: number,
    updates: Array<{ backendInviteId: number; status: PlayerInvitationStatus }>,
  ): void {
    if (!backendMatchId || updates.length === 0) {
      return;
    }

    const statusById = new Map(updates.map((item) => [item.backendInviteId, item.status]));
    this.invitationStore.update((items) =>
      items.map((item) => {
        if (item.backendMatchId !== backendMatchId || !item.backendInviteId) {
          return item;
        }
        const nextStatus = statusById.get(item.backendInviteId);
        if (!nextStatus || nextStatus === item.status) {
          return item;
        }
        return {
          ...item,
          status: nextStatus,
          respondedAt:
            nextStatus === PlayerInvitationStatus.ACCEPTED ||
            nextStatus === PlayerInvitationStatus.DECLINED
              ? item.respondedAt ?? new Date().toISOString()
              : item.respondedAt,
        };
      }),
    );
  }
}
