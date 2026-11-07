import { Injectable, inject } from '@angular/core';
import { MatchService } from 'src/app/features/matches/services/match.service';
import { NotificationBadgeService } from 'src/app/features/matches/services/notification-badge.service';
import { NotificationService } from 'src/app/features/matches/services/notification.service';
import { PushTokenSyncService } from 'src/app/features/matches/services/push-token-sync.service';
import { InvitationsStore } from 'src/app/features/matches/stores/invitations.store';
import { MatchStore } from 'src/app/features/matches/stores/match.store';
import { MvpVoteStore } from 'src/app/features/matches/stores/mvp-vote.store';
import { SocialFacadeService } from 'src/app/features/social/services/social-facade.service';
import { PlayerPositionStateService } from 'src/app/features/user/services/player-position-state.service';

@Injectable({ providedIn: 'root' })
export class SessionDataCleanupService {
  private readonly matchService = inject(MatchService);
  private readonly matchStore = inject(MatchStore);
  private readonly mvpVoteStore = inject(MvpVoteStore);
  private readonly invitationsStore = inject(InvitationsStore);
  private readonly socialFacadeService = inject(SocialFacadeService);
  private readonly notificationService = inject(NotificationService);
  private readonly notificationBadgeService = inject(NotificationBadgeService);
  private readonly playerPositionStateService = inject(PlayerPositionStateService);
  private readonly pushTokenSyncService = inject(PushTokenSyncService);

  clear(playerUuid?: string): void {
    const cleanupActions: Array<() => void> = [
      () => this.matchService.clearSessionState(),
      () => this.matchStore.clear(),
      () => this.mvpVoteStore.clear(),
      () => this.invitationsStore.clear(),
      () => this.socialFacadeService.clearSessionState(),
      () => this.notificationService.clear(),
      () => this.notificationBadgeService.clear(),
    ];

    if (playerUuid) {
      cleanupActions.push(
        () => this.playerPositionStateService.clearForPlayer(playerUuid),
        () => this.pushTokenSyncService.clearForUser(playerUuid),
      );
    }

    for (const cleanup of cleanupActions) {
      try {
        cleanup();
      } catch {
        // Logout is best-effort across independent browser caches.
      }
    }
  }
}
