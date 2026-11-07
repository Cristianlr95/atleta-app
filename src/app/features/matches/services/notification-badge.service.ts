import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { InvitationsStore } from '../stores/invitations.store';

@Injectable({ providedIn: 'root' })
export class NotificationBadgeService {
  private readonly injector = inject(Injector);
  private readonly pendingCountStore = signal(0);
  private readonly refreshErrorStore = signal(false);

  readonly refreshError = this.refreshErrorStore.asReadonly();

  // La insignia de Partidos representa solo acciones pendientes del jugador.
  // Notificaciones informativas y envíos realizados no deben inflar este valor.
  readonly totalPending = computed(() => this.pendingCountStore());

  async refresh(): Promise<void> {
    // Se resuelve solo al actualizar: las vistas publicas pueden renderizar la barra
    // sin inicializar toda la cadena autenticada de invitaciones.
    const invitationsStore = this.injector.get(InvitationsStore);
    const loaded = await invitationsStore.loadPendingInvitations();
    this.refreshErrorStore.set(!loaded);
    if (loaded) {
      this.pendingCountStore.set(invitationsStore.pendingInvitations().length);
    }
  }

  clear(): void {
    this.pendingCountStore.set(0);
    this.refreshErrorStore.set(false);
  }
}
