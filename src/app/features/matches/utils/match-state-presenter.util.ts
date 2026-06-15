import {
  Match,
  MatchParticipant,
  MatchProgressView,
  MatchStatus,
  Player,
} from '../models/progressive-match.models';

export function buildMatchProgress(
  status: MatchStatus,
  accepted: number,
  invited: number,
  minRequired: number,
  closePending?: boolean,
): MatchProgressView {
  const missing = Math.max(minRequired - accepted, 0);
  const percentage = minRequired > 0 ? Math.min((accepted / minRequired) * 100, 100) : 0;

  const statusMessage =
    status === MatchStatus.CONFIRMED
      ? 'Partido confirmado. Ya puedes formar equipos.'
      : status === MatchStatus.INVALID
        ? 'Partido invalido por tiempo o confirmaciones insuficientes.'
      : status === MatchStatus.LIVE
        ? closePending
          ? 'Partido terminado. Pendiente cierre de resultados.'
          : 'El partido esta en juego.'
      : status === MatchStatus.PARTIAL_CONFIRMATIONS
        ? 'Armandose el partido.'
      : missing > 0
        ? `Faltan ${missing} para confirmar el partido`
        : 'Invitaciones enviadas.';

  return {
    confirmed: accepted,
    invited,
    minRequired,
    percentage,
    missing,
    statusMessage,
  };
}

export function buildConfirmedPlayers(match: Match, participants: MatchParticipant[]): Player[] {
  const linked = new Map(
    [...(match.homePlayers ?? []), ...(match.awayPlayers ?? [])].map((item) => [item.uuid, item]),
  );

  return participants.map((item) => {
    const fallback = linked.get(item.userId);
    return {
      uuid: item.userId,
      name: item.name,
      gender: item.gender ?? fallback?.gender,
      role: fallback?.role ?? 'JUGADOR',
      position: item.position ?? fallback?.position ?? 'Sin posicion',
      teamId: fallback?.teamId,
      avatarUrl: item.avatarUrl,
      ovr: fallback?.ovr ?? 65,
    };
  });
}
