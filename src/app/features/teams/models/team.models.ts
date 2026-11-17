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
  teamMatches?: number | null;
  teamAssists?: number | null;
  totalAssists?: number | null;
  teamGoals?: number | null;
  totalGoals?: number | null;
  playerUuid: string;
  alias: string;
  rol: 'JUGADOR' | 'CAPITAN' | 'DT';
  primaryPositionId: number | null;
  primaryPositionName: string | null;
  ovr?: number | null;
}

export interface TeamLeaderboardEntry {
  goalsScored?: number | null;
  mvpCount?: number | null;
  recentResults?: ReadonlyArray<'VICTORIA' | 'EMPATE' | 'DERROTA'> | null;
  rank: number;
  playerProfileId: string;
  alias: string;
  score: number | null;
  matchesPlayed: number;
  rated: boolean;
}

export interface TeamExternalRecord {
  teamId: number;
  teamName: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
}
