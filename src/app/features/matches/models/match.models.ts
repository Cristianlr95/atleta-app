export type MatchModality = 'CINCO_VS_CINCO' | 'SEIS_VS_SEIS' | 'SIETE_VS_SIETE';
export type MatchGenderCategory = 'MIXTO' | 'SOLO_MUJERES' | 'SOLO_HOMBRES';
export type MatchStatus = 'CREADO' | 'INICIADO' | 'FINALIZADO' | 'INVALIDO';
export type MatchValidationStatus =
  | 'PENDING'
  | 'VALID'
  | 'INVALID_TIME_WINDOW'
  | 'INVALID_CONFIRMATION_THRESHOLD'
  | 'INVALID_STATE';
export type MatchRole = 'JUGADOR' | 'CAPITAN' | 'DT';
export type MatchEventType = 'GOL' | 'ASISTENCIA';
export type MatchOutcome = 'GANADO' | 'EMPATADO' | 'PERDIDO';
export type PlayerGender = 'MASCULINO' | 'FEMENINO';

export interface CreateMatchRequest {
  creadorUuid: string;
  modalidad: MatchModality;
  categoriaGenero?: MatchGenderCategory;
  fechaHoraProgramada: string;
  latitud?: number;
  longitud?: number;
  cuota?: number;
}

export interface JoinMatchRequest {
  matchId: number;
  playerUuid: string;
  teamId: number;
  positionId: number;
  role: MatchRole;
}

export interface AddTeamToMatchRequest {
  matchId: number;
  teamId: number;
  esLocal: boolean;
}

export interface ConfirmMatchPlayerRequest {
  matchId: number;
  playerUuid: string;
}

export interface RemoveMatchPlayerRequest {
  matchId: number;
  playerUuid: string;
}

export interface ImportTeamPlayersRequest {
  matchId: number;
  teamId: number;
}

export interface UpdateMatchTeamAssignmentsRequest {
  actorUuid: string;
  homePlayerUuids: string[];
  awayPlayerUuids: string[];
}

export interface RegisterMatchEventRequest {
  matchId: number;
  playerUuid: string;
  teamId: number;
  eventType: MatchEventType;
  assistPlayerUuid?: string;
  registeredByUuid?: string;
}

export interface ConfirmMatchEventRequest {
  eventId: number;
  confirmingPlayerUuid: string;
  isLocalTeam: boolean;
}

export interface MatchResponse {
  id: number;
  modalidad: MatchModality;
  categoriaGenero?: MatchGenderCategory;
  fechaHoraProgramada: string;
  creador?: PlayerSummary;
  latitud?: number;
  longitud?: number;
  estado: MatchStatus;
  cuota?: number;
  startedAt?: string | null;
  finalizedAt?: string | null;
  validationStatus?: MatchValidationStatus;
  validationReason?: string | null;
  finalScoreLocal?: number;
  finalScoreAway?: number;
  closePending?: boolean;
  mvpVotingClosedAt?: string | null;
  mvpUser?: PlayerSummary;
  matchTeams?: MatchTeamSummary[];
  players?: MatchPlayerSummary[];
  events?: MatchEventSummary[];
}

export interface PlayerMatchHistoryItem {
  id: number;
  modalidad: MatchModality;
  fechaHoraProgramada: string;
  estado: MatchStatus;
  cuota?: number;
  resultado?: MatchOutcome;
  startedAt?: string | null;
  closePending?: boolean;
  finalScoreLocal?: number;
  finalScoreAway?: number;
  matchTeams?: MatchTeamSummary[];
  players?: MatchPlayerSummary[];
  events?: MatchEventSummary[];
}

export interface TeamSummary {
  id: number;
  nombre: string;
}

export interface PositionSummary {
  id: number;
  nombre: string;
}

export interface PlayerSummary {
  atletaUuid: string;
  alias: string;
  genero?: PlayerGender;
}

export interface MatchPlayerSummary {
  id: number;
  rol?: MatchRole;
  confirmado?: boolean;
  teamSide?: 'LOCAL' | 'VISITA';
  player?: PlayerSummary;
  team?: TeamSummary;
  position?: PositionSummary;
}

export interface MatchTeamSummary {
  id: number;
  esLocal: boolean;
  goles: number;
  team?: TeamSummary;
}

export interface MatchEventSummary {
  id: number;
  eventType: MatchEventType;
  player?: PlayerSummary;
  team?: TeamSummary;
  assistPlayer?: PlayerSummary;
  createdAt?: string;
  confirmedByLocal?: boolean;
  confirmedByVisitante?: boolean;
}

export interface MatchClosePreviewRequest {
  goalsByPlayer?: Record<string, number>;
  finalScoreLocal?: number;
  finalScoreAway?: number;
}

export interface MatchClosePreviewPlayer {
  playerUuid: string;
  alias: string;
  position: string;
  teamSide: 'LOCAL' | 'VISITA';
  goals: number;
  estimatedXp: number;
  currentHybridOvr?: number | null;
}

export interface MatchClosePreviewResponse {
  matchId: number;
  finalScoreLocal: number;
  finalScoreAway: number;
  players: MatchClosePreviewPlayer[];
}



