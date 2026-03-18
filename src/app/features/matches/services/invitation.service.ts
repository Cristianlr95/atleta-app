import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, firstValueFrom, timeout, throwError } from 'rxjs';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { HttpErrorService } from 'src/app/core/services/http-error.service';
import { SocialRequestItem } from 'src/app/features/social/models/social.models';
import { SocialApiService } from 'src/app/features/social/services/social-api.service';
import { Invitation, Match, Player, PlayerInvitationStatus } from '../models/progressive-match.models';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class InvitationService {
  private readonly requestTimeoutMs = 5000;

  constructor(
    private readonly socialApiService: SocialApiService,
    private readonly authSessionService: AuthSessionService,
    private readonly notificationService: NotificationService,
    private readonly httpErrorService: HttpErrorService,
  ) {}

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
        createdAt: new Date().toISOString(),
      },
    ];

    const targets = Array.from(uniqueTargets.values());
    const sent = await this.sendWithBatchFallback(match, session.user.atletaUuid, targets);
    created.push(...sent);

    const nonCreatorInvites = uniqueTargets.size;
    if (nonCreatorInvites > 0) {
      void this.notificationService.notifyInvitationsBatchSent(nonCreatorInvites);
    }

    return created;
  }

  private async sendWithBatchFallback(match: Match, requesterUuid: string, targets: Player[]): Promise<Invitation[]> {
    if (targets.length === 0) {
      return [];
    }

    const backendMatchId = match.backendMatchId ?? Number(match.id.replace('match-', ''));
    const fallbackStatus = PlayerInvitationStatus.PENDING;

    try {
      const batchResponse = await firstValueFrom(
        this.socialApiService.createMatchInvitesBatch({
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
      return (batchResponse ?? []).map((response) => {
        const player = byTarget.get(response.targetUuid);
        return {
          id: `inv-${match.id}-${response.targetUuid}`,
          matchId: match.id,
          backendMatchId: response?.matchId ?? match.backendMatchId,
          backendInviteId: response?.id,
          targetUuid: response.targetUuid,
          targetName: player?.name || response?.targetAlias || 'Jugador',
          status:
            response?.status === 'ACEPTADA'
              ? PlayerInvitationStatus.ACCEPTED
              : response?.status === 'RECHAZADA'
                ? PlayerInvitationStatus.DECLINED
                : fallbackStatus,
          createdAt: new Date().toISOString(),
        } as Invitation;
      });
    } catch {
      // Fallback resiliente: envio individual con concurrencia limitada.
    }

    return this.mapWithConcurrency(targets, 3, async (player) => {
      const localId = `inv-${match.id}-${player.uuid}`;

      try {
        const response = await firstValueFrom(
          this.socialApiService.createMatchInvite({
            matchId: backendMatchId,
            teamId: match.team.id,
            requesterUuid,
            targetUuid: player.uuid,
            message: `Te invito al partido del ${new Date(match.scheduledAt).toLocaleString()}.`,
          }).pipe(
            timeout(this.requestTimeoutMs),
            catchError((error) => this.handleHttpError(error)),
          ),
        );

        return {
          id: localId,
          matchId: match.id,
          backendMatchId: response?.matchId ?? match.backendMatchId,
          backendInviteId: response?.id,
          targetUuid: player.uuid,
          targetName: player.name || response?.targetAlias || 'Jugador',
          status:
            response?.status === 'ACEPTADA'
              ? PlayerInvitationStatus.ACCEPTED
              : response?.status === 'RECHAZADA'
                ? PlayerInvitationStatus.DECLINED
                : fallbackStatus,
          createdAt: new Date().toISOString(),
        } as Invitation;
      } catch {
        return {
          id: localId,
          matchId: match.id,
          backendMatchId: match.backendMatchId,
          targetUuid: player.uuid,
          targetName: player.name,
          status: fallbackStatus,
          createdAt: new Date().toISOString(),
        } as Invitation;
      }
    });
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

  private async mapWithConcurrency<T, R>(
    items: T[],
    concurrency: number,
    worker: (item: T) => Promise<R>,
  ): Promise<R[]> {
    if (items.length === 0) {
      return [];
    }

    const safeConcurrency = Math.max(1, Math.min(concurrency, items.length));
    const results: R[] = new Array(items.length);
    let cursor = 0;

    const run = async (): Promise<void> => {
      while (true) {
        const index = cursor;
        cursor += 1;
        if (index >= items.length) {
          return;
        }
        results[index] = await worker(items[index]);
      }
    };

    await Promise.all(Array.from({ length: safeConcurrency }, () => run()));
    return results;
  }
}
