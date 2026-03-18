import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { NavigationService } from 'src/app/core/services/navigation.service';
import {
  MetallicBottomNavComponent,
  MetallicBottomNavItem,
} from 'src/app/shared/ui/metallic-bottom-nav/metallic-bottom-nav.component';
import { MetallicCardComponent } from 'src/app/shared/ui/metallic-card/metallic-card.component';
import {
  CompetitionHistoryDisplayItem,
  MetallicCompetitionHistoryComponent,
} from 'src/app/shared/ui/metallic-competition-history/metallic-competition-history.component';
import { MetallicFormSectionComponent } from 'src/app/shared/ui/metallic-form-section/metallic-form-section.component';
import { PageNavComponent } from 'src/app/shared/ui/page-nav/page-nav.component';
import { MetallicStatsComponent, Stat } from 'src/app/shared/ui/metallic-stats/metallic-stats.component';
import { buildMainBottomNav } from 'src/app/shared/navigation/main-bottom-nav';
import { MatchHistoryService, MatchHistoryViewItem } from '../../services/match-history.service';
import { NotificationBadgeService } from '../../services/notification-badge.service';

@Component({
  selector: 'app-matches-history-page',
  standalone: true,
  templateUrl: './matches-history.page.html',
  styleUrls: ['./matches-history.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MetallicCardComponent,
    MetallicFormSectionComponent,
    MetallicStatsComponent,
    MetallicCompetitionHistoryComponent,
    MetallicBottomNavComponent,
    PageNavComponent,
  ],
})
export class MatchesHistoryPage implements OnDestroy {
  private readonly authSessionService = inject(AuthSessionService);
  private readonly matchHistoryService = inject(MatchHistoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly navigationService = inject(NavigationService);
  private readonly notificationBadgeService = inject(NotificationBadgeService);

  private readonly isDemoMode: boolean;
  private readonly leave$ = new Subject<void>();

  readonly iconBase = 'assets/icons/atleta';
  readonly titleIconAsset = `${this.iconBase}/ic_nav_matches_24.svg`;
  readonly outcomesSectionIconAsset = `${this.iconBase}/ic_comp_stats_24.svg`;
  readonly historySectionIconAsset = `${this.iconBase}/ic_match_calendar_24.svg`;

  get bottomNavItems(): ReadonlyArray<MetallicBottomNavItem> {
    return buildMainBottomNav('matches', this.notificationBadgeService.totalPending());
  }

  isLoading = false;
  errorMessage: string | null = null;
  selectedOutcomeFilter = 'ALL';
  selectedModalityFilter = 'ALL';
  selectedStatusFilter = 'ALL';

  outcomeStats: Stat[] = this.demoOutcomeStats();
  allMatchHistoryItems: CompetitionHistoryDisplayItem[] = this.demoHistory();
  matchHistoryItems: CompetitionHistoryDisplayItem[] = this.demoHistory();

  constructor() {
    this.isDemoMode = this.route.snapshot.queryParamMap.get('demo') === '1';
  }

  ionViewWillEnter(): void {
    void this.notificationBadgeService.refresh();
    if (this.isDemoMode) {
      this.applyDemo();
      return;
    }

    this.loadHistory();
  }

  ionViewWillLeave(): void {
    this.leave$.next();
  }

  ngOnDestroy(): void {
    this.leave$.next();
    this.leave$.complete();
  }

  onNavItemSelected(itemId: string): void {
    if (itemId === 'home') {
      void this.navigationService.safeNavigate(['/home']);
      return;
    }

    if (itemId === 'profile') {
      void this.navigationService.safeNavigate(['/player/profile']);
      return;
    }

    if (itemId === 'ranking') {
      void this.navigationService.safeNavigate(['/leaderboard']);
      return;
    }

    if (itemId === 'matches') {
      void this.navigationService.safeNavigate(['/matches']);
    }
  }

  private loadHistory(): void {
    const session = this.authSessionService.currentSession;
    if (!session) {
      this.errorMessage = 'Mostrando datos de demostración. Inicia sesión para ver tus partidos reales.';
      this.applyDemo();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.matchHistoryService
      .getPlayerHistory(session.user.atletaUuid)
      .pipe(
        takeUntil(this.leave$),
        finalize(() => (this.isLoading = false)),
      )
      .subscribe({
        next: (history) => {
          this.outcomeStats = this.buildOutcomeStats(history);
          this.setHistoryItems(this.toHistoryDisplay(history));
        },
        error: () => {
          this.errorMessage = 'No se pudo cargar el historial. Mostrando datos de demostracion.';
          this.applyDemo();
        },
      });
  }

  onRetryLoad(): void {
    this.loadHistory();
  }

  onHistoryFilterChange(): void {
    this.applyHistoryFilters();
  }

  resetHistoryFilters(): void {
    this.selectedOutcomeFilter = 'ALL';
    this.selectedModalityFilter = 'ALL';
    this.selectedStatusFilter = 'ALL';
    this.applyHistoryFilters();
  }

  private applyDemo(): void {
    this.outcomeStats = this.demoOutcomeStats();
    this.setHistoryItems(this.demoHistory());
  }

  private buildOutcomeStats(history: MatchHistoryViewItem[]): Stat[] {
    const outcomes = history
      .map((item) => item.outcome)
      .filter((value): value is NonNullable<typeof value> => value !== null);

    return [
      {
        label: 'Victorias',
        value: outcomes.filter((outcome) => outcome === 'GANADO').length,
        icon: 'trophy-outline',
      },
      {
        label: 'Empates',
        value: outcomes.filter((outcome) => outcome === 'EMPATADO').length,
        icon: 'stats-chart-outline',
      },
      {
        label: 'Derrotas',
        value: outcomes.filter((outcome) => outcome === 'PERDIDO').length,
        icon: 'football-outline',
      },
    ];
  }

  private toHistoryDisplay(history: MatchHistoryViewItem[]): CompetitionHistoryDisplayItem[] {
    return history.map((item) => ({
      id: item.id,
      routeMatchId: `${item.id}`,
      dateEpoch: item.scheduledAtEpoch,
      modalityKey: item.modality,
      statusKey: item.status,
      outcomeKey: item.outcome ?? 'NONE',
      modalityLabel: item.modalityLabel,
      dateLabel: item.dateLabel,
      statusLabel: item.statusLabel,
      outcomeLabel: this.outcomeLabel(item.outcome),
      outcomeVariant: this.outcomeVariant(item.outcome),
      teamLabel: item.teamLabel,
      positionLabel: item.positionLabel,
      minutesPlayedLabel: item.minutesPlayedLabel,
      goals: item.goals,
      assists: item.assists,
      matchRatingLabel: item.matchRatingLabel,
      mvpLabel: item.mvpLabel,
      scoreLabel: item.scoreLabel,
    }));
  }

  private setHistoryItems(items: CompetitionHistoryDisplayItem[]): void {
    this.allMatchHistoryItems = this.sortHistoryByMostRecent(items);
    this.applyHistoryFilters();
  }

  private sortHistoryByMostRecent(items: CompetitionHistoryDisplayItem[]): CompetitionHistoryDisplayItem[] {
    return [...items].sort((a, b) => {
      const aEpoch = a.dateEpoch ?? Number.MIN_SAFE_INTEGER;
      const bEpoch = b.dateEpoch ?? Number.MIN_SAFE_INTEGER;
      return bEpoch - aEpoch;
    });
  }

  private applyHistoryFilters(): void {
    this.matchHistoryItems = this.allMatchHistoryItems.filter((item) => {
      const outcomeMatches = this.selectedOutcomeFilter === 'ALL' || item.outcomeKey === this.selectedOutcomeFilter;
      const modalityMatches = this.selectedModalityFilter === 'ALL' || item.modalityKey === this.selectedModalityFilter;
      const statusMatches = this.selectedStatusFilter === 'ALL' || item.statusKey === this.selectedStatusFilter;
      return outcomeMatches && modalityMatches && statusMatches;
    });
  }

  private outcomeLabel(outcome: MatchHistoryViewItem['outcome']): string {
    if (outcome === 'GANADO') {
      return 'Victoria';
    }
    if (outcome === 'EMPATADO') {
      return 'Empate';
    }
    if (outcome === 'PERDIDO') {
      return 'Derrota';
    }
    return 'Sin dato';
  }

  private outcomeVariant(outcome: MatchHistoryViewItem['outcome']): CompetitionHistoryDisplayItem['outcomeVariant'] {
    if (outcome === 'GANADO') {
      return 'win';
    }
    if (outcome === 'EMPATADO') {
      return 'draw';
    }
    if (outcome === 'PERDIDO') {
      return 'loss';
    }
    return 'neutral';
  }

  private demoOutcomeStats(): Stat[] {
    return [
      { label: 'Victorias', value: 21, icon: 'trophy-outline' },
      { label: 'Empates', value: 4, icon: 'stats-chart-outline' },
      { label: 'Derrotas', value: 8, icon: 'football-outline' },
    ];
  }

  private demoHistory(): CompetitionHistoryDisplayItem[] {
    return [
      {
        id: 901,
        dateEpoch: new Date('2026-02-18T20:00:00').getTime(),
        modalityKey: 'CINCO_VS_CINCO',
        statusKey: 'FINALIZADO',
        outcomeKey: 'GANADO',
        modalityLabel: '5 vs 5',
        dateLabel: '18/02/2026 20:00',
        statusLabel: 'Finalizado',
        outcomeLabel: 'Victoria',
        outcomeVariant: 'win',
        teamLabel: 'Atlas FC',
        positionLabel: 'Delantero',
        minutesPlayedLabel: '48',
        goals: 2,
        assists: 1,
        matchRatingLabel: '84.6',
        mvpLabel: 'Si',
        scoreLabel: '4 - 2',
      },
      {
        id: 902,
        dateEpoch: new Date('2026-02-15T19:30:00').getTime(),
        modalityKey: 'SIETE_VS_SIETE',
        statusKey: 'FINALIZADO',
        outcomeKey: 'EMPATADO',
        modalityLabel: '7 vs 7',
        dateLabel: '15/02/2026 19:30',
        statusLabel: 'Finalizado',
        outcomeLabel: 'Empate',
        outcomeVariant: 'draw',
        teamLabel: 'Atlas FC',
        positionLabel: 'Mediocampo',
        minutesPlayedLabel: '61',
        goals: 1,
        assists: 0,
        matchRatingLabel: '79.8',
        mvpLabel: 'No',
        scoreLabel: '3 - 3',
      },
      {
        id: 903,
        dateEpoch: new Date('2026-02-11T21:00:00').getTime(),
        modalityKey: 'SEIS_VS_SEIS',
        statusKey: 'FINALIZADO',
        outcomeKey: 'PERDIDO',
        modalityLabel: '6 vs 6',
        dateLabel: '11/02/2026 21:00',
        statusLabel: 'Finalizado',
        outcomeLabel: 'Derrota',
        outcomeVariant: 'loss',
        teamLabel: 'Atlas FC',
        positionLabel: 'Carrilero',
        minutesPlayedLabel: '52',
        goals: 0,
        assists: 1,
        matchRatingLabel: '71.4',
        mvpLabel: 'No',
        scoreLabel: '1 - 2',
      },
    ];
  }
}

