import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Match, MatchTheme, MatchType } from '../../models/progressive-match.models';
import { CountdownChipComponent } from '../countdown-chip/countdown-chip.component';
import { MatchStatusBadgeComponent } from '../match-status-badge/match-status-badge.component';

@Component({
  selector: 'app-match-header-card',
  standalone: true,
  imports: [CommonModule, CountdownChipComponent, MatchStatusBadgeComponent],
  templateUrl: './match-header-card.component.html',
  styleUrls: ['./match-header-card.component.scss'],
})
export class MatchHeaderCardComponent {
  @Input({ required: true }) match!: Match;
  @Input({ required: true }) theme!: MatchTheme;

  get showCountdown(): boolean {
    return !this.match.closePending && !!this.match.scheduledAt && !!this.match.status && this.match.status !== 'FINISHED';
  }

  get typeLabel(): string {
    if (this.match.type === MatchType.INTERNAL) {
      return 'Enfrentamiento interno';
    }
    if (this.match.type === MatchType.FRIENDLY) {
      return 'Partido amistoso';
    }
    return 'Partido por los puntos';
  }

  get scheduledAtLabel(): string {
    const date = new Date(this.match.scheduledAt);
    if (Number.isNaN(date.getTime())) {
      return 'Fecha por confirmar';
    }

    return new Intl.DateTimeFormat('es-CL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

}
