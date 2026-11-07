import { MatchHistoryViewItem } from 'src/app/features/matches/services/match-history.service';
import { MatchType } from 'src/app/features/matches/models/progressive-match.models';
import { buildHomeActivity } from './home-activity.util';

describe('buildHomeActivity', () => {
  it('returns an onboarding activity when history is empty', () => {
    expect(buildHomeActivity([])).toEqual([
      { id: 'activity-1', text: 'Completa tu primer partido para desbloquear actividad reciente.', variant: 'xp' },
    ]);
  });

  it('describes the latest finished win without inventing XP', () => {
    const [item] = buildHomeActivity([history({ outcome: 'GANADO', scoreLabel: '3 - 1' })]);

    expect(item.text).toBe('Tu equipo ganó 3 - 1 en tu último partido.');
    expect(item.variant).toBe('rank');
    expect(item.text).not.toContain('XP');
  });

  it('describes draw and loss outcomes accurately', () => {
    const [draw] = buildHomeActivity([history({ outcome: 'EMPATADO', scoreLabel: '2 - 2' })]);
    const [loss] = buildHomeActivity([history({ outcome: 'PERDIDO', scoreLabel: '0 - 1' })]);

    expect(draw.text).toBe('Tu equipo empató 2 - 2 en tu último partido.');
    expect(loss.text).toBe('Tu equipo perdió 0 - 1 en tu último partido.');
    expect(draw.variant).toBe('match');
    expect(loss.variant).toBe('match');
  });

  it('prioritizes MVP when the latest finished match has MVP evidence', () => {
    const [item] = buildHomeActivity([history({ outcome: 'GANADO', mvpLabel: 'Si' })]);

    expect(item.text).toBe('Fuiste destacado como MVP en tu último partido.');
    expect(item.variant).toBe('mvp');
  });

  it('does not claim a result for unfinished latest matches', () => {
    const [item] = buildHomeActivity([
      history({
        displayStatusKey: 'LIVE',
        statusLabel: 'En juego',
        outcome: null,
        scheduledAtEpoch: 2,
      }),
    ]);

    expect(item.text).toBe('Partido en juego (5 vs 5).');
    expect(item.variant).toBe('match');
  });
});

function history(overrides: Partial<MatchHistoryViewItem>): MatchHistoryViewItem {
  return {
    id: 1,
    scheduledAtEpoch: 1,
    modality: 'CINCO_VS_CINCO',
    matchType: MatchType.FRIENDLY,
    typeLabel: 'Amistoso',
    status: 'FINALIZADO',
    displayStatusKey: 'FINISHED',
    modalityLabel: '5 vs 5',
    dateLabel: '23/06/2026',
    statusLabel: 'Finalizado',
    outcome: 'GANADO',
    teamLabel: 'Local',
    positionLabel: 'Delantero',
    minutesPlayedLabel: '90',
    goals: 0,
    assists: 0,
    matchRatingLabel: 'N/D',
    mvpLabel: 'No',
    scoreLabel: '1 - 0',
    ...overrides,
  };
}
