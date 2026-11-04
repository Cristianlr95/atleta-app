import { Component, computed, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { NotificationService } from './features/matches/services/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonicModule],
})
export class AppComponent {
  private readonly notificationService = inject(NotificationService);

  readonly latestUnread = computed(() => this.notificationService.notifications().find((item) => !item.read) ?? null);
  readonly notificationToastButtons = [{ text: 'Cerrar', role: 'cancel' }];

  onToastDismissed(): void {
    const item = this.latestUnread();
    if (!item) {
      return;
    }
    this.notificationService.markAsRead(item.id);
  }

}
