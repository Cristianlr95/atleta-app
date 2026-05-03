import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { SocialApiService } from 'src/app/features/social/services/social-api.service';
import { NotificationService } from './notification.service';
import { InvitationsStore } from '../stores/invitations.store';

@Injectable({ providedIn: 'root' })
export class NotificationBadgeService {
  private readonly authSessionService = inject(AuthSessionService);
  private readonly invitationsStore = inject(InvitationsStore);
  private readonly notificationService = inject(NotificationService);
  private readonly socialApiService = inject(SocialApiService);

  private readonly serverPendingCount = signal(0);

  readonly totalPending = computed(() => {
    return (
      this.serverPendingCount() +
      this.invitationsStore.pendingInvitations().length +
      this.notificationService.pendingCount
    );
  });

  async refresh(): Promise<void> {
    const session = this.authSessionService.currentSession;
    if (!session) {
      this.serverPendingCount.set(0);
      return;
    }

    const response = await firstValueFrom(this.socialApiService.getUnreadNotificationCount());
    this.serverPendingCount.set(Math.max(0, response.unreadCount ?? 0));
  }
}
