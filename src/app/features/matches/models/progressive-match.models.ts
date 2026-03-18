export enum MatchType {
  INTERNAL = 'INTERNAL',
  FRIENDLY = 'FRIENDLY',
  POINTS = 'POINTS',
}

export enum MatchStatus {
  CREATED = 'CREATED',
  PARTIAL_CONFIRMATIONS = 'PARTIAL_CONFIRMATIONS',
  CONFIRMED = 'CONFIRMED',
  LIVE = 'LIVE',
  INVALID = 'INVALID',
  FINISHED = 'FINISHED',
}

export enum MatchSize {
  FIVE_VS_FIVE = 'CINCO_VS_CINCO',
  SIX_VS_SIX = 'SEIS_VS_SEIS',
  SEVEN_VS_SEVEN = 'SIETE_VS_SIETE',
}

export enum MatchGenderCategory {
  MIXED = 'MIXTO',
  WOMEN_ONLY = 'SOLO_MUJERES',
  MEN_ONLY = 'SOLO_HOMBRES',
}

export enum PlayerInvitationStatus {
  INVITED = 'INVITED',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  PENDING = 'PENDING',
}

export interface MatchTheme {
  id: string;
  localAccent: string;
  awayAccent: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Venue {
  id: number;
  name: string;
  address: string;
  city?: string;
  coordinates?: Coordinates;
  googlePlaceId?: string;
}

export interface Player {
  uuid: string;
  name: string;
  gender?: 'MASCULINO' | 'FEMENINO';
  position: string;
  role: 'JUGADOR' | 'CAPITAN' | 'DT';
  teamId?: number;
  ovr?: number;
  avatarUrl?: string | null;
  selected?: boolean;
}

export interface Team {
  id: number;
  name: string;
}

export interface Invitation {
  id: string;
  matchId: string;
  backendMatchId?: number;
  backendInviteId?: number;
  targetUuid: string;
  targetName: string;
  status: PlayerInvitationStatus;
  createdAt: string;
  respondedAt?: string;
}

export interface MatchParticipant {
  userId: string;
  name: string;
  status: PlayerInvitationStatus;
  gender?: 'MASCULINO' | 'FEMENINO';
  avatarUrl?: string | null;
  position?: string;
  teamSide?: 'HOME' | 'AWAY';
  kitColor?: string;
  isCurrentUser?: boolean;
}

export interface Match {
  id: string;
  backendMatchId?: number;
  creatorUuid: string;
  creatorName: string;
  type: MatchType;
  modality: MatchSize;
  genderCategory: MatchGenderCategory;
  status: MatchStatus;
  team: Team;
  location: string;
  venueId?: number;
  venueName?: string;
  venueAddress?: string;
  latitude?: number;
  longitude?: number;
  googlePlaceId?: string;
  scheduledAt: string;
  startedAt?: string;
  finalizedAt?: string;
  closePending?: boolean;
  mvpVotingClosedAt?: string;
  finalScoreLocal?: number;
  finalScoreAway?: number;
  mvpUserUuid?: string;
  mvpUserAlias?: string;
  invitedCount: number;
  minRequired: number;
  maxPlayers?: number;
  themeId?: string;
  homeKitColor?: string;
  awayKitColor?: string;
  homePlayers: Player[];
  awayPlayers: Player[];
  createdAt: string;
}

export interface MatchDraftInput {
  type: MatchType;
  modality: MatchSize;
  genderCategory: MatchGenderCategory;
  team: Team;
  location: string;
  venue?: Venue | null;
  scheduledAt: string;
  minRequired: number;
  maxPlayers?: number;
  themeId?: string;
  homeKitColor?: string;
  awayKitColor?: string;
}

export interface MatchProgressView {
  confirmed: number;
  invited: number;
  minRequired: number;
  percentage: number;
  missing: number;
  statusMessage: string;
}

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}
