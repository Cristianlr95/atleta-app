export interface TeamSummary {
  id: number;
  nombre: string;
  creadorUuid?: string;
  creador?: {
    atletaUuid?: string;
  };
  logoUrl?: string | null;
  anioFundacion?: number | null;
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
