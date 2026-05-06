import { Injectable, computed, signal } from '@angular/core';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { ErrorMapperService } from 'src/app/core/services/error-mapper.service';
import { PlayerInvitationStatus } from 'src/app/features/matches/models/progressive-match.models';
import { MatchStore } from 'src/app/features/matches/stores/match.store';
import { ActivityService } from '../activity/services/activity.service';
import { SocialPlayerLookupItem } from '../models/social.models';

export type SocialTabId = 'activity' | 'friends' | 'teams' | 'matches';

@Injectable({ providedIn: 'root' })
export class SocialFacadeService {
  private readonly activeTabStore = signal<SocialTabId>('activity');
  private readonly friendCandidatesStore = signal<SocialPlayerLookupItem[]>([]);
  private readonly inviteCandidatesStore = signal<SocialPlayerLookupItem[]>([]);
  private readonly searchLoadingStore = signal(false);
  private readonly successMessageStore = signal<string | null>(null);
  private readonly errorMessageStore = signal<string | null>(null);

  readonly activeTab = this.activeTabStore.asReadonly();
  readonly friendCandidates = this.friendCandidatesStore.asReadonly();
  readonly inviteCandidates = this.inviteCandidatesStore.asReadonly();
  readonly searchLoading = this.searchLoadingStore.asReadonly();
  readonly successMessage = this.successMessageStore.asReadonly();
  readonly errorMessage = this.errorMessageStore.asReadonly();

  readonly isLoading = this.activityService.loading;
  readonly activity = this.activityService.activity;
  readonly unreadCount = this.activityService.unreadCount;
  readonly teams = this.activityService.teams;
  readonly friendships = this.activityService.friendships;
  readonly teamInvites = this.activityService.teamInvites;
  readonly matchInvites = this.activityService.matchInvites;
  readonly notifications = this.activityService.notifications;

  readonly pendingFriends = computed(() =>
    this.activityService
      .friendships()
      .filter((item) => item.status === 'PENDIENTE' && item.targetUuid === this.playerUuid),
  );

  readonly pendingTeamInvites = computed(() =>
    this.activityService
      .teamInvites()
      .filter((item) => item.status === 'PENDIENTE' && item.targetUuid === this.playerUuid),
  );

  readonly pendingMatchInvites = computed(() =>
    this.activityService
      .matchInvites()
      .filter((item) => item.status === 'PENDIENTE' && item.targetUuid === this.playerUuid),
  );

  readonly socialBadgeCount = computed(
    () => this.pendingFriends().length + this.pendingTeamInvites().length + this.pendingMatchInvites().length,
  );

  readonly friendsCount = computed(() =>
    this.activityService.friendships().filter((item) => item.status === 'ACEPTADA').length,
  );

  readonly createdTeams = computed(() =>
    this.activityService.teams().filter((team) => team.creadorUuid === this.playerUuid || team.creador?.atletaUuid === this.playerUuid),
  );

  get playerUuid(): string | null {
    return this.authSessionService.currentSession?.user.atletaUuid ?? null;
  }

  constructor(
    private readonly activityService: ActivityService,
    private readonly authSessionService: AuthSessionService,
    private readonly matchStore: MatchStore,
    private readonly errorMapper: ErrorMapperService,
  ) {}

  async initialize(): Promise<void> {
    this.clearMessages();
    if (!this.playerUuid) {
      this.errorMessageStore.set('No se encontro una sesion valida.');
      return;
    }
    try {
      await this.activityService.fetchActivity(this.playerUuid);
    } catch (error) {
      this.errorMessageStore.set(this.errorMapper.toUserMessage(error, 'social'));
    }
  }

  setActiveTab(tab: SocialTabId): void {
    this.activeTabStore.set(tab);
  }

  async refresh(): Promise<void> {
    if (!this.playerUuid) {
      return;
    }
    try {
      await this.activityService.fetchActivity(this.playerUuid);
    } catch (error) {
      this.errorMessageStore.set(this.errorMapper.toUserMessage(error, 'social'));
    }
  }

  async markActivityRead(activityId: string): Promise<void> {
    await this.activityService.markAsRead(activityId);
  }

  async markAllActivityRead(): Promise<void> {
    await this.activityService.markAllRead();
  }

  async sendFriendRequest(targetUuid: string): Promise<void> {
    await this.executeAction(
      async () => {
        if (!this.playerUuid) {
          return;
        }
        await this.activityService.sendFriendRequest({ requesterUuid: this.playerUuid, targetUuid });
        this.successMessageStore.set('Solicitud enviada.');
        await this.refresh();
      },
      'social',
    );
  }

  async respondFriendRequest(requestId: number, accept: boolean): Promise<void> {
    await this.executeAction(
      async () => {
        if (!this.playerUuid) {
          return;
        }
        await this.activityService.respondFriendRequest(requestId, { actorUuid: this.playerUuid, accept });
        this.successMessageStore.set(accept ? 'Solicitud aceptada.' : 'Solicitud rechazada.');
        await this.refresh();
      },
      'social',
    );
  }

  async respondTeamInvite(inviteId: number, accept: boolean): Promise<void> {
    await this.executeAction(
      async () => {
        if (!this.playerUuid) {
          return;
        }
        await this.activityService.respondTeamInvite(inviteId, { actorUuid: this.playerUuid, accept });
        this.successMessageStore.set(accept ? 'Invitacion aceptada.' : 'Invitacion rechazada.');
        await this.refresh();
      },
      'social',
    );
  }

  async sendTeamInvite(teamId: number, targetUuid: string): Promise<void> {
    await this.executeAction(
      async () => {
        if (!this.playerUuid) {
          return;
        }
        await this.activityService.sendTeamInvite({
          teamId,
          requesterUuid: this.playerUuid,
          targetUuid,
        });
        this.successMessageStore.set('Invitacion de equipo enviada.');
        await this.refresh();
      },
      'social',
    );
  }

  async deleteTeam(teamId: number): Promise<void> {
    await this.executeAction(
      async () => {
        if (!this.playerUuid) {
          return;
        }
        await this.activityService.deleteTeam(teamId, this.playerUuid);
        this.successMessageStore.set('Equipo eliminado correctamente.');
        await this.refresh();
      },
      'social',
    );
  }

  async respondMatchInvite(inviteId: number, accept: boolean): Promise<void> {
    if (!this.playerUuid) {
      return;
    }
    const invite = this.matchInvites().find((item) => item.id === inviteId);
    if (invite?.matchId && invite.targetUuid) {
      this.matchStore.optimisticPatchByBackendMatchId(invite.matchId, {
        actorUuid: invite.targetUuid,
        status: accept ? PlayerInvitationStatus.ACCEPTED : PlayerInvitationStatus.DECLINED,
      });
    }

    try {
      await this.activityService.respondMatchInvite(inviteId, { actorUuid: this.playerUuid, accept });
      this.successMessageStore.set(accept ? 'Invitacion aceptada.' : 'Invitacion rechazada.');
    } catch (error) {
      this.errorMessageStore.set(this.errorMapper.toUserMessage(error, 'social'));
    } finally {
      if (invite?.matchId) {
        await this.matchStore.refreshByBackendMatchId(invite.matchId, true);
      }
      await this.refresh();
    }
  }

  async sendMatchInvite(matchId: number, targetUuid: string, teamId?: number): Promise<void> {
    await this.executeAction(
      async () => {
        if (!this.playerUuid) {
          return;
        }
        await this.activityService.sendMatchInvite({
          matchId,
          teamId,
          requesterUuid: this.playerUuid,
          targetUuid,
        });
        this.successMessageStore.set('Invitacion de partido enviada.');
        await this.refresh();
      },
      'social',
    );
  }

  async searchFriendCandidates(query: string): Promise<void> {
    const normalized = query.trim();
    if (normalized.length < 2) {
      this.friendCandidatesStore.set([]);
      return;
    }

    this.searchLoadingStore.set(true);
    try {
      const players = await this.activityService.searchPlayers(normalized);
      this.friendCandidatesStore.set(players.filter((item) => item.atletaUuid !== this.playerUuid));
      this.errorMessageStore.set(null);
    } catch (error) {
      this.friendCandidatesStore.set([]);
      this.errorMessageStore.set(this.errorMapper.toUserMessage(error, 'social'));
    } finally {
      this.searchLoadingStore.set(false);
    }
  }

  async searchInviteCandidates(query: string): Promise<void> {
    const normalized = query.trim();
    if (normalized.length < 2) {
      this.inviteCandidatesStore.set([]);
      return;
    }

    this.searchLoadingStore.set(true);
    try {
      const players = await this.activityService.searchPlayers(normalized);
      this.inviteCandidatesStore.set(players.filter((item) => item.atletaUuid !== this.playerUuid));
      this.errorMessageStore.set(null);
    } catch (error) {
      this.inviteCandidatesStore.set([]);
      this.errorMessageStore.set(this.errorMapper.toUserMessage(error, 'social'));
    } finally {
      this.searchLoadingStore.set(false);
    }
  }

  clearMessages(): void {
    this.successMessageStore.set(null);
    this.errorMessageStore.set(null);
  }

  private async executeAction(action: () => Promise<void>, context: 'social'): Promise<void> {
    this.errorMessageStore.set(null);
    try {
      await action();
    } catch (error) {
      this.errorMessageStore.set(this.errorMapper.toUserMessage(error, context));
    }
  }
}
