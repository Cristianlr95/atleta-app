import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, finalize, map, switchMap, takeUntil } from 'rxjs/operators';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { TeamActiveMember, TeamSummary } from 'src/app/features/teams/models/team.models';
import { TeamApiService } from 'src/app/features/teams/services/team-api.service';

@Component({
  selector: 'app-associated-team-roster',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './associated-team-roster.component.html',
  styleUrls: ['./associated-team-roster.component.scss'],
})
export class AssociatedTeamRosterComponent implements OnInit, OnDestroy {
  private readonly authSessionService = inject(AuthSessionService);
  private readonly teamApiService = inject(TeamApiService);
  private readonly destroy$ = new Subject<void>();

  isLoading = true;
  loadError: string | null = null;
  teams: TeamSummary[] = [];
  membersByTeamId: Record<number, TeamActiveMember[]> = {};

  ngOnInit(): void {
    this.loadRoster();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  membersForTeam(teamId: number): TeamActiveMember[] {
    return this.membersByTeamId[teamId] ?? [];
  }

  roleLabel(role: TeamActiveMember['rol']): string {
    if (role === 'CAPITAN') {
      return 'Capitan';
    }
    if (role === 'DT') {
      return 'DT';
    }
    return 'Jugador';
  }

  private loadRoster(): void {
    const session = this.authSessionService.currentSession;
    if (!session) {
      this.isLoading = false;
      this.loadError = 'Debes iniciar sesion para ver tu equipo.';
      return;
    }

    this.isLoading = true;
    this.loadError = null;

    this.teamApiService
      .getByPlayer(session.user.atletaUuid)
      .pipe(
        switchMap((teams) => {
          this.teams = teams;
          if (teams.length === 0) {
            return of([] as Array<{ teamId: number; members: TeamActiveMember[] }>);
          }

          return forkJoin(
            teams.map((team) =>
              this.teamApiService.getActiveMembers(team.id).pipe(
                map((members) => ({ teamId: team.id, members })),
                catchError(() => of({ teamId: team.id, members: [] as TeamActiveMember[] })),
              ),
            ),
          );
        }),
        finalize(() => {
          this.isLoading = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (teamMembers) => {
          this.membersByTeamId = teamMembers.reduce<Record<number, TeamActiveMember[]>>((acc, item) => {
            acc[item.teamId] = item.members;
            return acc;
          }, {});
        },
        error: () => {
          this.loadError = 'No fue posible cargar tus equipos por ahora.';
          this.teams = [];
          this.membersByTeamId = {};
        },
      });
  }
}

