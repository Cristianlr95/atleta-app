export type SocialRequestStatus = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'CANCELADA';
export type SocialNotificationType =
  | 'SOLICITUD_AMISTAD'
  | 'RESPUESTA_AMISTAD'
  | 'INVITACION_EQUIPO'
  | 'RESPUESTA_INVITACION_EQUIPO'
  | 'INVITACION_PARTIDO'
  | 'RESPUESTA_INVITACION_PARTIDO'
  | 'FORMULARIO_INCOMPLETO';

export interface SocialRequestItem {
  id: number;
  type: 'FRIENDSHIP' | 'TEAM_INVITE' | 'MATCH_INVITE';
  status: SocialRequestStatus;
  requesterUuid: string;
  requesterAlias: string;
  targetUuid: string;
  targetAlias: string;
  teamId?: number;
  teamName?: string;
  matchId?: number;
  message?: string;
  createdAt?: string;
  respondedAt?: string;
}

export interface SocialNotificationItem {
  id: number;
  type: SocialNotificationType;
  title: string;
  message: string;
  contextType?: string;
  contextId?: number;
  read: boolean;
  readAt?: string;
  createdAt?: string;
}

export interface UnreadNotificationCount {
  unreadCount: number;
}

export interface RegisterPushTokenPayload {
  token: string;
  platform: string;
  deviceId?: string;
}

export interface PushTokenRecord {
  id: number;
  playerUuid: string;
  platform: string;
  deviceId?: string;
  active: boolean;
  lastSeenAt?: string;
  createdAt?: string;
}

export interface CreateFriendRequestPayload {
  requesterUuid: string;
  targetUuid: string;
}

export interface CreateTeamInvitePayload {
  teamId: number;
  requesterUuid: string;
  targetUuid: string;
  message?: string;
}

export interface CreateMatchInvitePayload {
  matchId: number;
  teamId?: number;
  requesterUuid: string;
  targetUuid: string;
  message?: string;
}

export interface CreateMatchInvitesBatchPayload {
  matchId: number;
  teamId?: number;
  requesterUuid: string;
  targetUuids: string[];
  message?: string;
}

export interface RespondRequestPayload {
  actorUuid: string;
  accept: boolean;
}

export interface SocialPlayerLookupItem {
  atletaUuid: string;
  alias?: string | null;
  athleteName?: string | null;
  athleteEmail?: string | null;
}
