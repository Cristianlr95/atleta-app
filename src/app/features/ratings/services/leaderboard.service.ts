import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { TeamApiService } from 'src/app/features/teams/services/team-api.service';
import { LeaderboardEntry, RoleType } from '../models/rating.models';
import { RatingsApiService } from './ratings-api.service';

export interface LeaderboardViewEntry {
  rank: number;
  playerProfileId?: string;
  alias: string;
  scoreText: string;
  metaText?: string;
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
    return this.teamApiService.getActiveMembers(teamId).pipe(
      switchMap((members) => {
        if (members.length === 0) {
          return of([] as LeaderboardViewEntry[]);
        }
        return forkJoin(
          members.map((member) =>
            this.ratingsApiService.getOverall(member.playerUuid).pipe(
              map((overall) => ({
                playerProfileId: member.playerUuid,
                alias: member.alias || overall.alias || member.playerUuid,
                score: overall.hybridOVR,
                matchesPlayed: overall.totalMatchesPlayed ?? 0,
              })),
            ),
          ),
        ).pipe(
          map((rows) =>
            this.toView(
              rows.map((item) => ({
                playerProfileId: item.playerProfileId,
                alias: item.alias,
                score: item.score,
                matchesPlayed: item.matchesPlayed,
              })),
              'OVR',
            ),
          ),
        );
      }),
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
      }));
  }
}
