import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MetallicProgressComponent } from 'src/app/shared/ui/metallic-progress/metallic-progress.component';
import { Match, MatchProgressView, Player } from '../../models/progressive-match.models';
import { MatchStatusBadgeComponent } from '../match-status-badge/match-status-badge.component';

@Component({
  selector: 'app-match-progress-card',
  standalone: true,
  imports: [CommonModule, MetallicProgressComponent, MatchStatusBadgeComponent],
  templateUrl: './match-progress-card.component.html',
  styleUrls: ['./match-progress-card.component.scss'],
})
export class MatchProgressCardComponent {
  @Input({ required: true }) match!: Match;
  @Input({ required: true }) progress!: MatchProgressView;
  @Input() confirmedPlayers: Player[] = [];
}

