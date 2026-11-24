import { CommonModule } from '@angular/common';
import { Component, ElementRef, Injector, OnDestroy, ViewChild, afterNextRender, inject, signal } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Subject, Subscription, catchError, finalize, firstValueFrom, forkJoin, from, map, of, switchMap, takeUntil } from 'rxjs';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { MatchHistoryViewItem, MatchHistoryService } from 'src/app/features/matches/services/match-history.service';
import { NotificationBadgeService } from 'src/app/features/matches/services/notification-badge.service';
import { InvitationsStore } from 'src/app/features/matches/stores/invitations.store';
import { UserApiService } from 'src/app/features/user/services/user-api.service';
import { buildMainBottomNav } from 'src/app/shared/navigation/main-bottom-nav';
import {
  MetallicBottomNavComponent,
  MetallicBottomNavItem,
} from 'src/app/shared/ui/metallic-bottom-nav/metallic-bottom-nav.component';
import { MetallicCardComponent } from 'src/app/shared/ui/metallic-card/metallic-card.component';
import { buildHomeActivity, HomeActivityItem } from '../../utils/home-activity.util';
import { PositionLevel, positionLevel } from '../../utils/position-level.util';

import { ApiError } from 'src/app/core/models/api-error.model';
import { AppToastService } from 'src/app/core/services/app-toast.service';
import { ErrorMapperService } from 'src/app/core/services/error-mapper.service';
import { RatingsApiService } from 'src/app/features/ratings/services/ratings-api.service';
import { SocialPlayerLookupItem } from 'src/app/features/social/models/social.models';
import { SocialApiService } from 'src/app/features/social/services/social-api.service';
import { TeamActiveMember, TeamSummary } from 'src/app/features/teams/models/team.models';
import { TeamApiService } from 'src/app/features/teams/services/team-api.service';
import { TEAM_INVITE_FORBIDDEN, TeamInvitationAccessService } from 'src/app/features/teams/services/team-invitation-access.service';
import { ProfileTeamsComponent } from 'src/app/features/user/pages/player-profile/profile-teams/profile-teams.component';

interface TeamMemberView extends TeamActiveMember {
  ovr: number | null;
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  providers: [TeamInvitationAccessService],
  imports: [
    ProfileTeamsComponent,
    CommonModule,
    IonicModule,
    MetallicCardComponent,
    MetallicBottomNavComponent,
  ],
})
export class HomePage implements OnDestroy {
  @ViewChild('teamSection') private teamSection?: ElementRef<HTMLElement>;
  private readonly injector = inject(Injector);
  private readonly leave$ = new Subject<void>();
  private teamMembersLoad?: Subscription;
  private inviteSearchTimer?: number;
  private teamEntryToFocus: string | null = null;
  private viewEntered = false;
  private readonly authSessionService = inject(AuthSessionService);
  private readonly navigationService = inject(NavigationService);
  private readonly matchHistoryService = inject(MatchHistoryService);
  private readonly invitationsStore = inject(InvitationsStore);
  private readonly notificationBadgeService = inject(NotificationBadgeService);
  private readonly userApiService = inject(UserApiService);

  private readonly ratingsApiService = inject(RatingsApiService);
  private readonly teamApiService = inject(TeamApiService);
  private readonly teamInvitationAccess = inject(TeamInvitationAccessService);
  private readonly socialApiService = inject(SocialApiService);
  private readonly appToastService = inject(AppToastService);
  private readonly errorMapper = inject(ErrorMapperService);

  readonly teamsSectionIconAsset = 'assets/icons/atleta-raster-v1/ic_match_teams_96.png';
  get currentPlayerUuid(): string | null { return this.authSessionService.currentSession?.user.atletaUuid ?? null; }
  teamsLoading = true;
  teamsUnavailable = false;
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

  isLoading = false;
  nextMatchLabel = 'Sin partido agendado';
  nextMatchDetail = 'Crea o acepta una invitación para entrar en competencia.';
  nextMatchStatus: MatchHistoryViewItem['displayStatusKey'] | 'NONE' = 'NONE';
  pendingInvitations = signal<number | null>(null);
  invitationsUnavailable = false;

  primaryPositionXp: number | null = null;
  levelProgress: PositionLevel | null = null;
  streakValue: number | null = null;
  historyUnavailable = false;

  activities: HomeActivityItem[] = [];

  get bottomNavItems(): ReadonlyArray<MetallicBottomNavItem> {
    return buildMainBottomNav('home', this.notificationBadgeService.totalPending());
  }

  ionViewWillEnter(): void {
    this.loadHomeData();
    this.loadTeams();
  }

  ionViewDidEnter(): void {
    this.viewEntered = true;
    this.restoreTeamEntryFocus();
  }

  ionViewWillLeave(): void {
    this.viewEntered = false;
    this.leave$.next();
    this.teamInvitationAccess.clear();
    this.closeTeamAccordion();
  }

  ngOnDestroy(): void {
    this.ionViewWillLeave();
    this.leave$.complete();
  }

  onNavItemSelected(itemId: string): void {
    void this.navigationService.goToMainBottomSection(itemId);
  }

  onOpenHistory(): void {
    void this.navigationService.safeNavigate(['/matches/history']);
  }

  loadHomeData(): void {
    const session = this.authSessionService.currentSession;
    if (!session) {
      return;
    }

    this.isLoading = true;
    this.historyUnavailable = false;
    this.invitationsUnavailable = false;

    forkJoin({
      profile: this.userApiService.getPlayerProfile(session.user.atletaUuid).pipe(catchError(() => of(null))),
      history: this.matchHistoryService.getPlayerHistory(session.user.atletaUuid).pipe(catchError(() => of(null))),
      invitations: from(this.invitationsStore.loadPendingInvitations()).pipe(catchError(() => of(false))),
    })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(({ profile, history, invitations }) => {
        const xp = profile?.positions?.find((position) => position.prioridad === 1)?.xp;
        this.primaryPositionXp = typeof xp === 'number' && Number.isSafeInteger(xp) && xp >= 0 && xp <= 2147483647 ? xp : null;
        this.levelProgress = this.primaryPositionXp === null ? null : positionLevel(this.primaryPositionXp);
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
      });
  }

  openTeamCreation(): void {
    void this.openTeamDestination(['/sessions/create'], 'create');
  }

  openTeam(teamId: number): void {
    void this.openTeamDestination(['/teams', String(teamId)], String(teamId));
  }

  private async openTeamDestination(path: string[], entry: string): Promise<void> {
    this.teamEntryToFocus = entry;
    if (!await this.navigationService.safeNavigate(path) && this.teamEntryToFocus === entry) {
      this.teamEntryToFocus = null;
    }
  }

  private restoreTeamEntryFocus(): void {
    if (!this.viewEntered || this.teamsLoading || this.teamEntryToFocus === null) return;
    const entry = this.teamEntryToFocus;
    afterNextRender(() => {
      if (!this.viewEntered || this.teamsLoading || this.teamEntryToFocus !== entry) return;
      this.teamEntryToFocus = null;
      const section = this.teamSection?.nativeElement;
      (section?.querySelector<HTMLElement>(`[data-team-entry="${entry}"]`) ?? section?.querySelector('h2'))?.focus();
    }, { injector: this.injector });
  }

  loadTeams(): void {
    const playerUuid = this.currentPlayerUuid;
    this.teamInvitationAccess.clear();
    this.closeTeamAccordion();
    this.memberTeams = [];
    this.teamsUnavailable = false;
    this.teamsLoading = !!playerUuid;
    if (!playerUuid) return;
    this.teamApiService.getByPlayer(playerUuid).pipe(
      takeUntil(this.leave$),
      finalize(() => {
        this.teamsLoading = false;
        this.restoreTeamEntryFocus();
      }),
    ).subscribe({
      next: teams => {
        this.memberTeams = teams;
        for (const team of teams) this.loadInviteRoster(team.id);
      },
      error: () => (this.teamsUnavailable = true),
    });
  }

  toggleTeamAccordion(teamId: number): void {
    if (!this.canInviteTo(teamId)) return;
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
    if (!requesterUuid || teamId === null || this.inviteSendingUuid || !this.canInviteTo(teamId)) {
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
      return `Partido en juego: ${item.modalityLabel}`;
    }

    if (item.displayStatusKey === 'FINISHED') {
      return `Último partido: ${item.modalityLabel}`;
    }

    return `Próximo partido: ${item.modalityLabel}`;
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
