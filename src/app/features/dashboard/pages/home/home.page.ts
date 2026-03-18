import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { MatchHistoryViewItem, MatchHistoryService } from 'src/app/features/matches/services/match-history.service';
import { NotificationBadgeService } from 'src/app/features/matches/services/notification-badge.service';
import { InvitationsStore } from 'src/app/features/matches/stores/invitations.store';
import { RatingsApiService } from 'src/app/features/ratings/services/ratings-api.service';
import { buildMainBottomNav } from 'src/app/shared/navigation/main-bottom-nav';
import {
  MetallicBottomNavComponent,
  MetallicBottomNavItem,
} from 'src/app/shared/ui/metallic-bottom-nav/metallic-bottom-nav.component';
import { MetallicCardComponent } from 'src/app/shared/ui/metallic-card/metallic-card.component';
import { MetallicFormSectionComponent } from 'src/app/shared/ui/metallic-form-section/metallic-form-section.component';

interface HomeActivityItem {
  id: string;
  text: string;
  variant: 'xp' | 'mvp' | 'rank' | 'match';
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    CommonModule,
    IonicModule,
    MetallicCardComponent,
    MetallicFormSectionComponent,
    MetallicBottomNavComponent,
  ],
})
export class HomePage {
  private readonly authSessionService = inject(AuthSessionService);
  private readonly navigationService = inject(NavigationService);
  private readonly ratingsApiService = inject(RatingsApiService);
  private readonly matchHistoryService = inject(MatchHistoryService);
  private readonly invitationsStore = inject(InvitationsStore);
  private readonly notificationBadgeService = inject(NotificationBadgeService);

  readonly iconBase = 'assets/icons/atleta';
  readonly titleIconAsset = `${this.iconBase}/ic_nav_home_24.svg`;
  readonly identityIconAsset = `${this.iconBase}/ic_comp_level_24.svg`;
  readonly statusIconAsset = `${this.iconBase}/ic_status_ready_24.svg`;
  readonly activityIconAsset = `${this.iconBase}/ic_comp_stats_24.svg`;

  isLoading = false;
  nextMatchLabel = 'Sin partido agendado';
  nextMatchDetail = 'Crea o acepta una invitación para entrar en competencia.';
  nextMatchStatus: MatchHistoryViewItem['displayStatusKey'] | 'NONE' = 'NONE';
  pendingInvitations = signal(0);

  playerName = 'Jugador';
  playerLevel = 1;
  divisionLabel = 'Bronce IV';
  streakValue = 0;
  totalXp = 0;
  currentXpProgress = 0;
  xpToNextLevel = 100;

  activities: HomeActivityItem[] = [];

  get bottomNavItems(): ReadonlyArray<MetallicBottomNavItem> {
    return buildMainBottomNav('home', this.notificationBadgeService.totalPending());
  }

  get xpProgressPercent(): number {
    return Math.max(0, Math.min(100, this.currentXpProgress));
  }

  get xpHint(): string {
    return `Te faltan ${this.xpToNextLevel} XP para subir de nivel.`;
  }

  ionViewWillEnter(): void {
    this.loadHomeData();
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

  private loadHomeData(): void {
    const session = this.authSessionService.currentSession;
    if (!session) {
      return;
    }

    this.playerName = session.user.nombre || 'Jugador';
    this.isLoading = true;

    forkJoin({
      overall: this.ratingsApiService.getOverall(session.user.atletaUuid).pipe(catchError(() => of(null))),
      history: this.matchHistoryService.getPlayerHistory(session.user.atletaUuid).pipe(catchError(() => of([]))),
    })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(async ({ overall, history }) => {
        await this.invitationsStore.loadPendingInvitations();
        void this.notificationBadgeService.refresh();

        this.pendingInvitations.set(this.invitationsStore.pendingInvitations().length);
        this.applyProgress(overall?.hybridOVR ?? 50);
        this.applyHistoryContext(history);
      });
  }

  private applyProgress(hybridOvr: number): void {
    const normalized = Math.max(0, Number.isFinite(hybridOvr) ? hybridOvr : 50);
    const derivedLevel = Math.max(1, Math.floor(normalized / 5));
    const currentBlock = (normalized % 5) / 5;
    const progressPercent = Math.round(currentBlock * 100);

    this.playerLevel = derivedLevel;
    this.currentXpProgress = progressPercent;
    this.xpToNextLevel = Math.max(1, 100 - progressPercent);
    this.totalXp = Math.round(normalized * 120);
    this.divisionLabel = this.resolveDivision(derivedLevel);
  }

  private applyHistoryContext(history: MatchHistoryViewItem[]): void {
    const now = Date.now();
    const current = this.resolveCurrentMatch(history, now);

    if (current) {
      this.nextMatchLabel = this.resolveCurrentMatchLabel(current);
      this.nextMatchDetail = `${current.dateLabel} · ${current.statusLabel}`;
      this.nextMatchStatus = current.displayStatusKey;
    } else {
      this.nextMatchLabel = 'Sin partido agendado';
      this.nextMatchDetail = 'Crea o acepta una invitación para entrar en competencia.';
      this.nextMatchStatus = 'NONE';
    }

    this.streakValue = this.computeParticipationStreak(history);
    this.activities = this.buildActivity(history);
  }

  private resolveCurrentMatch(history: MatchHistoryViewItem[], now: number): MatchHistoryViewItem | undefined {
    const live = [...history]
      .filter((item) => item.displayStatusKey === 'LIVE')
      .sort((a, b) => (b.scheduledAtEpoch ?? 0) - (a.scheduledAtEpoch ?? 0))[0];

    if (live) {
      return live;
    }

    const upcoming = [...history]
      .filter(
        (item) =>
          item.displayStatusKey !== 'FINISHED' &&
          item.displayStatusKey !== 'INVALID' &&
          !!item.scheduledAtEpoch &&
          (item.scheduledAtEpoch ?? 0) > now,
      )
      .sort((a, b) => (a.scheduledAtEpoch ?? 0) - (b.scheduledAtEpoch ?? 0))[0];

    if (upcoming) {
      return upcoming;
    }

    return [...history]
      .filter((item) => item.displayStatusKey === 'FINISHED')
      .sort((a, b) => (b.scheduledAtEpoch ?? 0) - (a.scheduledAtEpoch ?? 0))[0];
  }

  private resolveCurrentMatchLabel(item: MatchHistoryViewItem): string {
    if (item.displayStatusKey === 'LIVE') {
      return `Partido jugandose: ${item.modalityLabel}`;
    }

    if (item.displayStatusKey === 'FINISHED') {
      return `Ultimo partido: ${item.modalityLabel}`;
    }

    return `Proximo partido: ${item.modalityLabel}`;
  }

  private computeParticipationStreak(history: MatchHistoryViewItem[]): number {
    const ordered = [...history]
      .filter((item) => item.status === 'FINALIZADO')
      .sort((a, b) => (b.scheduledAtEpoch ?? 0) - (a.scheduledAtEpoch ?? 0))
      .slice(0, 10);

    let streak = 0;
    for (const item of ordered) {
      if (item.outcome === null) {
        break;
      }
      streak += 1;
    }
    return streak;
  }

  private buildActivity(history: MatchHistoryViewItem[]): HomeActivityItem[] {
    const top = [...history]
      .sort((a, b) => (b.scheduledAtEpoch ?? 0) - (a.scheduledAtEpoch ?? 0))
      .slice(0, 4);

    if (top.length === 0) {
      return [
        { id: 'activity-1', text: 'Completa tu primer partido para desbloquear actividad reciente.', variant: 'xp' },
      ];
    }

    return top.map((item, index) => ({
      id: `activity-${item.id}`,
      text:
        index === 0
          ? `Ganaste +${Math.max(30, item.goals * 20 + item.assists * 15)} XP en tu último partido.`
          : item.outcome === 'GANADO'
            ? `Tu equipo ganó ${item.scoreLabel} y sumó momentum competitivo.`
            : item.mvpLabel === 'Si'
              ? 'Fuiste destacado como MVP en un partido reciente.'
              : `Partido ${item.statusLabel.toLowerCase()} (${item.modalityLabel}).`,
      variant: index === 0 ? 'xp' : item.mvpLabel === 'Si' ? 'mvp' : item.outcome === 'GANADO' ? 'rank' : 'match',
    }));
  }

  private resolveDivision(level: number): string {
    if (level >= 18) {
      return 'Diamante II';
    }
    if (level >= 12) {
      return 'Oro I';
    }
    if (level >= 8) {
      return 'Plata II';
    }
    return 'Bronce IV';
  }

  getHomeStatusIconAsset(): string {
    if (this.nextMatchStatus === 'FINISHED') {
      return `${this.iconBase}/ic_status_finished_24.svg`;
    }
    if (this.nextMatchStatus === 'INVALID') {
      return `${this.iconBase}/ic_status_canceled_24.svg`;
    }
    if (this.nextMatchStatus === 'LIVE') {
      return `${this.iconBase}/ic_status_in_progress_24.svg`;
    }
    if (this.nextMatchStatus === 'CONFIRMED') {
      return `${this.iconBase}/ic_status_finished_24.svg`;
    }
    if (this.nextMatchStatus === 'CREATED') {
      return `${this.iconBase}/ic_status_in_assembly_24.svg`;
    }
    return `${this.iconBase}/ic_status_pending_24.svg`;
  }

  getHomeStatusClass(): string {
    if (this.nextMatchStatus === 'FINISHED' || this.nextMatchStatus === 'CONFIRMED') {
      return 'home-next-status--success';
    }
    if (this.nextMatchStatus === 'INVALID') {
      return 'home-next-status--danger';
    }
    if (this.nextMatchStatus === 'LIVE') {
      return 'home-next-status--warning';
    }
    if (this.nextMatchStatus === 'CREATED') {
      return 'home-next-status--neutral';
    }
    return 'home-next-status--empty';
  }

  getHomeStatusLabel(): string {
    if (this.nextMatchStatus === 'CREATED') {
      return 'En armado';
    }
    if (this.nextMatchStatus === 'CONFIRMED') {
      return 'Confirmado';
    }
    if (this.nextMatchStatus === 'LIVE') {
      return 'En juego';
    }
    if (this.nextMatchStatus === 'FINISHED') {
      return 'Finalizado';
    }
    if (this.nextMatchStatus === 'INVALID') {
      return 'Invalido';
    }
    return 'Sin estado';
  }
}
