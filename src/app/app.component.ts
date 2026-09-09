import { Component, HostListener, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
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
  private readonly router = inject(Router);

  readonly latestUnread = computed(() => this.notificationService.notifications().find((item) => !item.read) ?? null);
  readonly notificationToastButtons = [{ text: 'Cerrar', role: 'cancel' }];

  onToastDismissed(): void {
    const item = this.latestUnread();
    if (!item) {
      return;
    }
    this.notificationService.markAsRead(item.id);
  }

  @HostListener('document:pointerup', ['$event'])
  onMainNavigationPointerUp(event: PointerEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const link = target.closest<HTMLElement>('[data-main-nav-route]');
    const route = link?.dataset['mainNavRoute'];
    if (!route || window.location.pathname === route) {
      return;
    }

    void this.router.navigateByUrl(route);
  }
}
