import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subject, Subscription, firstValueFrom, forkJoin, interval, of } from 'rxjs';
import { catchError, finalize, map, switchMap, takeUntil } from 'rxjs/operators';
import { ApiError } from 'src/app/core/models/api-error.model';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { APP_CONFIG } from 'src/app/core/config/app-config.token';
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
import { PlayerPositionDisplay } from 'src/app/shared/ui/metallic-player-positions/metallic-player-positions.component';
import {
  HexagonRole,
  HexagonRoleStat,
  MetallicRoleHexagonComponent,
} from 'src/app/shared/ui/metallic-role-hexagon/metallic-role-hexagon.component';
import { TeamActiveMember, TeamSummary } from 'src/app/features/teams/models/team.models';
import { TeamApiService } from 'src/app/features/teams/services/team-api.service';
import { TEAM_INVITE_FORBIDDEN, TeamInvitationAccessService } from 'src/app/features/teams/services/team-invitation-access.service';
import { buildMainBottomNav } from 'src/app/shared/navigation/main-bottom-nav';
import { PlayerAssignedPosition } from '../../models/position.models';
import { PlayerAchievement, PlayerProfile } from '../../models/user.models';
import { PlayerPositionStateService } from '../../services/player-position-state.service';
import { ProfileTeamsComponent } from './profile-teams/profile-teams.component';
import { ProfileAchievementsComponent } from './profile-achievements/profile-achievements.component';
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

interface CompetitionSummary extends OutcomeSummary {
  matches: number;
  goals: number;
  assists: number;
}

@Component({
  selector: 'app-player-profile',
  standalone: true,
  templateUrl: './player-profile.page.html',
  styleUrls: ['./player-profile.page.scss'],
  providers: [TeamInvitationAccessService],
  imports: [
    CommonModule,
    IonicModule,
    ProfileTeamsComponent,
    ProfileAchievementsComponent,
    MetallicRoleHexagonComponent,
    MetallicBottomNavComponent,
  ],
})
export class PlayerProfilePage implements OnDestroy {
  private readonly authSessionService = inject(AuthSessionService);
  private readonly appConfig = inject(APP_CONFIG);
  readonly uploadsEnabled = this.appConfig.uploadsEnabled !== false;
  private readonly userApiService = inject(UserApiService);
  private readonly ratingsApiService = inject(RatingsApiService);
  private readonly matchHistoryService = inject(MatchHistoryService);
  private readonly teamApiService = inject(TeamApiService);
  private readonly teamInvitationAccess = inject(TeamInvitationAccessService);
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
  private teamMembersLoad?: Subscription;

  readonly iconBase = 'assets/icons/atleta-raster-v1';
  readonly profileTitleIconAsset = `${this.iconBase}/ic_nav_profile_96.png`;
  readonly teamsSectionIconAsset = `${this.iconBase}/ic_match_teams_96.png`;
  readonly settingsIconAsset = `${this.iconBase}/ic_auth_security_96.png`;
  readonly achievementsSectionIconAsset = `${this.iconBase}/ic_comp_medal_96.png`;

  get currentPlayerUuid(): string | null { return this.authSessionService.currentSession?.user.atletaUuid ?? null; }

  get bottomNavItems(): ReadonlyArray<MetallicBottomNavItem> {
    return buildMainBottomNav('profile', this.notificationBadgeService.totalPending());
  }

  isLoading = false;
  historyUnavailable = false;
  teamsUnavailable = false;
  errorMessage: string | null = null;

  displayName = 'Jugador';
  displayAlias = 'Sin alias';
  displayEmail = '';
  overallText = 'Intermedio';
  overallHybridOvr: number | null = null;
  overallVersatilityPercent: number | null = null;
  overallBestRole: HexagonRole | null = null;
  overallBestRoleRating: number | null = null;
  profilePictureUrl: string | null = null;
  isPictureUploading = false;
  competition: CompetitionSummary = { matches: 0, goals: 0, assists: 0, wins: 0, draws: 0, losses: 0, total: 0 };

  roleStats: HexagonRoleStat[] = [];
  get roleStatValues() {
    return this.orderedRoles().map(role => ({ role, rating: this.roleStats.find(stat => stat.role === role)?.rating ?? null }));
  }

  get hasStatistics(): boolean {
    return this.roleStats.length > 0 || this.overallHybridOvr !== null || this.competition.matches > 0;
  }
  achievements: PlayerAchievement[] = [];
  playerPositions: PlayerPositionDisplay[] = [];
  memberTeams: TeamSummary[] = [];
  get inviteTeamIds(): number[] {
    return this.memberTeams.filter(team => this.teamInvitationAccess.canInvite(team.id)).map(team => team.id);
  }
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
    this.teamInvitationAccess.clear();
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

  openTeamCreation(): void {
    void this.navigationService.safeNavigate(['/sessions/create']);
  }

  openTeam(teamId: number): void {
    void this.navigationService.safeNavigate(['/teams', String(teamId)]);
  }

  retryStatistics(): void {
    this.loadProfile();
  }

  async onPictureSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    input.value = '';
    if (!file) {
      return;
    }
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type) || file.size > 3 * 1024 * 1024) {
      await this.appToastService.error('Selecciona una imagen PNG, JPG o WebP de hasta 3 MB.');
      return;
    }
    const athleteUuid = this.authSessionService.currentSession?.user.atletaUuid;
    if (!athleteUuid) {
      await this.appToastService.error('Inicia sesión para guardar tu foto.');
      return;
    }
    try {
      this.isPictureUploading = true;
      const profile = await firstValueFrom(this.userApiService.uploadPlayerPicture(athleteUuid, file));
      this.profilePictureUrl = this.resolvePictureUrl(profile.pictureUrl);
      await this.appToastService.success('Foto de perfil actualizada.');
    } catch (error) {
      await this.appToastService.error(this.errorMapper.toUserMessage(error));
    } finally {
      this.isPictureUploading = false;
    }
  }

  isTeamCreator(team: TeamSummary): boolean {
    const currentUser = this.authSessionService.currentSession?.user.atletaUuid;
    if (!currentUser) {
      return false;
    }
    return team.creadorUuid === currentUser || team.creador?.atletaUuid === currentUser;
  }

  toggleTeamAccordion(teamId: number): void {
    const alreadyExpanded = this.expandedTeamId === teamId;
    this.closeTeamAccordion();
    if (alreadyExpanded) return;
    this.expandedTeamId = teamId;
    this.loadTeamMembers(teamId);
  }

  private closeTeamAccordion(): void {
    this.teamMembersLoad?.unsubscribe();
    this.clearInviteSearchTimer();
    this.expandedTeamId = null;
    this.inviteQuery = '';
    this.inviteCandidates = [];
    this.teamMembers = [];
    this.teamMembersError = null;
  }

  onInviteQueryChange(value: string): void {
    const teamId = this.expandedTeamId;
    if (teamId === null || !this.canInviteTo(teamId)) return;
    this.inviteQuery = value;
    this.clearInviteSearchTimer();
    const query = value.trim();
    if (query.length < 2) {
      this.inviteCandidates = [];
      return;
    }
    this.inviteSearchTimer = window.setTimeout(() => {
      void this.searchInviteCandidates(teamId, query);
    }, 300);
  }

  async onSendTeamInvite(targetUuid: string): Promise<void> {
    const requesterUuid = this.currentPlayerUuid;
    const teamId = this.expandedTeamId;
    if (!requesterUuid || teamId === null || !this.canInviteTo(teamId)) {
      return;
    }
    try {
      this.inviteSendingUuid = targetUuid;
      await firstValueFrom(
        this.socialApiService.createTeamInvite({
          teamId,
          requesterUuid,
          targetUuid,
        }),
      );
      await this.appToastService.success('Invitacion enviada.');
      if (this.expandedTeamId === teamId) {
        this.inviteCandidates = this.inviteCandidates.filter((item) => item.atletaUuid !== targetUuid);
      }
    } catch (error) {
      if ((error as ApiError | null)?.status === 403 && this.currentPlayerUuid === requesterUuid) {
        this.teamInvitationAccess.invalidate(teamId);
        if (this.expandedTeamId === teamId) {
          this.inviteCandidates = [];
          this.loadTeamMembers(teamId);
        } else if (this.memberTeams.some(team => team.id === teamId)) {
          this.loadInviteRoster(teamId);
        }
        await this.appToastService.error(TEAM_INVITE_FORBIDDEN);
      } else {
        await this.appToastService.error(this.errorMapper.toUserMessage(error, 'social'));
      }
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
        this.closeTeamAccordion();
      }
      await this.appToastService.success('Equipo eliminado.');
    } catch (error) {
      await this.appToastService.error(this.errorMapper.toUserMessage(error, 'social'));
    }
  }

  private loadProfile(isBackgroundRefresh = false): void {
    const session = this.authSessionService.currentSession;

    if (!session) {
      this.errorMessage = 'Inicia sesión para ver tus estadísticas.';
      this.roleStats = [];
      this.achievements = [];
      return;
    }

    const atletaUuid = session.user.atletaUuid;

    if (!isBackgroundRefresh) {
      this.isLoading = true;
    }

    this.errorMessage = null;
    this.historyUnavailable = false;
    this.teamsUnavailable = false;
    const failStatistics = () => { this.errorMessage = 'No pudimos cargar las estadísticas.'; };
    forkJoin({
      profile: this.userApiService.getPlayerProfile(atletaUuid).pipe(catchError(() => { failStatistics(); return of(null); })),
      achievements: this.userApiService.getPlayerAchievements(atletaUuid).pipe(catchError(() => of([] as PlayerAchievement[]))),
      overall: this.ratingsApiService.getOverall(atletaUuid).pipe(catchError(error => {
        if (error.status !== 404) failStatistics();
        return of(null);
      })),
      ratings: this.ratingsApiService.getByRole(atletaUuid).pipe(catchError(() => { failStatistics(); return of([]); })),
      history: this.matchHistoryService.getPlayerHistory(atletaUuid, { requireRatings: true }).pipe(catchError(() => {
        this.historyUnavailable = true;
        failStatistics();
        return of([]);
      })),
      teams: this.teamApiService.getByPlayer(atletaUuid).pipe(catchError(() => { this.teamsUnavailable = true; return of([] as TeamSummary[]); })),
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
        this.achievements = achievements;
        if (this.expandedTeamId !== null && !teams.some(team => team.id === this.expandedTeamId)) {
          this.closeTeamAccordion();
        }
        if (!isBackgroundRefresh) {
          for (const team of teams) {
            if (team.id === this.expandedTeamId) {
              this.loadTeamMembers(team.id);
            } else {
              this.loadInviteRoster(team.id);
            }
          }
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

  private canInviteTo(teamId: number): boolean {
    return this.memberTeams.some(team => team.id === teamId) && this.teamInvitationAccess.canInvite(teamId);
  }

  private loadInviteRoster(teamId: number): void {
    this.teamInvitationAccess.loadMembers(teamId).pipe(takeUntil(this.leave$)).subscribe({ error: () => undefined });
  }

  private async searchInviteCandidates(teamId: number, query: string): Promise<void> {
    const currentUser = this.currentPlayerUuid;
    if (!currentUser || this.expandedTeamId !== teamId || !this.canInviteTo(teamId)) {
      return;
    }
    try {
      this.inviteLoading = true;
      const candidates = await firstValueFrom(this.socialApiService.searchPlayers(query));
      if (this.expandedTeamId === teamId && this.inviteQuery.trim() === query && this.canInviteTo(teamId)) {
        this.inviteCandidates = (candidates ?? []).filter((item) => item.atletaUuid !== currentUser);
      }
    } catch (error) {
      this.inviteCandidates = [];
      await this.appToastService.error(this.errorMapper.toUserMessage(error, 'social'));
    } finally {
      this.inviteLoading = false;
    }
  }

  private loadTeamMembers(teamId: number): void {
    this.teamMembersLoad?.unsubscribe();
    this.teamMembersLoading = true;
    this.teamMembersError = null;
    this.teamMembersLoad = this.teamInvitationAccess.loadMembers(teamId).pipe(
      switchMap(members => members.length ? forkJoin(members.map(member =>
        this.ratingsApiService.getOverall(member.playerUuid).pipe(
          catchError(() => of(null)),
          map(overall => ({ ...member, ovr: overall?.hybridOVR ?? null })),
        ),
      )) : of([])),
      takeUntil(this.leave$),
      finalize(() => (this.teamMembersLoading = false)),
    ).subscribe({
      next: members => (this.teamMembers = members),
      error: error => {
        this.teamMembers = [];
        this.teamMembersError = this.errorMapper.toUserMessage(error, 'social');
      },
    });
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
    this.profilePictureUrl = this.resolvePictureUrl(profile?.pictureUrl);

    const mappedHexagon = this.mapRoleStats(overall, ratings);
    this.roleStats = mappedHexagon;

    this.overallText = overall?.classification || 'Intermedio';
    this.overallHybridOvr = overall?.hybridOVR ?? null;
    this.overallVersatilityPercent =
      overall?.versatilityIndex !== undefined && overall?.versatilityIndex !== null
        ? Math.round(overall.versatilityIndex * 100)
        : null;
    this.overallBestRole = (overall?.bestRole as HexagonRole | undefined) ?? null;
    this.overallBestRoleRating = overall?.bestRoleRating ?? null;
    const outcomeSummary = this.summarizeOutcomes(history);

    this.competition = {
      ...outcomeSummary,
      matches: outcomeSummary.total || overall?.totalMatchesPlayed || this.matchesFromRatings(ratings),
      goals: history.reduce((total, item) => total + item.goals, 0),
      assists: history.reduce((total, item) => total + item.assists, 0),
    };
    this.memberTeams = teams;
    this.playerPositions = this.toPositionDisplay(positions);
  }

  roleDisplay(role: HexagonRole | null): string {
    const labels: Record<HexagonRole, string> = {
      ATAQUE: 'Ataque',
      MEDIOCAMPO: 'Mediocampo',
      CARRILERO: 'Carrilero',
      DEFENSA: 'Defensa',
      ARQUERO: 'Arquero',
      DT: 'DT',
    };
    return role ? labels[role] : '--';
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
    this.profilePictureUrl = 'assets/fixtures/player-profile-demo.png';
    this.roleStats = this.demoHexagon();
    this.competition = { matches: 18, goals: 12, assists: 6, wins: 11, draws: 3, losses: 4, total: 18 };
    this.achievements = this.demoAchievements();
    this.memberTeams = [];
    this.playerPositions = [
      { name: 'Delantero', priorityLabel: 'Principal' },
      { name: 'Mediocampista', priorityLabel: 'Secundaria' },
      { name: 'Defensa', priorityLabel: 'Terciaria' },
    ];
    this.overallText = 'Experto';
    this.overallHybridOvr = 83.8;
    this.overallVersatilityPercent = 67;
    this.overallBestRole = 'ATAQUE';
    this.overallBestRoleRating = 85;
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

  private resolvePictureUrl(pictureUrl?: string): string | null {
    if (!pictureUrl) {
      return null;
    }
    if (/^https?:\/\//i.test(pictureUrl)) {
      return pictureUrl;
    }
    const apiOrigin = this.appConfig.apiBaseUrl.replace(/\/api\/v1\/?$/, '');
    return `${apiOrigin}${pictureUrl.startsWith('/') ? pictureUrl : `/${pictureUrl}`}`;
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
      if (!Number.isFinite(rating.currentRating)) continue;
      const previous = byRole.get(rating.roleType);
      if (previous === undefined || rating.currentRating > previous) {
        byRole.set(rating.roleType, rating.currentRating);
      }
    }

    const stats: HexagonRoleStat[] = [];
    for (const role of this.orderedRoles()) {
      const value = byRole.get(role);
      if (value !== undefined) stats.push({ role, rating: Math.round(value * 10) / 10 });
    }
    return stats;
  }

  private mapFromRoleBreakdown(
    roleBreakdown: OverallRating['roleBreakdown'] | null,
  ): HexagonRoleStat[] {
    if (!roleBreakdown) {
      return [];
    }

    const stats: HexagonRoleStat[] = [];
    for (const role of this.orderedRoles()) {
      const value = roleBreakdown[role];
      if (typeof value === 'number' && Number.isFinite(value)) stats.push({ role, rating: Math.round(value * 10) / 10 });
    }
    return stats;
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

}

