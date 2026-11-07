import { computed, Injectable, inject, signal } from '@angular/core';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { ErrorMapperService } from 'src/app/core/services/error-mapper.service';
import { SocialRequestItem } from '../../social/models/social.models';
import {
  Invitation,
  InvitationDeliveryStatus,
  PlayerInvitationStatus,
} from '../models/progressive-match.models';
import { InvitationService } from '../services/invitation.service';

@Injectable({ providedIn: 'root' })
export class InvitationsStore {
  private readonly invitationApi = inject(InvitationService);
  private readonly errorMapper = inject(ErrorMapperService);
  private readonly authSessionService = inject(AuthSessionService);
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
            : invite.status === 'LISTA_ESPERA'
              ? PlayerInvitationStatus.WAITLIST
            : invite.status === 'RECHAZADA'
              ? PlayerInvitationStatus.DECLINED
              : invite.status === 'CANCELADA'
                ? PlayerInvitationStatus.DECLINED
              : PlayerInvitationStatus.PENDING,
        deliveryStatus: InvitationDeliveryStatus.SENT,
        createdAt: invite.createdAt ?? new Date().toISOString(),
        respondedAt: invite.respondedAt,
      }))
      .filter((invite) => !currentUserUuid || invite.targetUuid === currentUserUuid);
      const outgoing = this.invitationStore().filter(
        (invitation) => !!currentUserUuid && invitation.targetUuid !== currentUserUuid,
      );
      this.invitationStore.set([...mapped, ...outgoing]);
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
      const response = await this.invitationApi.respondInviteByBackendId(current.backendInviteId, accept);
      if (!response) {
        throw new Error('No se pudo actualizar la invitacion.');
      }
      const resolved: Invitation = {
        ...optimistic,
        status: response.status === 'LISTA_ESPERA'
          ? PlayerInvitationStatus.WAITLIST
          : response.status === 'ACEPTADA'
            ? PlayerInvitationStatus.ACCEPTED
            : PlayerInvitationStatus.DECLINED,
        respondedAt: response.respondedAt ?? optimistic.respondedAt,
      };
      this.invitationStore.update((items) => items.map((item) => item.id === invitationId ? resolved : item));
      return resolved;
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

  hydrateMatchInvitations(
    localMatchId: string,
    backendMatchId: number,
    invites: SocialRequestItem[],
  ): void {
    if (invites.length === 0) {
      return;
    }

    const current = this.invitationStore().filter((item) => item.matchId === localMatchId);
    const currentByTarget = new Map(current.map((item) => [item.targetUuid, item]));
    const serverTargets = new Set(invites.map((item) => item.targetUuid));
    const hydrated: Invitation[] = invites.map((invite) => {
      const previous = currentByTarget.get(invite.targetUuid);
      return {
        id: previous?.id ?? `api-${invite.id}`,
        matchId: localMatchId,
        backendMatchId,
        backendInviteId: invite.id,
        targetUuid: invite.targetUuid,
        targetName: previous?.targetName || invite.targetAlias || 'Jugador',
        status:
          invite.status === 'ACEPTADA'
            ? PlayerInvitationStatus.ACCEPTED
            : invite.status === 'LISTA_ESPERA'
              ? PlayerInvitationStatus.WAITLIST
            : invite.status === 'RECHAZADA'
              ? PlayerInvitationStatus.DECLINED
              : invite.status === 'CANCELADA'
                ? PlayerInvitationStatus.DECLINED
              : PlayerInvitationStatus.PENDING,
        deliveryStatus: InvitationDeliveryStatus.SENT,
        createdAt: invite.createdAt ?? previous?.createdAt ?? new Date().toISOString(),
        respondedAt: invite.respondedAt,
      };
    });
    const unresolved = current.filter(
      (item) =>
        !serverTargets.has(item.targetUuid) &&
        (item.deliveryStatus === InvitationDeliveryStatus.FAILED ||
          item.deliveryStatus === InvitationDeliveryStatus.RETRYING),
    );
    const otherMatches = this.invitationStore().filter((item) => item.matchId !== localMatchId);
    this.invitationStore.set([...hydrated, ...unresolved, ...otherMatches]);
  }

  setDeliveryStatus(
    invitationIds: string[],
    deliveryStatus: InvitationDeliveryStatus,
    deliveryMessage?: string,
  ): void {
    const ids = new Set(invitationIds);
    this.invitationStore.update((items) =>
      items.map((item) =>
        ids.has(item.id) ? { ...item, deliveryStatus, deliveryMessage } : item,
      ),
    );
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

  clear(): void {
    this.invitationStore.set([]);
    this.loadingStore.set(false);
    this.errorStore.set(null);
  }
}
