export enum ActivityType {
  FRIEND_REQUEST_RECEIVED = 'FRIEND_REQUEST_RECEIVED',
  FRIEND_REQUEST_ACCEPTED = 'FRIEND_REQUEST_ACCEPTED',
  TEAM_INVITE_RECEIVED = 'TEAM_INVITE_RECEIVED',
  TEAM_INVITE_ACCEPTED = 'TEAM_INVITE_ACCEPTED',
  MATCH_INVITE_RECEIVED = 'MATCH_INVITE_RECEIVED',
  MATCH_INVITE_ACCEPTED = 'MATCH_INVITE_ACCEPTED',
  MATCH_ALMOST_READY = 'MATCH_ALMOST_READY',
  MATCH_CONFIRMED = 'MATCH_CONFIRMED',
  MATCH_REMINDER_24H = 'MATCH_REMINDER_24H',
  MATCH_REMINDER_2H = 'MATCH_REMINDER_2H',
  MATCH_FINISHED = 'MATCH_FINISHED',
  RANKING_POINTS_GAINED = 'RANKING_POINTS_GAINED',
  MVP_ASSIGNED = 'MVP_ASSIGNED',
  STATS_UPDATED = 'STATS_UPDATED',
}

export type ActivityPriority = 'HIGH' | 'MED' | 'LOW';

export type ActivityActionType =
  | 'ACCEPT'
  | 'REJECT'
  | 'VIEW'
  | 'OPEN_MATCH'
  | 'OPEN_TEAM'
  | 'OPEN_PROFILE'
  | 'MARK_READ';

export interface ActivityActor {
  uuid?: string;
  name: string;
}

export interface ActivityTarget {
  userId?: string;
  teamId?: number;
  matchId?: number;
  requestId?: number;
  notificationId?: number;
}

export interface ActivityAction {
  type: ActivityActionType;
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface ActivityItem<TPayload = unknown> {
  id: string;
  type: ActivityType;
  createdAt: string;
  isRead: boolean;
  priority: ActivityPriority;
  actor: ActivityActor;
  target: ActivityTarget;
  payload: TPayload;
  actions: ActivityAction[];
  title: string;
  subtitle: string;
  groupCount?: number;
}
