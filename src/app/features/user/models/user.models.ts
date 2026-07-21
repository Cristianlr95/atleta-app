import { AuthenticatedUser } from 'src/app/core/models/auth-session.model';

export interface PlayerProfile {
  atletaUuid: string;
  alias?: string;
  nombre?: string;
  genero?: 'MASCULINO' | 'FEMENINO' | 'OTRO';
  trustScore?: number;
  createdAt?: string;
  positions?: PlayerPublicPosition[];
}

export interface UpdatePlayerProfileRequest {
  nombre: string;
  alias: string;
  positionIds: number[];
}

export interface PlayerPublicPosition {
  id: number;
  position?: {
    id: number;
    nombre: string;
  };
  prioridad: number;
  xp: number;
}

export interface AthleteProfile extends AuthenticatedUser {
  playerProfile?: PlayerProfile;
}

export interface UpdateTrustScoreRequest {
  cambio: number;
  motivo: string;
  matchId?: number;
}

export interface TrustLogEntry {
  id: number;
  player?: PlayerProfile;
  match?: {
    id: number;
    estado?: string;
    fechaHoraProgramada?: string;
  } | null;
  cambio: number;
  motivo: string;
  createdAt?: string;
}
