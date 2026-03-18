import { Player } from '../models/progressive-match.models';

type PositionLine = 'DEFENSA' | 'MEDIO' | 'DELANTERO';

type RankedPlayer = Player & { _score: number };

export interface BalancedTeamsResult {
  home: Player[];
  away: Player[];
  homeAverageOvr: number;
  awayAverageOvr: number;
}

export function buildBalancedTeams(players: Player[]): BalancedTeamsResult {
  const ranked = [...players]
    .map((player) => ({ ...player, _score: resolvePlayerScore(player) }))
    .sort((a, b) => {
      if (b._score !== a._score) {
        return b._score - a._score;
      }

      const nameCompare = (a.name ?? '').localeCompare(b.name ?? '', 'es', { sensitivity: 'base' });
      if (nameCompare !== 0) {
        return nameCompare;
      }

      return (a.uuid ?? '').localeCompare(b.uuid ?? '', 'es', { sensitivity: 'base' });
    });

  const home: RankedPlayer[] = [];
  const away: RankedPlayer[] = [];
  let homeScore = 0;
  let awayScore = 0;

  for (const player of ranked) {
    const shouldGoHome = home.length < away.length || (home.length === away.length && homeScore <= awayScore);
    if (shouldGoHome) {
      home.push(player);
      homeScore += player._score;
    } else {
      away.push(player);
      awayScore += player._score;
    }
  }

  applySoftLineRules(home, away);
  applyGenderBalanceRules(home, away);

  return {
    home: home.map(({ _score, ...player }) => player),
    away: away.map(({ _score, ...player }) => player),
    homeAverageOvr: resolveAverage(home),
    awayAverageOvr: resolveAverage(away),
  };
}

function applySoftLineRules(home: RankedPlayer[], away: RankedPlayer[]): void {
  const lines: PositionLine[] = ['DEFENSA', 'MEDIO', 'DELANTERO'];
  for (const line of lines) {
    const totalForLine = [...home, ...away].filter((player) => isLine(player, line)).length;
    if (totalForLine < 2) {
      continue;
    }

    ensureLineOnBothTeams(home, away, line);
    ensureLineOnBothTeams(away, home, line);
  }
}

function ensureLineOnBothTeams(missingTeam: RankedPlayer[], sourceTeam: RankedPlayer[], line: PositionLine): void {
  const missingHasLine = missingTeam.some((player) => isLine(player, line));
  if (missingHasLine) {
    return;
  }

  const sourceLinePlayers = sourceTeam.filter((player) => isLine(player, line));
  if (sourceLinePlayers.length < 2) {
    return;
  }

  let bestSwap:
    | {
        sourceIndex: number;
        targetIndex: number;
        diff: number;
      }
    | null = null;

  const currentMissingScore = missingTeam.reduce((sum, player) => sum + player._score, 0);
  const currentSourceScore = sourceTeam.reduce((sum, player) => sum + player._score, 0);

  for (const sourcePlayer of sourceLinePlayers) {
    const sourceIndex = sourceTeam.findIndex((player) => player.uuid === sourcePlayer.uuid);
    for (let targetIndex = 0; targetIndex < missingTeam.length; targetIndex += 1) {
      const targetPlayer = missingTeam[targetIndex];
      const nextMissingScore = currentMissingScore - targetPlayer._score + sourcePlayer._score;
      const nextSourceScore = currentSourceScore - sourcePlayer._score + targetPlayer._score;
      const diff = Math.abs(nextMissingScore - nextSourceScore);

      if (!bestSwap || diff < bestSwap.diff) {
        bestSwap = { sourceIndex, targetIndex, diff };
      }
    }
  }

  if (!bestSwap) {
    return;
  }

  const sourcePlayer = sourceTeam[bestSwap.sourceIndex];
  const targetPlayer = missingTeam[bestSwap.targetIndex];
  sourceTeam[bestSwap.sourceIndex] = targetPlayer;
  missingTeam[bestSwap.targetIndex] = sourcePlayer;
}

function isLine(player: Player, line: PositionLine): boolean {
  const value = (player.position || '').toLowerCase();
  if (line === 'DEFENSA') {
    return value.includes('def');
  }
  if (line === 'MEDIO') {
    return value.includes('medio');
  }
  return value.includes('delan') || value.includes('ataq');
}

function resolvePlayerScore(player: Player): number {
  const ovr = Number(player.ovr);
  return Number.isFinite(ovr) ? ovr : 65;
}

function resolveAverage(team: RankedPlayer[]): number {
  if (team.length === 0) {
    return 0;
  }

  const total = team.reduce((sum, player) => sum + player._score, 0);
  return Math.round((total / team.length) * 10) / 10;
}

function applyGenderBalanceRules(home: RankedPlayer[], away: RankedPlayer[]): void {
  for (let i = 0; i < 20; i += 1) {
    const homeWomen = home.filter((player) => player.gender === 'FEMENINO').length;
    const homeMen = home.filter((player) => player.gender === 'MASCULINO').length;
    const awayWomen = away.filter((player) => player.gender === 'FEMENINO').length;
    const awayMen = away.filter((player) => player.gender === 'MASCULINO').length;

    const homeDiff = homeWomen - homeMen;
    const awayDiff = awayWomen - awayMen;
    if (Math.abs(homeDiff) <= 1 && Math.abs(awayDiff) <= 1) {
      return;
    }

    if (homeDiff < -1 && awayDiff > 1) {
      if (!swapByGender(home, away, 'MASCULINO', 'FEMENINO')) {
        return;
      }
      continue;
    }

    if (homeDiff > 1 && awayDiff < -1) {
      if (!swapByGender(home, away, 'FEMENINO', 'MASCULINO')) {
        return;
      }
      continue;
    }

    return;
  }
}

function swapByGender(
  home: RankedPlayer[],
  away: RankedPlayer[],
  homeGender: 'MASCULINO' | 'FEMENINO',
  awayGender: 'MASCULINO' | 'FEMENINO',
): boolean {
  const homeCandidates = home
    .map((player, index) => ({ player, index }))
    .filter((item) => item.player.gender === homeGender);
  const awayCandidates = away
    .map((player, index) => ({ player, index }))
    .filter((item) => item.player.gender === awayGender);

  if (homeCandidates.length === 0 || awayCandidates.length === 0) {
    return false;
  }

  let bestPair:
    | {
        homeIndex: number;
        awayIndex: number;
        scoreGap: number;
      }
    | null = null;

  for (const homeCandidate of homeCandidates) {
    for (const awayCandidate of awayCandidates) {
      const scoreGap = Math.abs(homeCandidate.player._score - awayCandidate.player._score);
      if (!bestPair || scoreGap < bestPair.scoreGap) {
        bestPair = {
          homeIndex: homeCandidate.index,
          awayIndex: awayCandidate.index,
          scoreGap,
        };
      }
    }
  }

  if (!bestPair) {
    return false;
  }

  const homePlayer = home[bestPair.homeIndex];
  home[bestPair.homeIndex] = away[bestPair.awayIndex];
  away[bestPair.awayIndex] = homePlayer;
  return true;
}
