import { Injectable, computed, signal } from '@angular/core';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatchStatus } from 'src/app/features/matches/models/progressive-match.models';
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
import { ActivityItem, ActivityPriority, ActivityType } from '../models/activity.models';

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

      const raw = [
        ...this.mapFriendshipEvents(snapshot.friendships, playerUuid),
        ...this.mapTeamInviteEvents(snapshot.teamInvites, playerUuid),
        ...this.mapMatchInviteEvents(snapshot.matchInvites, playerUuid),
        ...this.mapNotificationEvents(snapshot.notifications),
        ...this.mapMatchStatusEvents(),
      ];

      this.activityStore.set(this.groupSimilarEvents(this.dedupeById(raw)));
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
    const sorted = [...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    const groupedMap = new Map<string, ActivityItem>();

    for (const item of sorted) {
      const key = `${item.type}-${item.target.matchId ?? ''}-${item.target.teamId ?? ''}-${item.target.userId ?? ''}`;
      const existing = groupedMap.get(key);
      if (!existing) {
        groupedMap.set(key, item);
        continue;
      }

      const canGroup = item.type === ActivityType.MATCH_INVITE_ACCEPTED || item.type === ActivityType.MATCH_INVITE_RECEIVED;
      if (!canGroup) {
        groupedMap.set(`${key}-${item.id}`, item);
        continue;
      }

      groupedMap.set(key, {
        ...existing,
        groupCount: (existing.groupCount ?? 1) + 1,
        subtitle: `${(existing.groupCount ?? 1) + 1} jugadores relacionados con este partido.`,
      });
    }

    return [...groupedMap.values()].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }

  private mapFriendshipEvents(items: SocialRequestItem[], playerUuid: string): ActivityItem[] {
    return items.map((item) => {
      const received = item.targetUuid === playerUuid;
      const accepted = item.status === 'ACEPTADA';
      const type = received
        ? accepted
          ? ActivityType.FRIEND_REQUEST_ACCEPTED
          : ActivityType.FRIEND_REQUEST_RECEIVED
        : ActivityType.FRIEND_REQUEST_ACCEPTED;

      const actions: ActivityItem['actions'] =
        item.status === 'PENDIENTE' && received
          ? [
              { type: 'ACCEPT', label: 'Aceptar', variant: 'primary' },
              { type: 'REJECT', label: 'Rechazar', variant: 'danger' },
            ]
          : [{ type: 'OPEN_PROFILE', label: 'Ver perfil', variant: 'secondary' }];

      return this.buildItem({
        id: `friend-${item.id}`,
        type,
        createdAt: item.createdAt,
        isRead: item.status !== 'PENDIENTE',
        priority: item.status === 'PENDIENTE' ? 'HIGH' : 'LOW',
        actor: item.requesterAlias || 'Jugador',
        title:
          item.status === 'PENDIENTE' && received
            ? `${item.requesterAlias} quiere ser tu amigo`
            : `Amistad con ${received ? item.requesterAlias : item.targetAlias}`,
        subtitle:
          item.status === 'PENDIENTE'
            ? 'Responde la solicitud para seguir conectando.'
            : `Estado: ${this.humanizeStatus(item.status)}`,
        target: { userId: received ? item.requesterUuid : item.targetUuid, requestId: item.id },
        actions,
      });
    });
  }

  private mapTeamInviteEvents(items: SocialRequestItem[], playerUuid: string): ActivityItem[] {
    return items.map((item) => {
      const received = item.targetUuid === playerUuid;
      const type =
        item.status === 'ACEPTADA'
          ? ActivityType.TEAM_INVITE_ACCEPTED
          : ActivityType.TEAM_INVITE_RECEIVED;
      const teamLabel = item.teamName || `Equipo ${item.teamId}`;

      const actions: ActivityItem['actions'] =
        item.status === 'PENDIENTE' && received
          ? [
              { type: 'ACCEPT', label: 'Unirme', variant: 'primary' },
              { type: 'REJECT', label: 'No ahora', variant: 'danger' },
            ]
          : [{ type: 'OPEN_TEAM', label: 'Abrir equipo', variant: 'secondary' }];

      return this.buildItem({
        id: `team-${item.id}`,
        type,
        createdAt: item.createdAt,
        isRead: item.status !== 'PENDIENTE',
        priority: item.status === 'PENDIENTE' ? 'HIGH' : 'MED',
        actor: item.requesterAlias || 'Capitan',
        title:
          item.status === 'PENDIENTE' && received
            ? `${item.requesterAlias} te invito a ${teamLabel}`
            : `Invitacion de equipo: ${teamLabel}`,
        subtitle:
          item.status === 'PENDIENTE'
            ? 'Acepta para entrar al equipo.'
            : `Estado: ${this.humanizeStatus(item.status)}`,
        target: { teamId: item.teamId, requestId: item.id },
        actions,
      });
    });
  }

  private mapMatchInviteEvents(items: SocialRequestItem[], playerUuid: string): ActivityItem[] {
    return items.map((item) => {
      const received = item.targetUuid === playerUuid;
      const type =
        item.status === 'ACEPTADA'
          ? ActivityType.MATCH_INVITE_ACCEPTED
          : ActivityType.MATCH_INVITE_RECEIVED;

      const actions: ActivityItem['actions'] =
        item.status === 'PENDIENTE' && received
          ? [
              { type: 'ACCEPT', label: 'Jugar', variant: 'primary' },
              { type: 'REJECT', label: 'No puedo', variant: 'danger' },
            ]
          : [{ type: 'OPEN_MATCH', label: 'Abrir partido', variant: 'secondary' }];

      return this.buildItem({
        id: `match-${item.id}`,
        type,
        createdAt: item.createdAt,
        isRead: item.status !== 'PENDIENTE',
        priority: item.status === 'PENDIENTE' ? 'HIGH' : 'MED',
        actor: item.requesterAlias || 'Organizador',
        title:
          item.status === 'PENDIENTE' && received
            ? `${item.requesterAlias} te invito a un partido`
            : `Invitacion al partido #${item.matchId}`,
        subtitle:
          item.status === 'PENDIENTE'
            ? 'Responde para confirmar cupo.'
            : `Estado: ${this.humanizeStatus(item.status)}`,
        target: { matchId: item.matchId, teamId: item.teamId, requestId: item.id },
        actions,
      });
    });
  }

  private mapNotificationEvents(items: SocialNotificationItem[]): ActivityItem[] {
    return items.map((item) => {
      const mappedType =
        item.type === 'INVITACION_PARTIDO'
          ? ActivityType.MATCH_INVITE_RECEIVED
          : item.type === 'RESPUESTA_INVITACION_PARTIDO'
            ? ActivityType.MATCH_INVITE_ACCEPTED
            : item.type === 'INVITACION_EQUIPO'
              ? ActivityType.TEAM_INVITE_RECEIVED
              : item.type === 'RESPUESTA_INVITACION_EQUIPO'
                ? ActivityType.TEAM_INVITE_ACCEPTED
                : item.type === 'SOLICITUD_AMISTAD'
                  ? ActivityType.FRIEND_REQUEST_RECEIVED
                  : item.type === 'RESPUESTA_AMISTAD'
                    ? ActivityType.FRIEND_REQUEST_ACCEPTED
                    : ActivityType.STATS_UPDATED;

      return this.buildItem({
        id: `notif-${item.id}`,
        type: mappedType,
        createdAt: item.createdAt,
        isRead: item.read,
        priority: item.read ? 'LOW' : 'MED',
        actor: 'Atleta',
        title: item.title,
        subtitle: item.message,
        target: {
          notificationId: item.id,
          matchId: item.contextType === 'MATCH' ? item.contextId : undefined,
          teamId: item.contextType === 'TEAM' ? item.contextId : undefined,
        },
        actions: [{ type: 'MARK_READ', label: item.read ? 'Leido' : 'Marcar leido', variant: 'secondary' }],
      });
    });
  }

  private mapMatchStatusEvents(): ActivityItem[] {
    const now = new Date().toISOString();
    const matches = this.matchService.activeMatches();
    return matches
      .filter(
        (match) =>
          match.status === MatchStatus.PARTIAL_CONFIRMATIONS ||
          match.status === MatchStatus.CONFIRMED ||
          match.status === MatchStatus.LIVE,
      )
      .map((match) => {
        const type =
          match.status === MatchStatus.CONFIRMED || match.status === MatchStatus.LIVE
            ? ActivityType.MATCH_CONFIRMED
            : ActivityType.MATCH_ALMOST_READY;
        return this.buildItem({
          id: `status-${match.id}`,
          type,
          createdAt: now,
          isRead: false,
          priority: match.status === MatchStatus.CONFIRMED || match.status === MatchStatus.LIVE ? 'HIGH' : 'MED',
          actor: 'Sistema',
          title:
            match.status === MatchStatus.LIVE
              ? 'Partido en juego'
              : match.status === MatchStatus.CONFIRMED
                ? 'Partido confirmado'
                : 'Partido armandose',
          subtitle:
            match.status === MatchStatus.LIVE
              ? 'El partido ya comenzo.'
              : match.status === MatchStatus.CONFIRMED
                ? 'Ya puedes organizar equipos y vestimenta.'
                : 'Ya hay confirmaciones en curso.',
          target: { matchId: match.backendMatchId },
          actions: [{ type: 'OPEN_MATCH', label: 'Abrir partido', variant: 'primary' }],
        });
      });
  }

  private buildItem(input: {
    id: string;
    type: ActivityType;
    createdAt?: string;
    isRead: boolean;
    priority: ActivityPriority;
    actor: string;
    title: string;
    subtitle: string;
    target: ActivityItem['target'];
    actions: ActivityItem['actions'];
  }): ActivityItem {
    return {
      id: input.id,
      type: input.type,
      createdAt: input.createdAt ?? new Date().toISOString(),
      isRead: input.isRead,
      priority: input.priority,
      actor: { name: input.actor },
      title: input.title,
      subtitle: input.subtitle,
      target: input.target,
      payload: {},
      actions: input.actions,
    };
  }

  private humanizeStatus(status: SocialRequestItem['status']): string {
    if (status === 'ACEPTADA') {
      return 'Aceptada';
    }
    if (status === 'RECHAZADA') {
      return 'Rechazada';
    }
    if (status === 'CANCELADA') {
      return 'Cancelada';
    }
    return 'Pendiente';
  }

  private dedupeById(items: ActivityItem[]): ActivityItem[] {
    const unique = new Map<string, ActivityItem>();
    for (const item of items) {
      unique.set(item.id, item);
    }
    return [...unique.values()];
  }
}
