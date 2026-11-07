import { MatchSize, Player } from '../models/progressive-match.models';
import { getFormationPresets, getPlayerRole, orderPlayersForFormation } from './formation-layout.util';

describe('formation layout', () => {
  it('creates the correct number of tactical slots for every modality', () => {
    expect(getFormationPresets(MatchSize.FIVE_VS_FIVE)[0].slots.length).toBe(5);
    expect(getFormationPresets(MatchSize.SIX_VS_SIX)[0].slots.length).toBe(6);
    expect(getFormationPresets(MatchSize.SEVEN_VS_SEVEN)[0].slots.length).toBe(7);
  });

  it('normalizes common spanish position names', () => {
    expect(getPlayerRole(player('Arquero'))).toBe('POR');
    expect(getPlayerRole(player('Defensa central'))).toBe('DEF');
    expect(getPlayerRole(player('Mediocampista'))).toBe('MED');
    expect(getPlayerRole(player('Delantero'))).toBe('DEL');
  });

  it('places players in the matching tactical row before using fallbacks', () => {
    const formation = getFormationPresets(MatchSize.FIVE_VS_FIVE)[0];
    const players = [player('Delantero', 90), player('Arquero', 70), player('Defensa', 80), player('Defensa', 75), player('Medio', 72)];
    const ordered = orderPlayersForFormation(players, formation);

    expect(ordered.map(getPlayerRole)).toEqual(['POR', 'DEF', 'DEF', 'MED', 'DEL']);
  });
});

function player(position: string, ovr = 65): Player {
  return { uuid: `${position}-${ovr}`, name: position, position, role: 'JUGADOR', ovr };
}
