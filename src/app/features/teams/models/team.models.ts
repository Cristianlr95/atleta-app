export interface TeamSummary {
  id: number;
  nombre: string;
  creadorUuid?: string;
  creador?: {
    atletaUuid?: string;
  };
  logoUrl?: string | null;
  anioFundacion?: number | null;
  createdAt?: string;
  stats?: TeamStats | null;
}

export interface TeamStats {
  partidosJugados: number;
  partidosGanados: number;
  partidosEmpatados: number;
  partidosPerdidos: number;
  golesAnotados: number;
  golesRecibidos: number;
  diferenciagoles: number;
  puntos: number;
}

export interface CreateTeamRequest {
  nombre: string;
  creadorUuid: string;
  logoUrl?: string;
  anioFundacion?: number;
}

export interface TeamActiveMember {
  playerUuid: string;
  alias: string;
  rol: 'JUGADOR' | 'CAPITAN' | 'DT';
  primaryPositionId: number | null;
  primaryPositionName: string | null;
}

export interface TeamLeaderboardEntry {
  rank: number;
  playerProfileId: string;
  alias: string;
  score: number | null;
  matchesPlayed: number;
  rated: boolean;
}
