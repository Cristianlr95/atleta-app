import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TeamApiService } from 'src/app/features/teams/services/team-api.service';
import { LeaderboardEntry, RoleType } from '../models/rating.models';
import { RatingsApiService } from './ratings-api.service';

export interface LeaderboardViewEntry {
  goalsScored?: number | null;
  goalsForRole?: number | null;
  mvpCount?: number | null;
  mvpForRole?: number | null;
  recentResults?: ReadonlyArray<'G' | 'E' | 'P'> | null;
  resultsForRole?: ReadonlyArray<'G' | 'E' | 'P'> | null;
  rank: number;
  playerProfileId?: string;
  alias: string;
  scoreText: string;
  metaText?: string;
  roleText?: string;
  matchesPlayed?: number;
}

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private readonly ratingsApiService = inject(RatingsApiService);
  private readonly teamApiService = inject(TeamApiService);

  getOverallLeaderboard(): Observable<LeaderboardViewEntry[]> {
    return this.ratingsApiService.getLeaderboardOverall().pipe(
      map((entries) => this.toView(entries, 'OVR')),
    );
  }

  getRoleLeaderboard(roleType: RoleType): Observable<LeaderboardViewEntry[]> {
    return this.ratingsApiService.getLeaderboardByRole(roleType).pipe(
      map((entries) => this.toView(entries, roleType)),
    );
  }

  getTeamOverallLeaderboard(teamId: number): Observable<LeaderboardViewEntry[]> {
    return this.teamApiService.getLeaderboard(teamId).pipe(
      map((entries) => entries.map((entry) => ({
        rank: entry.rank,
        playerProfileId: entry.playerProfileId,
        alias: entry.alias,
        scoreText: entry.rated && entry.score !== null
          ? `${entry.score.toFixed(1)} OVR`
          : 'Sin rating',
        metaText: entry.rated ? `${entry.matchesPlayed} partidos` : 'Aun sin partidos puntuados',
        matchesPlayed: entry.matchesPlayed,
        ...(entry.goalsScored !== undefined ? { goalsScored: entry.goalsScored } : {}),
        ...(entry.mvpCount !== undefined ? { mvpCount: entry.mvpCount } : {}),
        ...(entry.recentResults !== undefined ? { recentResults: this.mapResults(entry.recentResults) } : {}),
      }))),
    );
  }

  private toView(entries: LeaderboardEntry[], label: string): LeaderboardViewEntry[] {
    return [...entries]
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({
        rank: index + 1,
        playerProfileId: entry.playerProfileId || entry.playerId,
        alias: entry.alias || entry.name || `Jugador ${index + 1}`,
        scoreText: `${entry.score.toFixed(1)} ${label}`,
        metaText: entry.matchesPlayed !== undefined ? `${entry.matchesPlayed} partidos` : undefined,
        roleText: entry.roleType ? this.roleLabel(entry.roleType) : undefined,
        matchesPlayed: entry.matchesPlayed,
        ...(entry.goalsScored !== undefined ? { goalsScored: entry.goalsScored } : {}),
        ...(entry.goalsForRole !== undefined && label !== 'OVR' ? { goalsForRole: entry.goalsForRole } : {}),
        ...(entry.mvpCount !== undefined ? { mvpCount: entry.mvpCount } : {}),
        ...(entry.mvpForRole !== undefined && label !== 'OVR' ? { mvpForRole: entry.mvpForRole } : {}),
        ...(entry.recentResults !== undefined ? { recentResults: this.mapResults(entry.recentResults) } : {}),
        ...(entry.resultsForRole !== undefined && label !== 'OVR' ? { resultsForRole: this.mapResults(entry.resultsForRole) } : {}),
      }));
  }

  private mapResults(results: ReadonlyArray<'VICTORIA' | 'EMPATE' | 'DERROTA'> | null): Array<'G' | 'E' | 'P'> | null {
    if (!results || !results.every(result => result === 'VICTORIA' || result === 'EMPATE' || result === 'DERROTA')) return null;
    return results.map(result => ({ VICTORIA: 'G', EMPATE: 'E', DERROTA: 'P' })[result] as 'G' | 'E' | 'P');
  }

  private roleLabel(role: RoleType): string {
    return {
      ATAQUE: 'Ataque',
      MEDIOCAMPO: 'Mediocampo',
      CARRILERO: 'Carrilero',
      DEFENSA: 'Defensa',
      ARQUERO: 'Arquero',
      DT: 'Dirección técnica',
    }[role];
  }
}
