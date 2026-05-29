import { AuthenticatedUser } from 'src/app/core/models/auth-session.model';

export interface PlayerProfile {
  atletaUuid: string;
  alias?: string;
  trustScore?: number;
  createdAt?: string;
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
