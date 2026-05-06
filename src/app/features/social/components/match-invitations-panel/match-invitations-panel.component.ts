import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SocialRequestItem } from '../../models/social.models';

export interface SocialConfirmedMatchView {
  id: number;
  title: string;
  scheduledAt?: string;
}

@Component({
  selector: 'app-match-invitations-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './match-invitations-panel.component.html',
  styleUrls: ['./match-invitations-panel.component.scss'],
})
export class MatchInvitationsPanelComponent {
  @Input() pendingInvites: SocialRequestItem[] = [];
  @Input() confirmedMatches: SocialConfirmedMatchView[] = [];

  @Output() respondInvite = new EventEmitter<{ inviteId: number; accept: boolean }>();
  @Output() openMatch = new EventEmitter<number>();

  getCountdownLabel(value?: string): string {
    if (!value) {
      return 'Fecha por definir';
    }

    const scheduledAt = new Date(value).getTime();
    if (Number.isNaN(scheduledAt)) {
      return 'Fecha por definir';
    }

    const diffMs = scheduledAt - Date.now();
    if (diffMs <= 0 || diffMs < 60 * 60 * 1000) {
      return 'Comienza pronto';
    }
    const hours = Math.ceil(diffMs / (1000 * 60 * 60));
    if (hours < 24) {
      return `En ${hours} h`;
    }
    const days = Math.ceil(hours / 24);
    return `En ${days} d`;
  }
}
