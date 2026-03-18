import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface TeamEventSummary {
  icon: string;
  text: string;
}

@Component({
  selector: 'app-match-summary-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './match-summary-card.component.html',
  styleUrls: ['./match-summary-card.component.scss'],
})
export class MatchSummaryCardComponent {
  @Input({ required: true }) homeName = 'Local';
  @Input({ required: true }) awayName = 'Visita';
  @Input() homeColor = 'Azul';
  @Input() awayColor = 'Rojo';
  @Input() homeScore = 0;
  @Input() awayScore = 0;
  @Input() homeEvents: TeamEventSummary[] = [];
  @Input() awayEvents: TeamEventSummary[] = [];

  get winnerLabel(): string {
    if (this.homeScore === this.awayScore) {
      return 'Empate';
    }
    return this.homeScore > this.awayScore ? `${this.homeName} gana` : `${this.awayName} gana`;
  }

  get resultBadge(): { icon: string; label: string; css: string } {
    if (this.homeScore === this.awayScore) {
      return { icon: '🟡', label: 'Empate', css: 'badge--draw' };
    }
    return this.homeScore > this.awayScore
      ? { icon: '🟢', label: 'Victoria Local', css: 'badge--win' }
      : { icon: '🔴', label: 'Victoria Visita', css: 'badge--loss' };
  }
}
