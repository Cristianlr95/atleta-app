import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, firstValueFrom, timeout, throwError } from 'rxjs';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { HttpErrorService } from 'src/app/core/services/http-error.service';
import { MatchInviteDeliveryResult, SocialRequestItem } from 'src/app/features/social/models/social.models';
import { SocialApiService } from 'src/app/features/social/services/social-api.service';
import {
  Invitation,
  InvitationDeliveryStatus,
  Match,
  Player,
  PlayerInvitationStatus,
} from '../models/progressive-match.models';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class InvitationService {
  private readonly socialApiService = inject(SocialApiService);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly notificationService = inject(NotificationService);
  private readonly httpErrorService = inject(HttpErrorService);
  private readonly requestTimeoutMs = 5000;

  async sendInvitations(match: Match, players: Player[]): Promise<Invitation[]> {
    const session = this.authSessionService.currentSession;
    if (!session) {
      return [];
    }

    const creatorUuid = session.user.atletaUuid;
    const creatorPlayer: Player = {
      uuid: creatorUuid,
      name: match.creatorName || 'Creador',
      role: 'CAPITAN',
      position: 'Creador',
    };
    const uniqueTargets = new Map<string, Player>();
    for (const player of players) {
      if (player.uuid === creatorUuid) {
        continue;
      }
      uniqueTargets.set(player.uuid, player);
    }

    const created: Invitation[] = [
      {
        id: `inv-${match.id}-${creatorPlayer.uuid}`,
        matchId: match.id,
        backendMatchId: match.backendMatchId,
        targetUuid: creatorPlayer.uuid,
        targetName: creatorPlayer.name,
        status: PlayerInvitationStatus.ACCEPTED,
        deliveryStatus: InvitationDeliveryStatus.SENT,
        createdAt: new Date().toISOString(),
      },
    ];

    const targets = Array.from(uniqueTargets.values());
    const sent = await this.deliverTargets(match, session.user.atletaUuid, targets);
    created.push(...sent);

    const deliveredCount = sent.filter(
      (invitation) => invitation.deliveryStatus === InvitationDeliveryStatus.SENT,
    ).length;
    if (deliveredCount > 0) {
      void this.notificationService.notifyInvitationsBatchSent(deliveredCount);
    }

    return created;
  }

  async retryFailedInvitations(match: Match, failed: Invitation[]): Promise<Invitation[]> {
    const session = this.authSessionService.currentSession;
    if (!session) {
      throw new Error('Debes iniciar sesion para reintentar invitaciones.');
    }

    const targets: Player[] = failed
      .filter((invitation) => invitation.deliveryStatus === InvitationDeliveryStatus.FAILED)
      .map((invitation) => ({
        uuid: invitation.targetUuid,
        name: invitation.targetName,
        role: 'JUGADOR',
        position: '',
      }));
    return this.deliverTargets(match, session.user.atletaUuid, targets);
  }

  private async deliverTargets(match: Match, requesterUuid: string, targets: Player[]): Promise<Invitation[]> {
    if (targets.length === 0) {
      return [];
    }

    const backendMatchId = match.backendMatchId ?? Number(match.id.replace('match-', ''));
    const results = await firstValueFrom(
      this.socialApiService.createMatchInvitesBatchDetailed({
          matchId: backendMatchId,
          teamId: match.team.id,
          requesterUuid,
          targetUuids: targets.map((item) => item.uuid),
          message: `Te invito al partido del ${new Date(match.scheduledAt).toLocaleString()}.`,
      }).pipe(
        timeout(this.requestTimeoutMs),
        catchError((error) => this.handleHttpError(error)),
      ),
    );

    const byTarget = new Map(targets.map((item) => [item.uuid, item]));
    return (results ?? []).map((result) => this.toInvitation(match, byTarget.get(result.targetUuid), result));
  }

  private toInvitation(match: Match, player: Player | undefined, result: MatchInviteDeliveryResult): Invitation {
    const response = result.invitation;
    return {
      id: `inv-${match.id}-${result.targetUuid}`,
      matchId: match.id,
      backendMatchId: response?.matchId ?? match.backendMatchId,
      backendInviteId: response?.id,
      targetUuid: result.targetUuid,
      targetName: player?.name || response?.targetAlias || 'Jugador',
      status:
        response?.status === 'ACEPTADA'
          ? PlayerInvitationStatus.ACCEPTED
          : response?.status === 'RECHAZADA'
            ? PlayerInvitationStatus.DECLINED
            : PlayerInvitationStatus.PENDING,
      deliveryStatus:
        result.status === 'FAILED' ? InvitationDeliveryStatus.FAILED : InvitationDeliveryStatus.SENT,
      deliveryMessage: result.message ?? undefined,
      createdAt: response?.createdAt ?? new Date().toISOString(),
      respondedAt: response?.respondedAt,
    };
  }

  async fetchInvitesForMatch(backendMatchId: number): Promise<SocialRequestItem[]> {
    const session = this.authSessionService.currentSession;
    if (!session || !backendMatchId) {
      return [];
    }

    const invites = await firstValueFrom(
      this.socialApiService.getMatchInvites(session.user.atletaUuid).pipe(
        timeout(this.requestTimeoutMs),
        catchError((error) => this.handleHttpError(error)),
      ),
    );
    return invites.filter((item) => item.matchId === backendMatchId);
  }

  async fetchInvitesForCurrentUser(): Promise<SocialRequestItem[]> {
    const session = this.authSessionService.currentSession;
    if (!session) {
      return [];
    }
    return firstValueFrom(
      this.socialApiService.getMatchInvites(session.user.atletaUuid).pipe(
        timeout(this.requestTimeoutMs),
        catchError((error) => this.handleHttpError(error)),
      ),
    );
  }

  async respondInviteByBackendId(backendInviteId: number, accept: boolean): Promise<boolean> {
    const session = this.authSessionService.currentSession;
    if (!session) {
      return false;
    }

    await firstValueFrom(
      this.socialApiService.respondMatchInvite(backendInviteId, {
        actorUuid: session.user.atletaUuid,
        accept,
      }).pipe(
        timeout(this.requestTimeoutMs),
        catchError((error) => this.handleHttpError(error)),
      ),
    );
    return true;
  }

  private handleHttpError(error: unknown) {
    if (error instanceof HttpErrorResponse) {
      return throwError(() => this.httpErrorService.map(error));
    }
    return throwError(() => error);
  }

}
