export type RoleType = 'ATAQUE' | 'MEDIOCAMPO' | 'CARRILERO' | 'DEFENSA' | 'ARQUERO' | 'DT';
export type PriorityLevel = 'PRINCIPAL' | 'SECUNDARIA' | 'TERCIARIA';
export type RatingMatchResult = 'GANADO' | 'EMPATE' | 'PERDIDO';
export type MatchResult = RatingMatchResult | 'VICTORIA' | 'DERROTA';

export interface PerformanceInput {
  playerProfileId: string;
  roleType: RoleType;
  priorityLevel: PriorityLevel;
  goalsScored: number;
  assistsMade: number;
  goalsConceded?: number;
  wasMvp: boolean;
  matchResult: RatingMatchResult;
}

export interface UpdateRatingsRequest {
  matchId: number;
  performances: PerformanceInput[];
}

export interface RatingByRole {
  id: number;
  playerProfileId: string;
  alias: string;
  roleType: RoleType;
  priorityLevel: PriorityLevel;
  currentRating: number;
  matchesPlayed: number;
  lastUpdated: string;
}

export interface OverallRating {
  playerProfileId: string;
  alias: string;
  hybridOVR: number;
  weightedOVR: number;
  simpleOVR: number;
  classification: string;
  versatilityIndex: number;
  consistencyScore: number;
  bestRole: RoleType;
  bestRoleRating: number;
  totalRatings: number;
  totalMatchesPlayed: number;
  roleBreakdown: Record<RoleType, number>;
}

export interface LeaderboardEntry {
  playerProfileId: string;
  playerId?: string;
  alias: string;
  name?: string;
  score: number;
  rating?: number;
  roleType?: RoleType;
  matchesPlayed?: number;
  wins?: number;
  losses?: number;
  draws?: number;
}

export interface RatingHistoryEntry {
  id: number;
  playerProfileId: string;
  roleType: RoleType;
  priorityLevel: PriorityLevel;
  matchId: number;
  newRating: number;
  goalsScored: number;
  assistsMade: number;
  wasMvp: boolean;
  matchResult: MatchResult;
  createdAt: string;
}
