import { inject, Injectable } from '@angular/core';
import { catchError, firstValueFrom, of, timeout } from 'rxjs';
import { TeamApiService } from 'src/app/features/teams/services/team-api.service';

@Injectable({ providedIn: 'root' })
export class MatchTeamPositionService {
  private readonly requestTimeoutMs = 5000;
  private readonly teamApiService = inject(TeamApiService);

  async fetchTeamPositionMap(teamId: number): Promise<Record<string, string>> {
    if (!teamId) {
      return {};
    }

    const members = await firstValueFrom(
      this.teamApiService.getActiveMembers(teamId).pipe(
        timeout(this.requestTimeoutMs),
        catchError(() => of([])),
      ),
    );

    return members.reduce<Record<string, string>>((acc, member) => {
      acc[member.playerUuid] = member.primaryPositionName ?? 'Sin posicion';
      return acc;
    }, {});
  }
}
