import { Match, MatchStatus } from 'src/app/features/matches/models/progressive-match.models';
import { SocialNotificationItem, SocialRequestItem } from '../../models/social.models';
import { ActivityItem, ActivityPriority, ActivityType } from '../models/activity.models';

export interface ActivityFeedSnapshot {
  friendships: SocialRequestItem[];
  teamInvites: SocialRequestItem[];
  matchInvites: SocialRequestItem[];
  notifications: SocialNotificationItem[];
  activeMatches: Match[];
}

export function buildActivityItems(snapshot: ActivityFeedSnapshot, playerUuid: string, now = new Date().toISOString()): ActivityItem[] {
  return [
    ...mapFriendshipEvents(snapshot.friendships, playerUuid),
    ...mapTeamInviteEvents(snapshot.teamInvites, playerUuid),
    ...mapMatchInviteEvents(snapshot.matchInvites, playerUuid),
    ...mapNotificationEvents(snapshot.notifications),
    ...mapMatchStatusEvents(snapshot.activeMatches, now),
  ];
}

export function groupSimilarActivityEvents(items: ActivityItem[]): ActivityItem[] {
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

export function dedupeActivityById(items: ActivityItem[]): ActivityItem[] {
  const unique = new Map<string, ActivityItem>();
  for (const item of items) {
    unique.set(item.id, item);
  }
  return [...unique.values()];
}

function mapFriendshipEvents(items: SocialRequestItem[], playerUuid: string): ActivityItem[] {
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

    return buildItem({
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
          : `Estado: ${humanizeStatus(item.status)}`,
      target: { userId: received ? item.requesterUuid : item.targetUuid, requestId: item.id },
      actions,
    });
  });
}

function mapTeamInviteEvents(items: SocialRequestItem[], playerUuid: string): ActivityItem[] {
  return items.map((item) => {
    const received = item.targetUuid === playerUuid;
    const type = item.status === 'ACEPTADA' ? ActivityType.TEAM_INVITE_ACCEPTED : ActivityType.TEAM_INVITE_RECEIVED;
    const teamLabel = item.teamName || `Equipo ${item.teamId}`;

    const actions: ActivityItem['actions'] =
      item.status === 'PENDIENTE' && received
        ? [
            { type: 'ACCEPT', label: 'Unirme', variant: 'primary' },
            { type: 'REJECT', label: 'No ahora', variant: 'danger' },
          ]
        : [{ type: 'OPEN_TEAM', label: 'Abrir equipo', variant: 'secondary' }];

    return buildItem({
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
      subtitle: item.status === 'PENDIENTE' ? 'Acepta para entrar al equipo.' : `Estado: ${humanizeStatus(item.status)}`,
      target: { teamId: item.teamId, requestId: item.id },
      actions,
    });
  });
}

function mapMatchInviteEvents(items: SocialRequestItem[], playerUuid: string): ActivityItem[] {
  return items.map((item) => {
    const received = item.targetUuid === playerUuid;
    const type = item.status === 'ACEPTADA' ? ActivityType.MATCH_INVITE_ACCEPTED : ActivityType.MATCH_INVITE_RECEIVED;

    const actions: ActivityItem['actions'] =
      item.status === 'PENDIENTE' && received
        ? [
            { type: 'ACCEPT', label: 'Jugar', variant: 'primary' },
            { type: 'REJECT', label: 'No puedo', variant: 'danger' },
          ]
        : [{ type: 'OPEN_MATCH', label: 'Abrir partido', variant: 'secondary' }];

    return buildItem({
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
      subtitle: item.status === 'PENDIENTE' ? 'Responde para confirmar cupo.' : `Estado: ${humanizeStatus(item.status)}`,
      target: { matchId: item.matchId, teamId: item.teamId, requestId: item.id },
      actions,
    });
  });
}

function mapNotificationEvents(items: SocialNotificationItem[]): ActivityItem[] {
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

    return buildItem({
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

function mapMatchStatusEvents(matches: Match[], now: string): ActivityItem[] {
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
      return buildItem({
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

function buildItem(input: {
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

function humanizeStatus(status: SocialRequestItem['status']): string {
  if (status === 'ACEPTADA') {
    return 'Aceptada';
  }
  if (status === 'LISTA_ESPERA') {
    return 'Lista de espera';
  }
  if (status === 'RECHAZADA') {
    return 'Rechazada';
  }
  if (status === 'CANCELADA') {
    return 'Cancelada';
  }
  return 'Pendiente';
}
