import { MatchHistoryViewItem } from 'src/app/features/matches/services/match-history.service';

export interface HomeActivityItem {
  id: string;
  text: string;
  variant: 'xp' | 'mvp' | 'rank' | 'match';
}

export function buildHomeActivity(history: MatchHistoryViewItem[]): HomeActivityItem[] {
  const top = [...history]
    .sort((a, b) => (b.scheduledAtEpoch ?? 0) - (a.scheduledAtEpoch ?? 0))
    .slice(0, 4);

  if (top.length === 0) {
    return [
      { id: 'activity-1', text: 'Completa tu primer partido para desbloquear actividad reciente.', variant: 'xp' },
    ];
  }

  return top.map((item, index) => buildActivityItem(item, index));
}

function buildActivityItem(item: MatchHistoryViewItem, index: number): HomeActivityItem {
  const isMostRecent = index === 0;
  const mvp = item.mvpLabel === 'Si';

  if (isMostRecent && item.displayStatusKey === 'FINISHED') {
    if (mvp) {
      return {
        id: `activity-${item.id}`,
        text: 'Fuiste destacado como MVP en tu último partido.',
        variant: 'mvp',
      };
    }

    if (item.outcome === 'GANADO') {
      return {
        id: `activity-${item.id}`,
        text: `Tu equipo ganó ${item.scoreLabel} en tu último partido.`,
        variant: 'rank',
      };
    }

    if (item.outcome === 'EMPATADO') {
      return {
        id: `activity-${item.id}`,
        text: `Tu equipo empató ${item.scoreLabel} en tu último partido.`,
        variant: 'match',
      };
    }

    if (item.outcome === 'PERDIDO') {
      return {
        id: `activity-${item.id}`,
        text: `Tu equipo perdió ${item.scoreLabel} en tu último partido.`,
        variant: 'match',
      };
    }

    return {
      id: `activity-${item.id}`,
      text: `Partido finalizado (${item.modalityLabel}) pendiente de estadísticas completas.`,
      variant: 'match',
    };
  }

  return {
    id: `activity-${item.id}`,
    text:
      item.outcome === 'GANADO'
        ? `Tu equipo ganó ${item.scoreLabel} y sumó momentum competitivo.`
        : mvp
          ? 'Fuiste destacado como MVP en un partido reciente.'
          : `Partido ${item.statusLabel.toLowerCase()} (${item.modalityLabel}).`,
    variant: mvp ? 'mvp' : item.outcome === 'GANADO' ? 'rank' : 'match',
  };
}
