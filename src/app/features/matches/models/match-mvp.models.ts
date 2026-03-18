export interface MatchMvpCandidate {
  userId: string;
  alias: string;
}

export interface MatchMvpTallyItem {
  userId: string;
  alias: string;
  votes: number;
}

export interface MatchMvpResponse {
  matchId: number;
  finalizedAt?: string | null;
  closesAt?: string | null;
  open: boolean;
  myVote?: string | null;
  winnerUserId?: string | null;
  winnerAlias?: string | null;
  candidates: MatchMvpCandidate[];
  tally: MatchMvpTallyItem[];
}

export interface MatchMvpState {
  routeMatchId: string;
  localMatchId: string;
  backendMatchId: number;
  finalizedAt: string | null;
  closesAt: string | null;
  isOpen: boolean;
  myVote: string | null;
  winnerUserId: string | null;
  winnerAlias: string | null;
  candidates: MatchMvpCandidate[];
  tally: MatchMvpTallyItem[];
}
