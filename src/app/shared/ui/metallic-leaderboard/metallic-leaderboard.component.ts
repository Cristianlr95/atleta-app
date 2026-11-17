import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface LeaderboardDisplayRow {
  rank: number;
  playerProfileId?: string;
  alias: string;
  scoreText: string;
  metaText?: string;
  roleText?: string;
  matchesPlayed?: number;
  goalsScored?: number | null;
  goalsForRole?: number | null;
  mvpCount?: number | null;
  mvpForRole?: number | null;
  recentResults?: ReadonlyArray<'G' | 'E' | 'P'> | null;
  resultsForRole?: ReadonlyArray<'G' | 'E' | 'P'> | null;
}

@Component({
  selector: 'app-metallic-leaderboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metallic-leaderboard.component.html',
  styleUrls: ['./metallic-leaderboard.component.scss'],
})
export class MetallicLeaderboardComponent {
  private readonly iconBase = 'assets/icons/atleta-raster-v1';

  @Input() title = 'Ranking';
  @Input() rows: ReadonlyArray<LeaderboardDisplayRow> = [];
  @Input() currentPlayerId: string | null = null;
  @Input() showRole = false;
  @Input() resultsScopeLabel = 'de trayectoria';
  @Input() emptyMessage = 'Todavía no hay datos para este ranking.';

  readonly podiumIconAsset = `${this.iconBase}/ic_nav_ranking_96.png`;
  readonly medalIconAsset = `${this.iconBase}/ic_comp_medal_96.png`;
  readonly trophyIconAsset = `${this.iconBase}/ic_comp_trophy_96.png`;
  readonly resultLabels = { G: 'Ganado', E: 'Empatado', P: 'Perdido' };

  resultLabel(result: unknown): string {
    return result === 'G' || result === 'E' || result === 'P' ? this.resultLabels[result] : '';
  }

  isCurrent(row: LeaderboardDisplayRow): boolean {
    return !!this.currentPlayerId && !!row.playerProfileId && row.playerProfileId === this.currentPlayerId;
  }

  isPodium(row: LeaderboardDisplayRow): boolean {
    return row.rank >= 1 && row.rank <= 3;
  }
}
