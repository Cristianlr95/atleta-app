import { Injectable, computed, signal } from '@angular/core';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatchService } from 'src/app/features/matches/services/match.service';
import { TeamSummary } from 'src/app/features/teams/models/team.models';
import { TeamApiService } from 'src/app/features/teams/services/team-api.service';
import {
  CreateFriendRequestPayload,
  CreateMatchInvitePayload,
  CreateTeamInvitePayload,
  RespondRequestPayload,
  SocialNotificationItem,
  SocialPlayerLookupItem,
  SocialRequestItem,
} from '../../models/social.models';
import { SocialApiService } from '../../services/social-api.service';
import { ActivityItem } from '../models/activity.models';
import { buildActivityItems, dedupeActivityById, groupSimilarActivityEvents } from '../utils/activity-feed-mapper.util';

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly playerUuid = signal<string | null>(null);
  private readonly loadingStore = signal(false);
  private readonly errorStore = signal<string | null>(null);
  private readonly activityStore = signal<ActivityItem[]>([]);
  private readonly friendshipsStore = signal<SocialRequestItem[]>([]);
  private readonly teamInvitesStore = signal<SocialRequestItem[]>([]);
  private readonly matchInvitesStore = signal<SocialRequestItem[]>([]);
  private readonly notificationsStore = signal<SocialNotificationItem[]>([]);
  private readonly teamsStore = signal<TeamSummary[]>([]);

  readonly loading = this.loadingStore.asReadonly();
  readonly error = this.errorStore.asReadonly();
  readonly activity = this.activityStore.asReadonly();
  readonly friendships = this.friendshipsStore.asReadonly();
  readonly teamInvites = this.teamInvitesStore.asReadonly();
  readonly matchInvites = this.matchInvitesStore.asReadonly();
  readonly notifications = this.notificationsStore.asReadonly();
  readonly teams = this.teamsStore.asReadonly();
  readonly unreadCount = computed(() => this.activityStore().filter((item) => !item.isRead).length);

  constructor(
    private readonly socialApiService: SocialApiService,
    private readonly teamApiService: TeamApiService,
    private readonly matchService: MatchService,
  ) {}

  async fetchActivity(playerUuid: string): Promise<void> {
    this.playerUuid.set(playerUuid);
    this.loadingStore.set(true);
    this.errorStore.set(null);

    try {
      const snapshot = await firstValueFrom(
        forkJoin({
          teams: this.teamApiService.getByPlayer(playerUuid).pipe(catchError(() => of([] as TeamSummary[]))),
          friendships: this.socialApiService.getFriendships(playerUuid).pipe(catchError(() => of([] as SocialRequestItem[]))),
          teamInvites: this.socialApiService.getTeamInvites(playerUuid).pipe(catchError(() => of([] as SocialRequestItem[]))),
          matchInvites: this.socialApiService.getMatchInvites(playerUuid).pipe(catchError(() => of([] as SocialRequestItem[]))),
          notifications: this.socialApiService.getNotifications(playerUuid).pipe(catchError(() => of([] as SocialNotificationItem[]))),
        }),
      );

      this.teamsStore.set(snapshot.teams);
      this.friendshipsStore.set(snapshot.friendships);
      this.teamInvitesStore.set(snapshot.teamInvites);
      this.matchInvitesStore.set(snapshot.matchInvites);
      this.notificationsStore.set(snapshot.notifications);

      const raw = buildActivityItems(
        {
          ...snapshot,
          activeMatches: this.matchService.activeMatches(),
        },
        playerUuid,
      );

      this.activityStore.set(this.groupSimilarEvents(dedupeActivityById(raw)));
    } catch {
      this.errorStore.set('No se pudo cargar la actividad social.');
    } finally {
      this.loadingStore.set(false);
    }
  }

  async markAsRead(activityId: string): Promise<void> {
    const item = this.activityStore().find((entry) => entry.id === activityId);
    if (!item) {
      return;
    }

    this.activityStore.update((items) => items.map((entry) => (entry.id === activityId ? { ...entry, isRead: true } : entry)));

    const playerUuid = this.playerUuid();
    if (item.target.notificationId && playerUuid) {
      try {
        await firstValueFrom(this.socialApiService.markNotificationRead(item.target.notificationId, playerUuid));
      } catch {
        return;
      }
    }
  }

  async markAllRead(): Promise<void> {
    const unread = this.activityStore().filter((item) => !item.isRead);
    for (const item of unread) {
      await this.markAsRead(item.id);
    }
  }

  getUnreadCount(): number {
    return this.unreadCount();
  }

  async sendFriendRequest(payload: CreateFriendRequestPayload): Promise<void> {
    await firstValueFrom(this.socialApiService.createFriendRequest(payload));
  }

  async respondFriendRequest(requestId: number, payload: RespondRequestPayload): Promise<void> {
    await firstValueFrom(this.socialApiService.respondFriendRequest(requestId, payload));
  }

  async sendTeamInvite(payload: CreateTeamInvitePayload): Promise<void> {
    await firstValueFrom(this.socialApiService.createTeamInvite(payload));
  }

  async respondTeamInvite(inviteId: number, payload: RespondRequestPayload): Promise<void> {
    await firstValueFrom(this.socialApiService.respondTeamInvite(inviteId, payload));
  }

  async deleteTeam(teamId: number, actorUuid: string): Promise<void> {
    await firstValueFrom(this.teamApiService.deleteTeam(teamId, actorUuid));
  }

  async sendMatchInvite(payload: CreateMatchInvitePayload): Promise<void> {
    await firstValueFrom(this.socialApiService.createMatchInvite(payload));
  }

  async respondMatchInvite(inviteId: number, payload: RespondRequestPayload): Promise<void> {
    await firstValueFrom(this.socialApiService.respondMatchInvite(inviteId, payload));
  }

  async searchPlayers(query: string): Promise<SocialPlayerLookupItem[]> {
    return firstValueFrom(this.socialApiService.searchPlayers(query));
  }

  groupSimilarEvents(items: ActivityItem[]): ActivityItem[] {
    return groupSimilarActivityEvents(items);
  }
}
