import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { APP_CONFIG } from 'src/app/core/config/app-config.token';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { NotificationBadgeService } from 'src/app/features/matches/services/notification-badge.service';
import { TeamExternalRecord, TeamSummary } from 'src/app/features/teams/models/team.models';
import { TeamApiService } from 'src/app/features/teams/services/team-api.service';
import { buildMainBottomNav } from 'src/app/shared/navigation/main-bottom-nav';
import {
  MetallicBottomNavComponent,
  MetallicBottomNavItem,
} from 'src/app/shared/ui/metallic-bottom-nav/metallic-bottom-nav.component';
import { MetallicCardComponent } from 'src/app/shared/ui/metallic-card/metallic-card.component';
import {
  LeaderboardDisplayRow,
  MetallicLeaderboardComponent,
} from 'src/app/shared/ui/metallic-leaderboard/metallic-leaderboard.component';
import { MetallicSelectComponent, MetallicSelectOption } from 'src/app/shared/ui/metallic-select/metallic-select.component';
import { RoleType } from '../../models/rating.models';
import { LeaderboardService } from '../../services/leaderboard.service';
import {
  RANKING_DEMO_RECORD,
  RANKING_DEMO_ROWS,
  RANKING_DEMO_TEAM,
  RANKING_DEMO_TEAM_ID,
} from './leaderboard-demo.data';

type RankingScope = 'PLATFORM' | 'TEAM';
type RankingMode = 'OVERALL' | 'ROLE';
type RankingSort = 'RANK' | 'OVR' | 'MATCHES' | 'NAME';

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
  private readonly appConfig = inject(APP_CONFIG);

  readonly iconBase = 'assets/icons/atleta-raster-v1';
  readonly titleIconAsset = `${this.iconBase}/ic_nav_ranking_96.png`;
  readonly overallSectionIconAsset = `${this.iconBase}/ic_comp_trophy_96.png`;
  readonly roleSectionIconAsset = `${this.iconBase}/ic_comp_stats_96.png`;

  readonly roleOptions: ReadonlyArray<{ role: RoleType; label: string; iconAsset: string }> = [
    { role: 'ATAQUE', label: 'Ataque', iconAsset: `${this.iconBase}/ic_role_attack_96.png` },
    { role: 'MEDIOCAMPO', label: 'Mediocampo', iconAsset: `${this.iconBase}/ic_role_midfield_96.png` },
    { role: 'CARRILERO', label: 'Carrilero', iconAsset: `${this.iconBase}/ic_role_wingback_96.png` },
    { role: 'DEFENSA', label: 'Defensa', iconAsset: `${this.iconBase}/ic_role_defense_96.png` },
    { role: 'ARQUERO', label: 'Arquero', iconAsset: `${this.iconBase}/ic_role_goalkeeper_96.png` },
    { role: 'DT', label: 'DT', iconAsset: `${this.iconBase}/ic_role_coach_96.png` },
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
  isLoadingTeamRecord = false;

  overallError: string | null = null;
  roleError: string | null = null;
  teamsError: string | null = null;
  teamRowsError: string | null = null;
  teamRecordError: string | null = null;

  overallRows: LeaderboardDisplayRow[] = [];
  byRoleRows: LeaderboardDisplayRow[] = [];
  teamRows: LeaderboardDisplayRow[] = [];

  teams: TeamSummary[] = [];
  selectedTeamId: number | null = null;
  currentUserPositionText: string | null = null;
  teamRecord: TeamExternalRecord | null = null;
  searchTerm = '';
  selectedSort: RankingSort = 'RANK';
  isDemoData = false;

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

  get usesDevelopmentDemo(): boolean {
    return this.appConfig.environmentName === 'development' && this.isDemoData;
  }

  get filteredRows(): LeaderboardDisplayRow[] {
    const query = this.searchTerm.trim().toLocaleLowerCase();
    const rows = query
      ? this.modeRows.filter((row) => `${row.alias} ${row.roleText ?? ''}`.toLocaleLowerCase().includes(query))
      : [...this.modeRows];
    return rows.sort((left, right) => {
      switch (this.selectedSort) {
        case 'NAME':
          return left.alias.localeCompare(right.alias, 'es');
        case 'OVR':
          return this.ovrValue(right) - this.ovrValue(left);
        case 'MATCHES':
          return (right.matchesPlayed ?? 0) - (left.matchesPlayed ?? 0);
        default:
          return left.rank - right.rank;
      }
    });
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
      this.loadTeamExternalRecord(this.selectedTeamId);
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
      this.loadTeamExternalRecord(this.selectedTeamId);
      return;
    }
    this.teamRows = [];
    this.teamRecord = null;
    this.refreshCurrentUserPosition();
  }

  onNavItemSelected(itemId: string): void {
    void this.navigationService.goToMainBottomSection(itemId);
  }

  onRetryActive(): void {
    if (this.selectedScope === 'TEAM') {
      if (this.selectedTeamId) {
        this.loadTeamLeaderboard(this.selectedTeamId);
        this.loadTeamExternalRecord(this.selectedTeamId);
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
          this.overallRows = rows.length === 0 && this.canUseDevelopmentDemo()
            ? [...RANKING_DEMO_ROWS]
            : rows;
          this.isDemoData = this.overallRows === RANKING_DEMO_ROWS || (rows.length === 0 && this.canUseDevelopmentDemo());
          this.refreshCurrentUserPosition();
        },
        error: () => {
          if (this.canUseDevelopmentDemo()) {
            this.overallRows = [...RANKING_DEMO_ROWS];
            this.isDemoData = true;
            this.refreshCurrentUserPosition();
            return;
          }
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
          this.byRoleRows = rows.length === 0 && this.canUseDevelopmentDemo()
            ? RANKING_DEMO_ROWS.filter((row) => this.roleForLabel(row.roleText) === this.selectedRole)
            : rows;
          this.isDemoData = this.isDemoData || (rows.length === 0 && this.canUseDevelopmentDemo());
          this.refreshCurrentUserPosition();
        },
        error: () => {
          if (this.canUseDevelopmentDemo()) {
            this.byRoleRows = RANKING_DEMO_ROWS.filter((row) => this.roleForLabel(row.roleText) === this.selectedRole);
            this.isDemoData = true;
            this.refreshCurrentUserPosition();
            return;
          }
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
          const resolvedTeams = teams ?? [];
          this.teams = resolvedTeams.length === 0 && this.canUseDevelopmentDemo()
            ? [RANKING_DEMO_TEAM]
            : resolvedTeams;
          this.isDemoData = this.isDemoData || (resolvedTeams.length === 0 && this.canUseDevelopmentDemo());
          if (!this.selectedTeamId || !this.teams.some((item) => item.id === this.selectedTeamId)) {
            this.selectedTeamId = this.teams[0]?.id ?? null;
          }
          if (this.selectedTeamId) {
            this.loadTeamLeaderboard(this.selectedTeamId);
            this.loadTeamExternalRecord(this.selectedTeamId);
            return;
          }
          this.teamRows = [];
          this.teamRecord = null;
          this.refreshCurrentUserPosition();
        },
        error: () => {
          if (this.canUseDevelopmentDemo()) {
            this.teams = [RANKING_DEMO_TEAM];
            this.selectedTeamId = RANKING_DEMO_TEAM_ID;
            this.teamRows = [...RANKING_DEMO_ROWS];
            this.teamRecord = RANKING_DEMO_RECORD;
            this.isDemoData = true;
            return;
          }
          this.teamsError = 'No se pudieron cargar tus equipos.';
          this.teams = [];
          this.selectedTeamId = null;
          this.teamRows = [];
          this.teamRecord = null;
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
          this.teamRows = rows.length === 0 && this.canUseDevelopmentDemo()
            ? [...RANKING_DEMO_ROWS]
            : rows;
          this.isDemoData = this.isDemoData || (rows.length === 0 && this.canUseDevelopmentDemo());
          this.refreshCurrentUserPosition();
        },
        error: () => {
          if (this.canUseDevelopmentDemo()) {
            this.teamRows = [...RANKING_DEMO_ROWS];
            this.isDemoData = true;
            this.refreshCurrentUserPosition();
            return;
          }
          this.teamRowsError = 'No se pudo cargar el ranking del equipo.';
          this.teamRows = [];
          this.refreshCurrentUserPosition();
        },
      });
  }

  private loadTeamExternalRecord(teamId: number): void {
    this.isLoadingTeamRecord = true;
    this.teamRecordError = null;
    this.teamApiService
      .getExternalRecord(teamId)
      .pipe(
        takeUntil(this.leave$),
        finalize(() => (this.isLoadingTeamRecord = false)),
      )
      .subscribe({
        next: (record) => {
          this.teamRecord = record.matchesPlayed === 0 && this.canUseDevelopmentDemo()
            ? RANKING_DEMO_RECORD
            : record;
          this.isDemoData = this.isDemoData || (record.matchesPlayed === 0 && this.canUseDevelopmentDemo());
        },
        error: () => {
          if (this.canUseDevelopmentDemo()) {
            this.teamRecord = RANKING_DEMO_RECORD;
            this.isDemoData = true;
            return;
          }
          this.teamRecordError = 'No se pudo cargar el récord competitivo del equipo.';
          this.teamRecord = null;
        },
      });
  }

  private ovrValue(row: LeaderboardDisplayRow): number {
    const score = Number.parseFloat(row.scoreText);
    return Number.isFinite(score) ? score : -1;
  }

  private canUseDevelopmentDemo(): boolean {
    return this.appConfig.environmentName === 'development';
  }

  private roleForLabel(label: string | undefined): RoleType | null {
    const roles: Record<string, RoleType> = {
      Ataque: 'ATAQUE',
      Mediocampo: 'MEDIOCAMPO',
      Carrilero: 'CARRILERO',
      Defensa: 'DEFENSA',
      Arquero: 'ARQUERO',
      'Dirección técnica': 'DT',
    };
    return roles[label ?? ''] ?? null;
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
