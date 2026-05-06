import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { NotificationBadgeService } from 'src/app/features/matches/services/notification-badge.service';
import { TeamSummary } from 'src/app/features/teams/models/team.models';
import { TeamApiService } from 'src/app/features/teams/services/team-api.service';
import { buildMainBottomNav } from 'src/app/shared/navigation/main-bottom-nav';
import {
  MetallicBottomNavComponent,
  MetallicBottomNavItem,
} from 'src/app/shared/ui/metallic-bottom-nav/metallic-bottom-nav.component';
import { MetallicCardComponent } from 'src/app/shared/ui/metallic-card/metallic-card.component';
import { MetallicFormSectionComponent } from 'src/app/shared/ui/metallic-form-section/metallic-form-section.component';
import {
  LeaderboardDisplayRow,
  MetallicLeaderboardComponent,
} from 'src/app/shared/ui/metallic-leaderboard/metallic-leaderboard.component';
import { MetallicSelectComponent, MetallicSelectOption } from 'src/app/shared/ui/metallic-select/metallic-select.component';
import { RoleType } from '../../models/rating.models';
import { LeaderboardService } from '../../services/leaderboard.service';

type RankingScope = 'PLATFORM' | 'TEAM';
type RankingMode = 'OVERALL' | 'ROLE';

@Component({
  selector: 'app-leaderboard-page',
  standalone: true,
  templateUrl: './leaderboard.page.html',
  styleUrls: ['./leaderboard.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MetallicCardComponent,
    MetallicFormSectionComponent,
    MetallicLeaderboardComponent,
    MetallicBottomNavComponent,
    MetallicSelectComponent,
  ],
})
export class LeaderboardPage implements OnDestroy {
  private readonly leaderboardService = inject(LeaderboardService);
  private readonly teamApiService = inject(TeamApiService);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly navigationService = inject(NavigationService);
  private readonly notificationBadgeService = inject(NotificationBadgeService);

  readonly iconBase = 'assets/icons/atleta';
  readonly titleIconAsset = `${this.iconBase}/ic_nav_ranking_24.svg`;
  readonly overallSectionIconAsset = `${this.iconBase}/ic_comp_trophy_24.svg`;
  readonly roleSectionIconAsset = `${this.iconBase}/ic_comp_stats_24.svg`;

  readonly roleOptions: ReadonlyArray<{ role: RoleType; label: string; iconAsset: string }> = [
    { role: 'ATAQUE', label: 'Ataque', iconAsset: `${this.iconBase}/ic_comp_streak_24.svg` },
    { role: 'MEDIOCAMPO', label: 'Mediocampo', iconAsset: `${this.iconBase}/ic_comp_stats_24.svg` },
    { role: 'CARRILERO', label: 'Carrilero', iconAsset: `${this.iconBase}/ic_match_lineup_24.svg` },
    { role: 'DEFENSA', label: 'Defensa', iconAsset: `${this.iconBase}/ic_match_rules_24.svg` },
    { role: 'ARQUERO', label: 'Arquero', iconAsset: `${this.iconBase}/ic_status_ready_24.svg` },
    { role: 'DT', label: 'DT', iconAsset: `${this.iconBase}/ic_comp_trophy_24.svg` },
  ];

  get bottomNavItems(): ReadonlyArray<MetallicBottomNavItem> {
    return buildMainBottomNav('ranking', this.notificationBadgeService.totalPending());
  }

  private readonly leave$ = new Subject<void>();

  selectedScope: RankingScope = 'PLATFORM';
  selectedMode: RankingMode = 'OVERALL';
  selectedRole: RoleType = 'ATAQUE';

  isLoadingOverall = false;
  isLoadingByRole = false;
  isLoadingTeams = false;
  isLoadingTeamRows = false;

  overallError: string | null = null;
  roleError: string | null = null;
  teamsError: string | null = null;
  teamRowsError: string | null = null;

  overallRows: LeaderboardDisplayRow[] = [];
  byRoleRows: LeaderboardDisplayRow[] = [];
  teamRows: LeaderboardDisplayRow[] = [];

  teams: TeamSummary[] = [];
  selectedTeamId: number | null = null;
  currentUserPositionText: string | null = null;

  get currentUserId(): string | null {
    return this.authSessionService.currentSession?.user.atletaUuid ?? null;
  }

  get modeRows(): LeaderboardDisplayRow[] {
    if (this.selectedScope === 'TEAM') {
      return this.teamRows;
    }
    return this.selectedMode === 'ROLE' ? this.byRoleRows : this.overallRows;
  }

  get modeTitle(): string {
    if (this.selectedScope === 'TEAM') {
      return 'Ranking de Mi Equipo';
    }
    if (this.selectedMode === 'ROLE') {
      const selected = this.roleOptions.find((item) => item.role === this.selectedRole);
      return `Ranking ${selected?.label ?? this.selectedRole}`;
    }
    return 'Ranking OVR Global';
  }

  get modeLoading(): boolean {
    if (this.selectedScope === 'TEAM') {
      return this.isLoadingTeamRows;
    }
    return this.selectedMode === 'ROLE' ? this.isLoadingByRole : this.isLoadingOverall;
  }

  get modeError(): string | null {
    if (this.selectedScope === 'TEAM') {
      return this.teamRowsError || this.teamsError;
    }
    return this.selectedMode === 'ROLE' ? this.roleError : this.overallError;
  }

  get teamOptions(): MetallicSelectOption[] {
    return this.teams.map((team) => ({ label: team.nombre, value: String(team.id) }));
  }

  get selectedTeamValue(): string {
    return this.selectedTeamId ? `${this.selectedTeamId}` : '';
  }

  ionViewWillEnter(): void {
    void this.notificationBadgeService.refresh();
    this.loadOverall();
    this.loadByRole();
    this.loadTeams();
  }

  ionViewWillLeave(): void {
    this.leave$.next();
  }

  ngOnDestroy(): void {
    this.leave$.next();
    this.leave$.complete();
  }

  onSelectRole(role: RoleType): void {
    if (this.selectedRole === role) {
      return;
    }
    this.selectedRole = role;
    this.loadByRole();
  }

  onScopeChange(scope: RankingScope): void {
    if (this.selectedScope === scope) {
      return;
    }
    this.selectedScope = scope;
    if (scope === 'TEAM' && this.selectedTeamId) {
      this.loadTeamLeaderboard(this.selectedTeamId);
      return;
    }
    this.refreshCurrentUserPosition();
  }

  onModeChange(mode: RankingMode): void {
    if (this.selectedMode === mode) {
      return;
    }
    this.selectedMode = mode;
    this.refreshCurrentUserPosition();
  }

  onTeamChange(value: string): void {
    const next = Number(value);
    this.selectedTeamId = Number.isFinite(next) ? next : null;
    if (this.selectedTeamId) {
      this.loadTeamLeaderboard(this.selectedTeamId);
      return;
    }
    this.teamRows = [];
    this.refreshCurrentUserPosition();
  }

  onNavItemSelected(itemId: string): void {
    void this.navigationService.goToMainBottomSection(itemId);
  }

  onRetryActive(): void {
    if (this.selectedScope === 'TEAM') {
      if (this.selectedTeamId) {
        this.loadTeamLeaderboard(this.selectedTeamId);
      } else {
        this.loadTeams();
      }
      return;
    }
    if (this.selectedMode === 'ROLE') {
      this.loadByRole();
      return;
    }
    this.loadOverall();
  }

  private loadOverall(): void {
    this.isLoadingOverall = true;
    this.overallError = null;
    this.leaderboardService
      .getOverallLeaderboard()
      .pipe(
        takeUntil(this.leave$),
        finalize(() => (this.isLoadingOverall = false)),
      )
      .subscribe({
        next: (rows) => {
          this.overallRows = rows;
          this.refreshCurrentUserPosition();
        },
        error: () => {
          this.overallError = 'No se pudo cargar el ranking general.';
        },
      });
  }

  private loadByRole(): void {
    this.isLoadingByRole = true;
    this.roleError = null;
    this.leaderboardService
      .getRoleLeaderboard(this.selectedRole)
      .pipe(
        takeUntil(this.leave$),
        finalize(() => (this.isLoadingByRole = false)),
      )
      .subscribe({
        next: (rows) => {
          this.byRoleRows = rows;
          this.refreshCurrentUserPosition();
        },
        error: () => {
          this.roleError = 'No se pudo cargar el ranking por posicion.';
        },
      });
  }

  private loadTeams(): void {
    const currentUser = this.currentUserId;
    if (!currentUser) {
      this.teams = [];
      this.selectedTeamId = null;
      return;
    }
    this.isLoadingTeams = true;
    this.teamsError = null;
    this.teamApiService
      .getByPlayer(currentUser)
      .pipe(
        takeUntil(this.leave$),
        finalize(() => (this.isLoadingTeams = false)),
      )
      .subscribe({
        next: (teams) => {
          this.teams = teams ?? [];
          if (!this.selectedTeamId || !this.teams.some((item) => item.id === this.selectedTeamId)) {
            this.selectedTeamId = this.teams[0]?.id ?? null;
          }
          if (this.selectedTeamId) {
            this.loadTeamLeaderboard(this.selectedTeamId);
            return;
          }
          this.teamRows = [];
          this.refreshCurrentUserPosition();
        },
        error: () => {
          this.teamsError = 'No se pudieron cargar tus equipos.';
          this.teams = [];
          this.selectedTeamId = null;
          this.teamRows = [];
          this.refreshCurrentUserPosition();
        },
      });
  }

  private loadTeamLeaderboard(teamId: number): void {
    this.isLoadingTeamRows = true;
    this.teamRowsError = null;
    this.leaderboardService
      .getTeamOverallLeaderboard(teamId)
      .pipe(
        takeUntil(this.leave$),
        finalize(() => (this.isLoadingTeamRows = false)),
      )
      .subscribe({
        next: (rows) => {
          this.teamRows = rows;
          this.refreshCurrentUserPosition();
        },
        error: () => {
          this.teamRowsError = 'No se pudo cargar el ranking del equipo.';
          this.teamRows = [];
          this.refreshCurrentUserPosition();
        },
      });
  }

  private refreshCurrentUserPosition(): void {
    const currentUser = this.currentUserId;
    if (!currentUser) {
      this.currentUserPositionText = null;
      return;
    }
    const row = this.modeRows.find((item) => item.playerProfileId === currentUser);
    if (!row) {
      this.currentUserPositionText = null;
      return;
    }
    this.currentUserPositionText = `Tu posicion actual: #${row.rank} (${row.scoreText})`;
  }
}
