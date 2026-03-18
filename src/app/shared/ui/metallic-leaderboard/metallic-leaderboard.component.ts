import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';

export interface LeaderboardDisplayRow {
  rank: number;
  playerProfileId?: string;
  alias: string;
  scoreText: string;
  metaText?: string;
}

@Component({
  selector: 'app-metallic-leaderboard',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './metallic-leaderboard.component.html',
  styleUrls: ['./metallic-leaderboard.component.scss'],
})
export class MetallicLeaderboardComponent {
  private readonly iconBase = 'assets/icons/atleta';

  @Input() title = 'Ranking';
  @Input() rows: ReadonlyArray<LeaderboardDisplayRow> = [];
  @Input() currentPlayerId: string | null = null;

  readonly podiumIconAsset = `${this.iconBase}/ic_nav_ranking_24.svg`;
  readonly medalIconAsset = `${this.iconBase}/ic_comp_level_24.svg`;
  readonly trophyIconAsset = `${this.iconBase}/ic_comp_trophy_24.svg`;

  get topRows(): LeaderboardDisplayRow[] {
    return this.rows.slice(0, 3);
  }

  get remainingRows(): LeaderboardDisplayRow[] {
    return this.rows.slice(3);
  }

  isCurrent(row: LeaderboardDisplayRow): boolean {
    return !!this.currentPlayerId && !!row.playerProfileId && row.playerProfileId === this.currentPlayerId;
  }
}
