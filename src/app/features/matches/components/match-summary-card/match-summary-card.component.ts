import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

export interface TeamEventSummary {
  iconAsset: string;
  text: string;
}

@Component({
  selector: 'app-match-summary-card',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './match-summary-card.component.html',
  styleUrls: ['./match-summary-card.component.scss'],
})
export class MatchSummaryCardComponent {
  private readonly iconBase = 'assets/icons/atleta-raster-v1';
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

  get resultBadge(): { iconAsset: string; label: string; css: string } {
    if (this.homeScore === this.awayScore) {
      return { iconAsset: `${this.iconBase}/ic_result_draw_96.png`, label: 'Empate', css: 'badge--draw' };
    }
    return this.homeScore > this.awayScore
      ? { iconAsset: `${this.iconBase}/ic_result_win_96.png`, label: 'Victoria Local', css: 'badge--win' }
      : { iconAsset: `${this.iconBase}/ic_result_loss_96.png`, label: 'Victoria Visita', css: 'badge--loss' };
  }
}
