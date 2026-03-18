import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { NavigationService } from 'src/app/core/services/navigation.service';

export interface CompetitionHistoryDisplayItem {
  id: number;
  routeMatchId?: string;
  dateEpoch: number | null;
  modalityKey: string;
  statusKey: string;
  outcomeKey: string;
  modalityLabel: string;
  dateLabel: string;
  statusLabel: string;
  outcomeLabel: string;
  outcomeVariant: 'win' | 'draw' | 'loss' | 'neutral';
  teamLabel: string;
  positionLabel: string;
  minutesPlayedLabel: string;
  goals: number;
  assists: number;
  matchRatingLabel: string;
  mvpLabel: string;
  scoreLabel: string;
}

@Component({
  selector: 'app-metallic-competition-history',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './metallic-competition-history.component.html',
  styleUrls: ['./metallic-competition-history.component.scss'],
})
export class MetallicCompetitionHistoryComponent {
  private readonly iconBase = 'assets/icons/atleta';
  private readonly navigationService = inject(NavigationService);

  @Input() items: ReadonlyArray<CompetitionHistoryDisplayItem> = [];

  getStatusIconAsset(status: string): string {
    if (status === 'FINALIZADO') {
      return `${this.iconBase}/ic_status_finished_24.svg`;
    }
    if (status === 'INVALIDO') {
      return `${this.iconBase}/ic_status_canceled_24.svg`;
    }
    if (status === 'INICIADO') {
      return `${this.iconBase}/ic_status_in_progress_24.svg`;
    }
    return `${this.iconBase}/ic_status_in_assembly_24.svg`;
  }

  getStatusClass(status: string): string {
    if (status === 'FINALIZADO') {
      return 'match-history__status--success';
    }
    if (status === 'INVALIDO') {
      return 'match-history__status--danger';
    }
    if (status === 'INICIADO') {
      return 'match-history__status--warning';
    }
    return 'match-history__status--neutral';
  }

  async onViewMatch(item: CompetitionHistoryDisplayItem): Promise<void> {
    const routeMatchId = item.routeMatchId ?? `${item.id}`;
    await this.navigationService.safeNavigate(['/matches', routeMatchId]);
  }
}
