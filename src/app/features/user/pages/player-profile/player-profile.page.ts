import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subject, Subscription, firstValueFrom, forkJoin, interval, of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { AppToastService } from 'src/app/core/services/app-toast.service';
import { ErrorMapperService } from 'src/app/core/services/error-mapper.service';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { MatchHistoryService, MatchHistoryViewItem } from 'src/app/features/matches/services/match-history.service';
import { NotificationBadgeService } from 'src/app/features/matches/services/notification-badge.service';
import { OverallRating, RatingByRole, RoleType } from 'src/app/features/ratings/models/rating.models';
import { RatingsApiService } from 'src/app/features/ratings/services/ratings-api.service';
import { SocialPlayerLookupItem } from 'src/app/features/social/models/social.models';
import { SocialApiService } from 'src/app/features/social/services/social-api.service';
import {
  MetallicBottomNavComponent,
  MetallicBottomNavItem,
} from 'src/app/shared/ui/metallic-bottom-nav/metallic-bottom-nav.component';
import { MetallicCardComponent } from 'src/app/shared/ui/metallic-card/metallic-card.component';
import { MetallicFormSectionComponent } from 'src/app/shared/ui/metallic-form-section/metallic-form-section.component';
import {
  MetallicPlayerPositionsComponent,
  PlayerPositionDisplay,
} from 'src/app/shared/ui/metallic-player-positions/metallic-player-positions.component';
import {
  HexagonRole,
  HexagonRoleStat,
  MetallicRoleHexagonComponent,
} from 'src/app/shared/ui/metallic-role-hexagon/metallic-role-hexagon.component';
import { MetallicStatsComponent, Stat } from 'src/app/shared/ui/metallic-stats/metallic-stats.component';
import { TeamActiveMember, TeamSummary } from 'src/app/features/teams/models/team.models';
import { TeamApiService } from 'src/app/features/teams/services/team-api.service';
import { buildMainBottomNav } from 'src/app/shared/navigation/main-bottom-nav';
import { PlayerAssignedPosition } from '../../models/position.models';
import { PlayerAchievement, PlayerProfile } from '../../models/user.models';
import { PlayerPositionStateService } from '../../services/player-position-state.service';
import { UserApiService } from '../../services/user-api.service';

interface TeamMemberView extends TeamActiveMember {
  ovr: number | null;
}

interface OutcomeSummary {
  wins: number;
  draws: number;
  losses: number;
  total: number;
}

@Component({
  selector: 'app-player-profile',
  standalone: true,
  templateUrl: './player-profile.page.html',
  styleUrls: ['./player-profile.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MetallicCardComponent,
    MetallicFormSectionComponent,
    MetallicRoleHexagonComponent,
    MetallicStatsComponent,
    MetallicBottomNavComponent,
    MetallicPlayerPositionsComponent,
  ],
})
export class PlayerProfilePage implements OnDestroy {
  private readonly authSessionService = inject(AuthSessionService);
  private readonly userApiService = inject(UserApiService);
  private readonly ratingsApiService = inject(RatingsApiService);
  private readonly matchHistoryService = inject(MatchHistoryService);
  private readonly teamApiService = inject(TeamApiService);
  private readonly socialApiService = inject(SocialApiService);
  private readonly playerPositionStateService = inject(PlayerPositionStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly navigationService = inject(NavigationService);
  private readonly notificationBadgeService = inject(NotificationBadgeService);
  private readonly appToastService = inject(AppToastService);
  private readonly errorMapper = inject(ErrorMapperService);

  private readonly destroy$ = new Subject<void>();
  private readonly leave$ = new Subject<void>();
  private readonly autoRefreshMs = 45000;
  private readonly isDemoMode: boolean;
  private autoRefreshSub: Subscription | null = null;
  private inviteSearchTimer?: number;

  readonly iconBase = 'assets/icons/atleta-raster-v1';
  readonly profileTitleIconAsset = `${this.iconBase}/ic_nav_profile_96.png`;
  readonly hexagonSectionIconAsset = `${this.iconBase}/ic_comp_stats_96.png`;
  readonly overviewSectionIconAsset = `${this.iconBase}/ic_comp_overall_96.png`;
  readonly outcomesSectionIconAsset = `${this.iconBase}/ic_comp_streak_96.png`;
  readonly positionsSectionIconAsset = `${this.iconBase}/ic_match_lineup_96.png`;
  readonly teamsSectionIconAsset = `${this.iconBase}/ic_match_teams_96.png`;
  readonly settingsIconAsset = `${this.iconBase}/ic_auth_security_96.png`;
  readonly achievementsSectionIconAsset = `${this.iconBase}/ic_comp_medal_96.png`;

  get bottomNavItems(): ReadonlyArray<MetallicBottomNavItem> {
    return buildMainBottomNav('profile', this.notificationBadgeService.totalPending());
  }

  isLoading = false;
  errorMessage: string | null = null;

  displayName = 'Jugador';
  displayAlias = 'Sin alias';
  displayEmail = '';
  overallText = 'Intermedio';
  overallHybridOvr: number | null = null;
  overallVersatilityPercent: number | null = null;
  overallBestRole: HexagonRole | null = null;
  overallBestRoleRating: number | null = null;

  roleStats: HexagonRoleStat[] = this.demoHexagon();
  summaryStats: Stat[] = this.demoSummary();
  outcomeStats: Stat[] = this.demoOutcomes();
  achievements: PlayerAchievement[] = this.demoAchievements();
  playerPositions: PlayerPositionDisplay[] = [];
  memberTeams: TeamSummary[] = [];
  expandedTeamId: number | null = null;
  inviteQuery = '';
  inviteLoading = false;
  inviteCandidates: SocialPlayerLookupItem[] = [];
  inviteSendingUuid: string | null = null;
  teamMembers: TeamMemberView[] = [];
  teamMembersLoading = false;
  teamMembersError: string | null = null;

  constructor() {
    this.isDemoMode = this.route.snapshot.queryParamMap.get('demo') === '1';
  }

  ionViewWillEnter(): void {
    void this.notificationBadgeService.refresh();
    if (this.isDemoMode) {
      this.applyDemo('Jugador demo', 'demo@atleta.app');
      return;
    }

    this.loadProfile();
    this.startAutoRefresh();
  }

  ionViewWillLeave(): void {
    this.leave$.next();
    this.stopAutoRefresh();
    this.clearInviteSearchTimer();
  }

  ngOnDestroy(): void {
    this.leave$.next();
    this.leave$.complete();
    this.stopAutoRefresh();
    this.clearInviteSearchTimer();
    this.destroy$.next();
    this.destroy$.complete();
  }

  onNavItemSelected(itemId: string): void {
    void this.navigationService.goToMainBottomSection(itemId);
  }

  openSettings(): void {
    void this.navigationService.safeNavigate(['/player/settings']);
  }

  openMatchHistory(): void {
    void this.navigationService.safeNavigate(['/matches/history']);
  }

  openMatches(): void {
    void this.navigationService.safeNavigate(['/matches']);
  }

  isTeamCreator(team: TeamSummary): boolean {
    const currentUser = this.authSessionService.currentSession?.user.atletaUuid;
    if (!currentUser) {
      return false;
    }
    return team.creadorUuid === currentUser || team.creador?.atletaUuid === currentUser;
  }

  toggleTeamAccordion(teamId: number): void {
    this.clearInviteSearchTimer();
    if (this.expandedTeamId === teamId) {
      this.expandedTeamId = null;
      this.inviteQuery = '';
      this.inviteCandidates = [];
      this.teamMembers = [];
      this.teamMembersError = null;
      return;
    }
    this.expandedTeamId = teamId;
    this.inviteQuery = '';
    this.inviteCandidates = [];
    void this.loadTeamMembers(teamId);
  }

  onInviteQueryChange(value: string): void {
    this.inviteQuery = value;
    this.clearInviteSearchTimer();
    const query = value.trim();
    if (query.length < 2) {
      this.inviteCandidates = [];
      return;
    }
    this.inviteSearchTimer = window.setTimeout(() => {
      void this.searchInviteCandidates(query);
    }, 300);
  }

  async onSendTeamInvite(targetUuid: string): Promise<void> {
    const requesterUuid = this.authSessionService.currentSession?.user.atletaUuid;
    if (!requesterUuid || !this.expandedTeamId) {
      return;
    }
    try {
      this.inviteSendingUuid = targetUuid;
      await firstValueFrom(
        this.socialApiService.createTeamInvite({
          teamId: this.expandedTeamId,
          requesterUuid,
          targetUuid,
        }),
      );
      await this.appToastService.success('Invitacion enviada.');
      this.inviteCandidates = this.inviteCandidates.filter((item) => item.atletaUuid !== targetUuid);
    } catch (error) {
      await this.appToastService.error(this.errorMapper.toUserMessage(error, 'social'));
    } finally {
      this.inviteSendingUuid = null;
    }
  }

  async onDeleteTeam(team: TeamSummary): Promise<void> {
    if (!this.isTeamCreator(team)) {
      await this.appToastService.info('Solo el creador puede eliminar este equipo.');
      return;
    }
    const confirmed = window.confirm(
      `Estas seguro de eliminar el equipo "${team.nombre}"?\nEsta accion no se puede deshacer.`,
    );
    if (!confirmed) {
      return;
    }
    const actorUuid = this.authSessionService.currentSession?.user.atletaUuid;
    if (!actorUuid) {
      return;
    }
    try {
      await firstValueFrom(this.teamApiService.deleteTeam(team.id, actorUuid));
      this.memberTeams = this.memberTeams.filter((item) => item.id !== team.id);
      if (this.expandedTeamId === team.id) {
        this.expandedTeamId = null;
        this.inviteQuery = '';
        this.inviteCandidates = [];
        this.teamMembers = [];
        this.teamMembersError = null;
      }
      await this.appToastService.success('Equipo eliminado.');
    } catch (error) {
      await this.appToastService.error(this.errorMapper.toUserMessage(error, 'social'));
    }
  }

  private loadProfile(isBackgroundRefresh = false): void {
    const session = this.authSessionService.currentSession;

    if (!session) {
      this.errorMessage = 'Mostrando datos de demostración. Inicia sesión para ver tus estadísticas reales.';
      this.applyDemo();
      return;
    }

    const atletaUuid = session.user.atletaUuid;

    if (!isBackgroundRefresh) {
      this.isLoading = true;
      this.errorMessage = null;
    }

    forkJoin({
      profile: this.userApiService.getPlayerProfile(atletaUuid).pipe(catchError(() => of(null))),
      achievements: this.userApiService.getPlayerAchievements(atletaUuid).pipe(catchError(() => of([] as PlayerAchievement[]))),
      overall: this.ratingsApiService.getOverall(atletaUuid).pipe(catchError(() => of(null))),
      ratings: this.ratingsApiService.getByRole(atletaUuid).pipe(catchError(() => of([]))),
      history: this.matchHistoryService.getPlayerHistory(atletaUuid).pipe(catchError(() => of([]))),
      teams: this.teamApiService.getByPlayer(atletaUuid).pipe(catchError(() => of([] as TeamSummary[]))),
      positions: this.userApiService
        .getPlayerPositions(atletaUuid)
        .pipe(catchError(() => of(this.playerPositionStateService.getByPlayer(atletaUuid)))),
    })
      .pipe(
        takeUntil(this.leave$),
        finalize(() => (this.isLoading = false)),
      )
      .subscribe(({ profile, achievements, overall, ratings, history, teams, positions }) => {
        this.applyProfileData(
          session.user.nombre,
          session.user.email,
          profile,
          overall,
          ratings,
          history,
          teams,
          positions,
        );
        this.achievements = achievements.length > 0 ? achievements : this.demoAchievements();
        if (this.expandedTeamId && !teams.some((team) => team.id === this.expandedTeamId)) {
          this.expandedTeamId = null;
          this.inviteQuery = '';
          this.inviteCandidates = [];
          this.teamMembers = [];
          this.teamMembersError = null;
        }
      });
  }

  private startAutoRefresh(): void {
    if (this.autoRefreshSub) {
      return;
    }

    this.autoRefreshSub = interval(this.autoRefreshMs)
      .pipe(takeUntil(this.leave$), takeUntil(this.destroy$))
      .subscribe(() => this.loadProfile(true));
  }

  private stopAutoRefresh(): void {
    if (!this.autoRefreshSub) {
      return;
    }
    this.autoRefreshSub.unsubscribe();
    this.autoRefreshSub = null;
  }

  private async searchInviteCandidates(query: string): Promise<void> {
    const currentUser = this.authSessionService.currentSession?.user.atletaUuid;
    if (!currentUser) {
      return;
    }
    try {
      this.inviteLoading = true;
      const candidates = await firstValueFrom(this.socialApiService.searchPlayers(query));
      this.inviteCandidates = (candidates ?? []).filter((item) => item.atletaUuid !== currentUser);
    } catch (error) {
      this.inviteCandidates = [];
      await this.appToastService.error(this.errorMapper.toUserMessage(error, 'social'));
    } finally {
      this.inviteLoading = false;
    }
  }

  private async loadTeamMembers(teamId: number): Promise<void> {
    try {
      this.teamMembersLoading = true;
      this.teamMembersError = null;
      const members = await firstValueFrom(this.teamApiService.getActiveMembers(teamId));
      if (members.length === 0) {
        this.teamMembers = [];
        return;
      }
      const ovrs = await firstValueFrom(
        forkJoin(
          members.map((member) =>
            this.ratingsApiService.getOverall(member.playerUuid).pipe(catchError(() => of(null))),
          ),
        ),
      );
      this.teamMembers = members.map((member, index) => ({
        ...member,
        ovr: ovrs[index]?.hybridOVR ?? null,
      }));
    } catch (error) {
      this.teamMembers = [];
      this.teamMembersError = this.errorMapper.toUserMessage(error, 'social');
    } finally {
      this.teamMembersLoading = false;
    }
  }

  memberRoleLabel(role: TeamActiveMember['rol']): string {
    if (role === 'CAPITAN') {
      return 'Capitan';
    }
    if (role === 'DT') {
      return 'DT';
    }
    return 'Jugador';
  }

  isTeamExpanded(teamId: number): boolean {
    return this.expandedTeamId === teamId;
  }

  memberOvrLabel(ovr: number | null): string {
    return ovr === null ? 'OVR N/D' : `OVR ${Math.round(ovr)}`;
  }

  private clearInviteSearchTimer(): void {
    if (this.inviteSearchTimer) {
      window.clearTimeout(this.inviteSearchTimer);
      this.inviteSearchTimer = undefined;
    }
  }

  private applyProfileData(
    sessionName: string,
    sessionEmail: string,
    profile: PlayerProfile | null,
    overall: OverallRating | null,
    ratings: RatingByRole[],
    history: MatchHistoryViewItem[],
    teams: TeamSummary[],
    positions: PlayerAssignedPosition[],
  ): void {
    this.displayName = sessionName || 'Jugador';
    this.displayAlias = profile?.alias || overall?.alias || 'Sin alias';
    this.displayEmail = sessionEmail;

    const mappedHexagon = this.mapRoleStats(overall, ratings);
    this.roleStats = mappedHexagon.length > 0 ? mappedHexagon : this.demoHexagon();

    this.overallText = overall?.classification || 'Intermedio';
    this.overallHybridOvr = overall?.hybridOVR ?? null;
    this.overallVersatilityPercent =
      overall?.versatilityIndex !== undefined && overall?.versatilityIndex !== null
        ? Math.round(overall.versatilityIndex * 100)
        : null;
    this.overallBestRole = (overall?.bestRole as HexagonRole | undefined) ?? null;
    this.overallBestRoleRating = overall?.bestRoleRating ?? null;
    const outcomeSummary = this.summarizeOutcomes(history);

    this.summaryStats = [
      {
        label: 'Nivel General',
        value: overall ? overall.hybridOVR.toFixed(1) : '--',
        icon: 'overall',
        description:
          'Valor general de rendimiento del jugador. Resume tus calificaciones por rol en un solo indicador.',
      },
      {
        label: 'Rol Destacado',
        value:
          overall && overall.bestRoleRating !== undefined && overall.bestRoleRating !== null
            ? `${this.toRoleAbbreviation(overall.bestRole)} ${overall.bestRoleRating.toFixed(1)}`
            : '--',
        icon: 'best-role',
        valueClass: 'metallic-stat__value--small',
        description:
          'Rol donde actualmente tienes tu mejor calificación. Incluye abreviación del rol y su puntaje.',
      },
      {
        label: 'Partidos Jugados',
        value:
          outcomeSummary.total > 0
            ? outcomeSummary.total
            : overall?.totalMatchesPlayed ?? this.matchesFromRatings(ratings),
        icon: 'matches',
        description: 'Cantidad total de partidos registrados para tu perfil.',
      },
      {
        label: 'Indice de Versatilidad',
        value: `${this.versatilityPercent(this.roleStats)}%`,
        icon: 'versatility',
        description:
          'Porcentaje de roles en los que mantienes rendimiento competitivo. Un valor alto indica mayor adaptación.',
      },
    ];

    this.outcomeStats = this.buildOutcomeStats(outcomeSummary);
    this.memberTeams = teams;
    this.playerPositions = this.toPositionDisplay(positions);
  }

  private buildOutcomeStats(summary: OutcomeSummary): Stat[] {
    return [
      { label: 'Victorias', value: summary.wins, icon: 'win' },
      { label: 'Empates', value: summary.draws, icon: 'draw' },
      { label: 'Derrotas', value: summary.losses, icon: 'loss' },
    ];
  }

  private summarizeOutcomes(history: MatchHistoryViewItem[]): OutcomeSummary {
    const outcomes = history.map((item) => item.outcome).filter((value): value is NonNullable<typeof value> => value !== null);
    const wins = outcomes.filter((outcome) => outcome === 'GANADO').length;
    const draws = outcomes.filter((outcome) => outcome === 'EMPATADO').length;
    const losses = outcomes.filter((outcome) => outcome === 'PERDIDO').length;

    return {
      wins,
      draws,
      losses,
      total: wins + draws + losses,
    };
  }

  private applyDemo(name?: string, email?: string): void {
    this.displayName = name || 'Jugador demo';
    this.displayAlias = 'El Todoterreno';
    this.displayEmail = email || 'demo@atleta.app';
    this.roleStats = this.demoHexagon();
    this.summaryStats = this.demoSummary();
    this.outcomeStats = this.demoOutcomes();
    this.achievements = this.demoAchievements();
    this.memberTeams = [];
    this.playerPositions = [
      { name: 'Delantero', priorityLabel: 'Principal' },
      { name: 'Mediocampista', priorityLabel: 'Secundaria' },
    ];
    this.overallText = 'Experto';
    this.overallHybridOvr = 83.8;
    this.overallVersatilityPercent = 67;
    this.overallBestRole = 'ATAQUE';
    this.overallBestRoleRating = 85;
  }

  achievementIconAsset(code: PlayerAchievement['code']): string {
    const iconByCode: Record<PlayerAchievement['code'], string> = {
      TOP_SCORER: `${this.iconBase}/ic_comp_goal_contribution_96.png`,
      TOP_ASSIST: `${this.iconBase}/ic_event_assist_96.png`,
      MATCH_VETERAN: `${this.iconBase}/ic_comp_stats_96.png`,
      MATCH_CREATOR: `${this.iconBase}/ic_match_create_96.png`,
      MATCH_WINNER: `${this.iconBase}/ic_result_win_96.png`,
    };
    return iconByCode[code];
  }

  achievementTierLabel(achievement: PlayerAchievement): string {
    if (achievement.tier === 'GOLD') {
      return 'Oro';
    }
    if (achievement.tier === 'SILVER') {
      return 'Plata';
    }
    if (achievement.tier === 'BRONZE') {
      return 'Bronce';
    }
    return `Próximo: ${achievement.nextThreshold}`;
  }

  private demoAchievements(): PlayerAchievement[] {
    return [
      { code: 'TOP_SCORER', title: 'Goleador', description: 'Marca goles en partidos finalizados.', metricLabel: 'goles', currentValue: 12, nextThreshold: 15, progressPercent: 80, tier: 'BRONZE', unlocked: true },
      { code: 'TOP_ASSIST', title: 'Asistente máximo', description: 'Genera goles para tu equipo.', metricLabel: 'asistencias', currentValue: 6, nextThreshold: 12, progressPercent: 50, tier: 'BRONZE', unlocked: true },
      { code: 'MATCH_VETERAN', title: 'Partidos jugados', description: 'Compite y confirma presencia en partidos finalizados.', metricLabel: 'partidos', currentValue: 18, nextThreshold: 30, progressPercent: 60, tier: 'BRONZE', unlocked: true },
      { code: 'MATCH_CREATOR', title: 'Creador de partidos', description: 'Organiza encuentros válidos para la comunidad.', metricLabel: 'partidos creados', currentValue: 3, nextThreshold: 10, progressPercent: 30, tier: 'BRONZE', unlocked: true },
      { code: 'MATCH_WINNER', title: 'Partidos ganados', description: 'Acumula victorias en partidos finalizados.', metricLabel: 'victorias', currentValue: 4, nextThreshold: 5, progressPercent: 80, tier: null, unlocked: false },
    ];
  }


  private toPositionDisplay(positions: PlayerAssignedPosition[]): PlayerPositionDisplay[] {
    return positions.map((position) => ({
      name: position.positionName,
      priorityLabel: this.priorityLabel(position.prioridad),
    }));
  }

  private priorityLabel(prioridad: number): string {
    if (prioridad === 1) {
      return 'Principal';
    }

    if (prioridad === 2) {
      return 'Secundaria';
    }

    return 'Terciaria';
  }

  private mapRoleStats(overall: OverallRating | null, ratings: RatingByRole[]): HexagonRoleStat[] {
    const fromBreakdown = this.mapFromRoleBreakdown(overall?.roleBreakdown ?? null);
    if (fromBreakdown.length > 0) {
      return fromBreakdown;
    }

    if (ratings.length === 0) {
      return [];
    }

    const byRole = new Map<RoleType, number>();
    for (const rating of ratings) {
      const previous = byRole.get(rating.roleType);
      if (previous === undefined || rating.currentRating > previous) {
        byRole.set(rating.roleType, rating.currentRating);
      }
    }

    return this.orderedRoles().map((role) => ({
      role,
      rating: Math.round((byRole.get(role) ?? 0) * 10) / 10,
    }));
  }

  private mapFromRoleBreakdown(
    roleBreakdown: OverallRating['roleBreakdown'] | null,
  ): HexagonRoleStat[] {
    if (!roleBreakdown) {
      return [];
    }

    return this.orderedRoles().map((role) => ({
      role,
      rating: Math.round((roleBreakdown[role] ?? 0) * 10) / 10,
    }));
  }

  private orderedRoles(): RoleType[] {
    return ['ATAQUE', 'MEDIOCAMPO', 'CARRILERO', 'DEFENSA', 'ARQUERO', 'DT'];
  }

  private averageFromRoles(stats: HexagonRoleStat[]): number {
    const sum = stats.reduce((acc, item) => acc + item.rating, 0);
    return sum / stats.length;
  }

  private versatilityPercent(stats: HexagonRoleStat[]): number {
    const over65 = stats.filter((item) => item.rating >= 65).length;
    return Math.round((over65 / stats.length) * 100);
  }

  private bestRole(stats: HexagonRoleStat[]): string {
    return stats.reduce((best, current) =>
      current.rating > best.rating ? current : best,
    ).role;
  }

  private matchesFromRatings(ratings: RatingByRole[]): number {
    return ratings.reduce((acc, item) => Math.max(acc, item.matchesPlayed), 0);
  }

  private toRoleAbbreviation(role: string | null | undefined): string {
    if (!role) {
      return '--';
    }

    const normalizedRole = role.toUpperCase();
    const abbreviations: Record<string, string> = {
      ATAQUE: 'ATQ',
      MEDIOCAMPO: 'MED',
      CARRILERO: 'CAR',
      DEFENSA: 'DEF',
      ARQUERO: 'ARQ',
      DT: 'DT',
    };

    return abbreviations[normalizedRole] ?? normalizedRole.slice(0, 3);
  }

  private demoHexagon(): HexagonRoleStat[] {
    return [
      { role: 'ATAQUE', rating: 85 },
      { role: 'MEDIOCAMPO', rating: 78 },
      { role: 'CARRILERO', rating: 72 },
      { role: 'DEFENSA', rating: 65 },
      { role: 'ARQUERO', rating: 55 },
      { role: 'DT', rating: 60 },
    ];
  }

  private demoSummary(): Stat[] {
    return [
      {
        label: 'Nivel General',
        value: '83.8',
        icon: 'overall',
        description:
          'Valor general de rendimiento del jugador. Resume tus calificaciones por rol en un solo indicador.',
      },
      {
        label: 'Rol Destacado',
        value: 'ATQ 85.0',
        icon: 'best-role',
        valueClass: 'metallic-stat__value--small',
        description:
          'Rol donde actualmente tienes tu mejor calificación. Incluye abreviación del rol y su puntaje.',
      },
      {
        label: 'Partidos Jugados',
        value: 113,
        icon: 'matches',
        description: 'Cantidad total de partidos registrados para tu perfil.',
      },
      {
        label: 'Indice de Versatilidad',
        value: '67%',
        icon: 'versatility',
        description:
          'Porcentaje de roles en los que mantienes rendimiento competitivo. Un valor alto indica mayor adaptación.',
      },
    ];
  }

  private demoOutcomes(): Stat[] {
    return [
      { label: 'Victorias', value: 21, icon: 'win' },
      { label: 'Empates', value: 4, icon: 'draw' },
      { label: 'Derrotas', value: 8, icon: 'loss' },
    ];
  }
}

