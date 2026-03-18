import { Capacitor } from '@capacitor/core';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Injectable, signal } from '@angular/core';
import { InAppNotification } from '../models/progressive-match.models';
import { PushTokenSyncService } from './push-token-sync.service';

interface NotificationAdapter {
  readonly name: string;
  isAvailable(): boolean;
  initialize?(): Promise<void>;
  send(title: string, message: string): Promise<void>;
}

class InAppNotificationAdapter implements NotificationAdapter {
  readonly name = 'in-app';

  constructor(private readonly queue: ReturnType<typeof signal<InAppNotification[]>>) {}

  isAvailable(): boolean {
    return true;
  }

  async send(title: string, message: string): Promise<void> {
    const item: InAppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title,
      message,
      createdAt: new Date().toISOString(),
      read: false,
    };

    this.queue.update((notifications) => [item, ...notifications]);
  }
}

class WebNotificationAdapter implements NotificationAdapter {
  readonly name = 'web-notification';

  isAvailable(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  async initialize(): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    if (window.Notification.permission === 'default') {
      await window.Notification.requestPermission();
    }
  }

  async send(title: string, message: string): Promise<void> {
    if (!this.isAvailable() || window.Notification.permission !== 'granted') {
      return;
    }

    new window.Notification(title, { body: message });
  }
}

class CapacitorLocalNotificationAdapter implements NotificationAdapter {
  readonly name = 'capacitor-local';

  isAvailable(): boolean {
    return Capacitor.isNativePlatform();
  }

  async initialize(): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    await LocalNotifications.requestPermissions();
  }

  async send(title: string, message: string): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: Date.now() % 2147483647,
          title,
          body: message,
          schedule: { at: new Date(Date.now() + 1000) },
        },
      ],
    });
  }
}

class CapacitorPushNotificationAdapter implements NotificationAdapter {
  readonly name = 'capacitor-push';

  constructor(
    private readonly onToken: (token: string) => Promise<void>,
    private readonly onRemoteNotification: (title: string, message: string) => Promise<void>,
  ) {}

  isAvailable(): boolean {
    return Capacitor.isNativePlatform();
  }

  async initialize(): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    const permissions = await PushNotifications.requestPermissions();
    if (permissions.receive !== 'granted') {
      return;
    }

    await PushNotifications.register();

    await PushNotifications.addListener('registration', async (token: Token) => {
      await this.onToken(token.value);
    });

    await PushNotifications.addListener('pushNotificationReceived', async (notification: PushNotificationSchema) => {
      await this.onRemoteNotification(
        notification.title ?? 'Notificacion',
        notification.body ?? 'Tienes una nueva actualizacion.',
      );
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', async (action: ActionPerformed) => {
      const title = action.notification.title ?? 'Notificacion';
      const body = action.notification.body ?? 'Notificacion abierta desde el dispositivo.';
      await this.onRemoteNotification(title, body);
    });
  }

  async send(_title: string, _message: string): Promise<void> {
    // Push remoto se dispara desde backend/provider.
  }
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly inAppQueue = signal<InAppNotification[]>([]);

  private readonly adapters: NotificationAdapter[];

  readonly notifications = this.inAppQueue.asReadonly();

  constructor(private readonly pushTokenSyncService: PushTokenSyncService) {
    this.adapters = [
      new CapacitorPushNotificationAdapter(
        async (token) => this.pushTokenSyncService.registerToken(token),
        async (title, message) => this.dispatch(title, message),
      ),
      new CapacitorLocalNotificationAdapter(),
      new WebNotificationAdapter(),
      new InAppNotificationAdapter(this.inAppQueue),
    ];

    void this.initializeAdapters();
  }

  get pendingCount(): number {
    return this.inAppQueue().filter((item) => !item.read).length;
  }

  async notifyInvitationSent(playerName: string): Promise<void> {
    await this.dispatch('Invitacion enviada', `Se envio invitacion a ${playerName}.`);
  }

  async notifyInvitationsBatchSent(sentCount: number): Promise<void> {
    const safeCount = Math.max(0, sentCount);
    const message =
      safeCount === 1
        ? 'Se envio 1 convocatoria para este partido.'
        : `Se enviaron ${safeCount} convocatorias para este partido.`;
    await this.dispatch('Convocatoria enviada', message);
  }

  async notifyAlmostReady(missing: number): Promise<void> {
    await this.dispatch('Partido casi confirmado', `Faltan ${missing} para confirmar el partido.`);
  }

  async notifyMatchConfirmed(): Promise<void> {
    await this.dispatch('Partido confirmado', 'El partido ya esta confirmado para todos los aceptados.');
  }

  markAsRead(notificationId: string): void {
    this.inAppQueue.update((items) =>
      items.map((item) => (item.id === notificationId ? { ...item, read: true } : item)),
    );
  }

  private async initializeAdapters(): Promise<void> {
    for (const adapter of this.adapters) {
      if (!adapter.isAvailable()) {
        continue;
      }

      await adapter.initialize?.();
    }
  }

  private async dispatch(title: string, message: string): Promise<void> {
    for (const adapter of this.adapters) {
      if (!adapter.isAvailable() || adapter.name === 'capacitor-push') {
        continue;
      }

      await adapter.send(title, message);
    }
  }
}
