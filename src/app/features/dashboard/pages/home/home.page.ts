import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { catchError, finalize, forkJoin, from, of } from 'rxjs';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { MatchHistoryViewItem, MatchHistoryService } from 'src/app/features/matches/services/match-history.service';
import { NotificationBadgeService } from 'src/app/features/matches/services/notification-badge.service';
import { InvitationsStore } from 'src/app/features/matches/stores/invitations.store';
import { RatingsApiService } from 'src/app/features/ratings/services/ratings-api.service';
import { TeamSummary } from 'src/app/features/teams/models/team.models';
import { TeamApiService } from 'src/app/features/teams/services/team-api.service';
import { UserApiService } from 'src/app/features/user/services/user-api.service';
import { buildMainBottomNav } from 'src/app/shared/navigation/main-bottom-nav';
import {
  MetallicBottomNavComponent,
  MetallicBottomNavItem,
} from 'src/app/shared/ui/metallic-bottom-nav/metallic-bottom-nav.component';
import { MetallicCardComponent } from 'src/app/shared/ui/metallic-card/metallic-card.component';
import { buildHomeActivity, HomeActivityItem } from '../../utils/home-activity.util';
import { PositionLevel, positionLevel } from '../../utils/position-level.util';

@Component({
  selector: 'app-home-page',
  standalone: true,
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    CommonModule,
    IonicModule,
    MetallicCardComponent,
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
  private readonly teamApiService = inject(TeamApiService);
  private readonly userApiService = inject(UserApiService);

  readonly iconBase = 'assets/icons/atleta-raster-v1';
  readonly titleIconAsset = `${this.iconBase}/ic_nav_home_96.png`;
  readonly teamIconAsset = `${this.iconBase}/ic_match_teams_96.png`;

  isLoading = false;
  nextMatchLabel = 'Sin partido agendado';
  nextMatchDetail = 'Crea o acepta una invitación para entrar en competencia.';
  nextMatchStatus: MatchHistoryViewItem['displayStatusKey'] | 'NONE' = 'NONE';
  pendingInvitations = signal<number | null>(null);
  invitationsUnavailable = false;
  teamsUnavailable = false;

  playerName = 'Jugador';
  overallHybridOvr: number | null = null;
  primaryPositionXp: number | null = null;
  levelProgress: PositionLevel | null = null;
  streakValue: number | null = null;
  historyUnavailable = false;

  activities: HomeActivityItem[] = [];
  currentTeam: TeamSummary | null = null;

  get bottomNavItems(): ReadonlyArray<MetallicBottomNavItem> {
    return buildMainBottomNav('home', this.notificationBadgeService.totalPending());
  }

  ionViewWillEnter(): void {
    this.loadHomeData();
  }

  onNavItemSelected(itemId: string): void {
    void this.navigationService.goToMainBottomSection(itemId);
  }

  onOpenTeam(): void {
    if (this.teamsUnavailable) {
      this.loadHomeData();
      return;
    }
    if (this.currentTeam) {
      void this.navigationService.safeNavigate(['/teams', String(this.currentTeam.id)]);
      return;
    }
    void this.navigationService.safeNavigate(['/sessions/create']);
  }

  onOpenMatches(): void {
    void this.navigationService.safeNavigate(['/matches']);
  }

  onOpenHistory(): void {
    void this.navigationService.safeNavigate(['/matches/history']);
  }

  loadHomeData(): void {
    const session = this.authSessionService.currentSession;
    if (!session) {
      return;
    }

    this.playerName = session.user.nombre || 'Jugador';
    this.isLoading = true;
    this.historyUnavailable = false;
    this.invitationsUnavailable = false;

    forkJoin({
      profile: this.userApiService.getPlayerProfile(session.user.atletaUuid).pipe(catchError(() => of(null))),
      overall: this.ratingsApiService.getOverall(session.user.atletaUuid).pipe(catchError(() => of(null))),
      history: this.matchHistoryService.getPlayerHistory(session.user.atletaUuid).pipe(catchError(() => of(null))),
      teams: this.teamApiService.getByPlayer(session.user.atletaUuid).pipe(catchError(() => of(null))),
      invitations: from(this.invitationsStore.loadPendingInvitations()).pipe(catchError(() => of(false))),
    })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(({ profile, overall, history, teams, invitations }) => {
        const xp = profile?.positions?.find((position) => position.prioridad === 1)?.xp;
        this.primaryPositionXp = typeof xp === 'number' && Number.isSafeInteger(xp) && xp >= 0 && xp <= 2147483647 ? xp : null;
        this.levelProgress = this.primaryPositionXp === null ? null : positionLevel(this.primaryPositionXp);
        this.overallHybridOvr = overall?.hybridOVR ?? null;
        void this.notificationBadgeService.refresh();

        this.invitationsUnavailable = !invitations;
        this.pendingInvitations.set(invitations ? this.invitationsStore.pendingInvitations().length : null);
        if (history === null) {
          this.historyUnavailable = true;
          this.nextMatchLabel = 'No se pudieron cargar los partidos';
          this.nextMatchDetail = 'Vuelve a intentarlo para consultar tu actividad.';
          this.nextMatchStatus = 'NONE';
          this.streakValue = null;
          this.activities = [];
        } else {
          this.applyHistoryContext(history);
        }
        this.teamsUnavailable = teams === null;
        this.currentTeam = teams?.[0] ?? null;
      });
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
    this.activities = buildHomeActivity(history);
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


}
