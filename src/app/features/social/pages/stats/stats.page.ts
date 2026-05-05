import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { MatchHistoryViewItem, MatchHistoryService } from 'src/app/features/matches/services/match-history.service';
import { NotificationBadgeService } from 'src/app/features/matches/services/notification-badge.service';
import { OverallRating, RatingByRole, RoleType } from 'src/app/features/ratings/models/rating.models';
import { RatingsApiService } from 'src/app/features/ratings/services/ratings-api.service';
import { buildMainBottomNav } from 'src/app/shared/navigation/main-bottom-nav';
import {
  MetallicBottomNavComponent,
  MetallicBottomNavItem,
} from 'src/app/shared/ui/metallic-bottom-nav/metallic-bottom-nav.component';
import { MetallicCardComponent } from 'src/app/shared/ui/metallic-card/metallic-card.component';
import { MetallicFormSectionComponent } from 'src/app/shared/ui/metallic-form-section/metallic-form-section.component';
import { MetallicStatsComponent, Stat } from 'src/app/shared/ui/metallic-stats/metallic-stats.component';
import { PageNavComponent } from 'src/app/shared/ui/page-nav/page-nav.component';

interface RoleStatView {
  role: RoleType;
  label: string;
  rating: number;
  matchesPlayed: number;
  progress: number;
}

interface RecentMatchView {
  id: number;
  title: string;
  detail: string;
  resultClass: string;
}

@Component({
  selector: 'app-stats-page',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    MetallicCardComponent,
    MetallicFormSectionComponent,
    MetallicStatsComponent,
    MetallicBottomNavComponent,
    PageNavComponent,
  ],
  templateUrl: './stats.page.html',
  styleUrls: ['./stats.page.scss'],
})
export class StatsPage implements OnDestroy {
  private readonly authSessionService = inject(AuthSessionService);
  private readonly ratingsApiService = inject(RatingsApiService);
  private readonly matchHistoryService = inject(MatchHistoryService);
  private readonly navigationService = inject(NavigationService);
  private readonly notificationBadgeService = inject(NotificationBadgeService);
  private readonly destroy$ = new Subject<void>();

  readonly titleIconAsset = 'assets/icons/atleta/ic_comp_stats_24.svg';
  readonly summaryIconAsset = 'assets/icons/atleta/ic_comp_trophy_24.svg';
  readonly rolesIconAsset = 'assets/icons/atleta/ic_match_lineup_24.svg';
  readonly trendIconAsset = 'assets/icons/atleta/ic_comp_streak_24.svg';

  isLoading = false;
  errorMessage: string | null = null;
  summaryStats: Stat[] = this.emptySummaryStats();
  roleStats: RoleStatView[] = [];
  recentMatches: RecentMatchView[] = [];
  insight = 'Juega partidos finalizados para desbloquear lecturas de rendimiento.';

  get bottomNavItems(): ReadonlyArray<MetallicBottomNavItem> {
    return buildMainBottomNav('ranking', this.notificationBadgeService.totalPending());
  }

  ionViewWillEnter(): void {
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onNavItemSelected(itemId: string): void {
    if (itemId === 'home') {
      void this.navigationService.safeNavigate(['/home']);
      return;
    }
    if (itemId === 'matches') {
      void this.navigationService.safeNavigate(['/matches']);
      return;
    }
    if (itemId === 'ranking') {
      void this.navigationService.safeNavigate(['/leaderboard']);
      return;
    }
    if (itemId === 'profile') {
      void this.navigationService.safeNavigate(['/player/profile']);
    }
  }

  onOpenLeaderboard(): void {
    void this.navigationService.safeNavigate(['/leaderboard']);
  }

  onRetry(): void {
    this.loadStats();
  }

  private loadStats(): void {
    const session = this.authSessionService.currentSession;
    if (!session) {
      this.errorMessage = 'No se encontro una sesion valida.';
      return;
    }

    const playerUuid = session.user.atletaUuid;
    this.isLoading = true;
    this.errorMessage = null;

    forkJoin({
      overall: this.ratingsApiService.getOverall(playerUuid).pipe(catchError(() => of(null))),
      roles: this.ratingsApiService.getByRole(playerUuid).pipe(catchError(() => of([] as RatingByRole[]))),
      history: this.matchHistoryService.getPlayerHistory(playerUuid).pipe(catchError(() => of([] as MatchHistoryViewItem[]))),
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false)),
      )
      .subscribe(({ overall, roles, history }) => {
        void this.notificationBadgeService.refresh();
        this.applyStats(overall, roles, history);
      });
  }

  private applyStats(
    overall: OverallRating | null,
    roles: RatingByRole[],
    history: MatchHistoryViewItem[],
  ): void {
    const countable = history.filter((item) => item.outcome !== null);
    const wins = countable.filter((item) => item.outcome === 'GANADO').length;
    const draws = countable.filter((item) => item.outcome === 'EMPATADO').length;
    const losses = countable.filter((item) => item.outcome === 'PERDIDO').length;
    const goals = history.reduce((sum, item) => sum + item.goals, 0);
    const assists = history.reduce((sum, item) => sum + item.assists, 0);
    const mvpCount = history.filter((item) => item.mvpLabel === 'Si').length;
    const totalMatches = countable.length || overall?.totalMatchesPlayed || this.matchesFromRoles(roles);
    const winRate = countable.length > 0 ? Math.round((wins / countable.length) * 100) : 0;
    const bestRole = this.resolveBestRole(overall, roles);
    const versatility = overall?.versatilityIndex !== undefined && overall?.versatilityIndex !== null
      ? Math.round(overall.versatilityIndex * 100)
      : this.resolveVersatility(roles);

    this.summaryStats = [
      {
        label: 'OVR actual',
        value: overall ? overall.hybridOVR.toFixed(1) : '--',
        icon: 'trophy-outline',
        description: 'Promedio competitivo actual del jugador.',
      },
      {
        label: 'Rol destacado',
        value: bestRole ? `${this.roleLabel(bestRole.role)} ${bestRole.rating.toFixed(1)}` : '--',
        icon: 'star-outline',
        valueClass: 'metallic-stat__value--small',
        description: 'Rol donde hoy tienes tu mejor rendimiento registrado.',
      },
      {
        label: 'Efectividad',
        value: countable.length > 0 ? `${winRate}%` : '--',
        icon: 'stats-chart-outline',
        description: 'Porcentaje de victorias sobre partidos finalizados con resultado.',
      },
      {
        label: 'G+A',
        value: goals + assists,
        icon: 'football-outline',
        description: 'Goles mas asistencias registrados en tu historial.',
      },
    ];

    this.roleStats = this.buildRoleStats(overall, roles);
    this.recentMatches = this.buildRecentMatches(history);
    this.insight = this.buildInsight({
      totalMatches,
      wins,
      draws,
      losses,
      goals,
      assists,
      mvpCount,
      versatility,
      bestRoleLabel: bestRole ? this.roleLabel(bestRole.role) : null,
    });
  }

  private buildRoleStats(overall: OverallRating | null, roles: RatingByRole[]): RoleStatView[] {
    const fromBreakdown = overall?.roleBreakdown
      ? this.orderedRoles().map((role) => ({
          role,
          label: this.roleLabel(role),
          rating: Math.round((overall.roleBreakdown[role] ?? 0) * 10) / 10,
          matchesPlayed: roles.find((item) => item.roleType === role)?.matchesPlayed ?? 0,
          progress: Math.max(0, Math.min(100, Math.round(overall.roleBreakdown[role] ?? 0))),
        }))
      : [];

    if (fromBreakdown.length > 0) {
      return fromBreakdown;
    }

    return this.orderedRoles().map((role) => {
      const rating = roles
        .filter((item) => item.roleType === role)
        .reduce((best, item) => Math.max(best, item.currentRating), 0);
      return {
        role,
        label: this.roleLabel(role),
        rating: Math.round(rating * 10) / 10,
        matchesPlayed: roles.find((item) => item.roleType === role)?.matchesPlayed ?? 0,
        progress: Math.max(0, Math.min(100, Math.round(rating))),
      };
    });
  }

  private buildRecentMatches(history: MatchHistoryViewItem[]): RecentMatchView[] {
    return [...history]
      .sort((a, b) => (b.scheduledAtEpoch ?? 0) - (a.scheduledAtEpoch ?? 0))
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        title: `${item.modalityLabel} - ${item.statusLabel}`,
        detail: `${item.dateLabel} | ${item.scoreLabel} | ${item.goals}G ${item.assists}A`,
        resultClass: item.outcome === 'GANADO'
          ? 'stats-match--win'
          : item.outcome === 'PERDIDO'
            ? 'stats-match--loss'
            : item.outcome === 'EMPATADO'
              ? 'stats-match--draw'
              : 'stats-match--neutral',
      }));
  }

  private buildInsight(input: {
    totalMatches: number;
    wins: number;
    draws: number;
    losses: number;
    goals: number;
    assists: number;
    mvpCount: number;
    versatility: number;
    bestRoleLabel: string | null;
  }): string {
    if (input.totalMatches <= 0) {
      return 'Completa tu primer partido para activar tendencias, efectividad y lectura por roles.';
    }

    const resultLine = `${input.wins}V ${input.draws}E ${input.losses}D`;
    const roleLine = input.bestRoleLabel ? `Tu mejor rol actual es ${input.bestRoleLabel}.` : 'Aun no hay rol dominante.';
    return `${resultLine}. ${roleLine} Versatilidad ${input.versatility}% y aporte ofensivo ${input.goals + input.assists} G+A.`;
  }

  private resolveBestRole(overall: OverallRating | null, roles: RatingByRole[]): { role: RoleType; rating: number } | null {
    if (overall?.bestRole && Number.isFinite(Number(overall.bestRoleRating))) {
      return { role: overall.bestRole, rating: Number(overall.bestRoleRating) };
    }

    const best = [...roles].sort((a, b) => b.currentRating - a.currentRating)[0];
    return best ? { role: best.roleType, rating: best.currentRating } : null;
  }

  private resolveVersatility(roles: RatingByRole[]): number {
    if (roles.length === 0) {
      return 0;
    }
    const competitiveRoles = new Set(roles.filter((item) => item.currentRating >= 65).map((item) => item.roleType));
    return Math.round((competitiveRoles.size / this.orderedRoles().length) * 100);
  }

  private matchesFromRoles(roles: RatingByRole[]): number {
    return roles.reduce((max, item) => Math.max(max, item.matchesPlayed), 0);
  }

  private emptySummaryStats(): Stat[] {
    return [
      { label: 'OVR actual', value: '--', icon: 'trophy-outline' },
      { label: 'Rol destacado', value: '--', icon: 'star-outline' },
      { label: 'Efectividad', value: '--', icon: 'stats-chart-outline' },
      { label: 'G+A', value: '--', icon: 'football-outline' },
    ];
  }

  private orderedRoles(): RoleType[] {
    return ['ATAQUE', 'MEDIOCAMPO', 'CARRILERO', 'DEFENSA', 'ARQUERO', 'DT'];
  }

  private roleLabel(role: RoleType): string {
    const labels: Record<RoleType, string> = {
      ATAQUE: 'Ataque',
      MEDIOCAMPO: 'Mediocampo',
      CARRILERO: 'Carrilero',
      DEFENSA: 'Defensa',
      ARQUERO: 'Arquero',
      DT: 'DT',
    };

    return labels[role];
  }
}
