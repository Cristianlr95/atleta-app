import { Component, computed, inject } from '@angular/core';
import { IonApp, IonRouterOutlet, IonToast } from '@ionic/angular/standalone';
import { NotificationService } from './features/matches/services/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, IonToast],
})
export class AppComponent {
  private readonly notificationService = inject(NotificationService);

  readonly latestUnread = computed(() => this.notificationService.notifications().find((item) => !item.read) ?? null);

  onToastDismissed(): void {
    const item = this.latestUnread();
    if (!item) {
      return;
    }
    this.notificationService.markAsRead(item.id);
  }
}
