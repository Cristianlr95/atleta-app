import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { getMatchStatusIconAsset, getMatchStatusLabel, getMatchStatusTone } from '../../models/match-status.mapper';
import { MatchStatus } from '../../models/progressive-match.models';

@Component({
  selector: 'app-match-status-badge',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './match-status-badge.component.html',
  styleUrls: ['./match-status-badge.component.scss'],
})
export class MatchStatusBadgeComponent {
  private readonly iconBase = 'assets/icons/atleta';

  @Input({ required: true }) status!: MatchStatus;
  @Input() closePending = false;

  get label(): string {
    if (this.closePending && this.status === MatchStatus.LIVE) {
      return 'Partido terminado (pendiente cierre)';
    }
    return getMatchStatusLabel(this.status);
  }

  get iconAsset(): string {
    if (this.closePending && this.status === MatchStatus.LIVE) {
      return `${this.iconBase}/ic_status_pending_24.svg`;
    }
    return getMatchStatusIconAsset(this.status);
  }

  get toneClass(): string {
    if (this.closePending && this.status === MatchStatus.LIVE) {
      return 'match-status-badge--warning';
    }
    return `match-status-badge--${getMatchStatusTone(this.status)}`;
  }

  get statusClass(): string {
    return `match-status-badge--status-${this.status.toLowerCase()}`;
  }
}
