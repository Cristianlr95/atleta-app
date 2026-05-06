import { CommonModule } from '@angular/common';
import { Component, OnDestroy, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { PageLoadGuard } from 'src/app/core/utils/page-load-guard';
import { MatchStatus } from 'src/app/features/matches/models/progressive-match.models';
import { MatchService } from 'src/app/features/matches/services/match.service';
import { NotificationBadgeService } from 'src/app/features/matches/services/notification-badge.service';
import { buildMainBottomNav } from 'src/app/shared/navigation/main-bottom-nav';
import {
  MetallicBottomNavComponent,
  MetallicBottomNavItem,
} from 'src/app/shared/ui/metallic-bottom-nav/metallic-bottom-nav.component';
import { MetallicCardComponent } from 'src/app/shared/ui/metallic-card/metallic-card.component';
import { PageNavComponent } from 'src/app/shared/ui/page-nav/page-nav.component';
import { ActivityFeedComponent } from '../activity/components/activity-feed/activity-feed.component';
import { ActivityActionType, ActivityItem } from '../activity/models/activity.models';
import { FriendsPanelComponent } from '../components/friends-panel/friends-panel.component';
import {
  MatchInvitationsPanelComponent,
  SocialConfirmedMatchView,
} from '../components/match-invitations-panel/match-invitations-panel.component';
import { SocialTabsComponent } from '../components/social-tabs/social-tabs.component';
import { TeamsPanelComponent } from '../components/teams-panel/teams-panel.component';
import { SocialFacadeService } from '../services/social-facade.service';

@Component({
  selector: 'app-social-page',
  standalone: true,
  templateUrl: './social.page.html',
  styleUrls: ['./social.page.scss'],
  imports: [
    CommonModule,
    IonicModule,
    MetallicCardComponent,
    MetallicBottomNavComponent,
    PageNavComponent,
    SocialTabsComponent,
    ActivityFeedComponent,
    FriendsPanelComponent,
    TeamsPanelComponent,
    MatchInvitationsPanelComponent,
  ],
})
export class SocialPage implements OnDestroy {
  readonly facade = inject(SocialFacadeService);
  private readonly route = inject(ActivatedRoute);
  private readonly navigationService = inject(NavigationService);
  private readonly notificationBadgeService = inject(NotificationBadgeService);
  private readonly matchService = inject(MatchService);

  readonly socialIconAsset = 'assets/icons/atleta/ic_match_invite_24.svg';

  private friendSearchHandle?: number;
  private inviteSearchHandle?: number;
  private readonly enterLoadGuard = new PageLoadGuard();


  readonly pendingFriends = this.facade.pendingFriends;
  readonly pendingTeams = this.facade.pendingTeamInvites;
  readonly pendingMatches = this.facade.pendingMatchInvites;

  readonly acceptedFriendships = computed(() =>
    this.facade.friendships().filter((item) => item.status === 'ACEPTADA'),
  );

  readonly principalTeam = computed(() => this.facade.teams()[0] ?? null);

  readonly confirmedMatches = computed<SocialConfirmedMatchView[]>(() =>
    this.matchService
      .activeMatches()
      .filter((match) => match.status === MatchStatus.CONFIRMED || match.status === MatchStatus.LIVE)
      .map((match) => ({
        id: (match.backendMatchId ?? Number(String(match.id).replace(/[^\d]/g, ''))) || 0,
        title: `${match.team.name} ${match.status === MatchStatus.LIVE ? 'en juego' : 'confirmado'}`,
        scheduledAt: match.scheduledAt,
      }))
      .filter((item) => item.id > 0),
  );

  get bottomNavItems(): ReadonlyArray<MetallicBottomNavItem> {
    const badgeCount = this.notificationBadgeService.totalPending() + this.facade.unreadCount();
    return buildMainBottomNav('matches', badgeCount);
  }

  ionViewWillEnter(): void {
    void this.loadOnEnter();
  }

  private async loadOnEnter(): Promise<void> {
    await this.enterLoadGuard.runSingle(async () => {
      const requestedTab = this.resolveRequestedTab();
      if (requestedTab) {
        this.facade.setActiveTab(requestedTab);
      }
      await this.facade.initialize();
      await this.notificationBadgeService.refresh();
    });
  }

  private resolveRequestedTab(): 'activity' | 'friends' | 'teams' | 'matches' | null {
    const requestedTab = this.route.snapshot.queryParamMap.get('tab') ?? this.route.snapshot.data['defaultSocialTab'];
    if (requestedTab === 'activity' || requestedTab === 'friends' || requestedTab === 'teams' || requestedTab === 'matches') {
      return requestedTab;
    }
    return null;
  }

  ngOnDestroy(): void {
    this.clearSearchTimers();
  }

  ionViewWillLeave(): void {
    this.clearSearchTimers();
  }

  private clearSearchTimers(): void {
    if (this.friendSearchHandle) {
      window.clearTimeout(this.friendSearchHandle);
      this.friendSearchHandle = undefined;
    }
    if (this.inviteSearchHandle) {
      window.clearTimeout(this.inviteSearchHandle);
      this.inviteSearchHandle = undefined;
    }
  }

  onNavItemSelected(itemId: string): void {
    void this.navigationService.goToMainBottomSection(itemId);
  }

  onActivityAction(event: { activityId: string; action: ActivityActionType }): void {
    const item = this.facade.activity().find((entry) => entry.id === event.activityId);
    if (!item) {
      return;
    }

    if (event.action === 'MARK_READ') {
      void this.facade.markActivityRead(event.activityId);
      return;
    }

    if (event.action === 'ACCEPT') {
      this.onAcceptItem(item);
      return;
    }

    if (event.action === 'REJECT') {
      this.onRejectItem(item);
      return;
    }

    this.onOpenContext(item);
  }

  onOpenContext(item: ActivityItem): void {
    if (item.target.matchId) {
      void this.navigationService.safeNavigate(['/matches', String(item.target.matchId)]);
      return;
    }
    if (item.target.teamId) {
      void this.navigationService.safeNavigate(['/sessions/create']);
      return;
    }
    if (item.target.userId) {
      void this.navigationService.safeNavigate(['/player/profile']);
    }
  }

  onFriendSearch(query: string): void {
    if (this.friendSearchHandle) {
      window.clearTimeout(this.friendSearchHandle);
    }
    this.friendSearchHandle = window.setTimeout(() => {
      void this.facade.searchFriendCandidates(query);
    }, 320);
  }

  onInviteSearch(query: string): void {
    if (this.inviteSearchHandle) {
      window.clearTimeout(this.inviteSearchHandle);
    }
    this.inviteSearchHandle = window.setTimeout(() => {
      void this.facade.searchInviteCandidates(query);
    }, 320);
  }

  onOpenProfile(_playerUuid: string): void {
    void this.navigationService.safeNavigate(['/player/profile']);
  }

  onOpenTeam(_teamId: number): void {
    void this.navigationService.safeNavigate(['/sessions/create']);
  }

  onOpenMatch(matchId: number): void {
    void this.navigationService.safeNavigate(['/matches', String(matchId)]);
  }

  async onRespondMatchInvite(event: { inviteId: number; accept: boolean }): Promise<void> {
    await this.respondMatchInvite(event.inviteId, event.accept);
  }

  onRetryLoad(): void {
    void this.loadOnEnter();
  }

  onSendTeamInvite(payload: { teamId: number; targetUuid: string }): void {
    void this.facade.sendTeamInvite(payload.teamId, payload.targetUuid);
  }

  onDeleteTeam(teamId: number): void {
    void this.facade.deleteTeam(teamId);
  }

  private onAcceptItem(item: ActivityItem): void {
    if (!item.target.requestId) {
      return;
    }
    if (item.id.startsWith('friend-')) {
      void this.facade.respondFriendRequest(item.target.requestId, true);
      return;
    }
    if (item.id.startsWith('team-')) {
      void this.facade.respondTeamInvite(item.target.requestId, true);
      return;
    }
    if (item.id.startsWith('match-')) {
      void this.respondMatchInvite(item.target.requestId, true);
    }
  }

  private onRejectItem(item: ActivityItem): void {
    if (!item.target.requestId) {
      return;
    }
    if (item.id.startsWith('friend-')) {
      void this.facade.respondFriendRequest(item.target.requestId, false);
      return;
    }
    if (item.id.startsWith('team-')) {
      void this.facade.respondTeamInvite(item.target.requestId, false);
      return;
    }
    if (item.id.startsWith('match-')) {
      void this.respondMatchInvite(item.target.requestId, false);
    }
  }

  private async respondMatchInvite(inviteId: number, accept: boolean): Promise<void> {
    await this.facade.respondMatchInvite(inviteId, accept);
    await this.notificationBadgeService.refresh();
  }
}

