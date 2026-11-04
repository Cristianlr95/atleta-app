import { MatchClosePage } from './match-close.page';
import { MatchPlayerSummary, MatchResponse } from '../../models/match.models';

describe('MatchClosePage roster', () => {
  it('includes the confirmed captain once and excludes withdrawn players', () => {
    const captain = { id: 1, confirmado: true, player: { atletaUuid: 'captain', alias: 'Capitan' }, team: { id: 7 } } as MatchPlayerSummary;
    const visitor = { id: 2, confirmado: true, teamSide: 'VISITA', player: { atletaUuid: 'visitor', alias: 'Visita' }, team: { id: 7 } } as MatchPlayerSummary;
    const withdrawn = { ...visitor, id: 3, confirmado: false, player: { atletaUuid: 'withdrawn' } } as MatchPlayerSummary;
    const context = { matchResponse: () => ({ matchTeams: [{ esLocal: true, team: { id: 7 } }] } as MatchResponse) } as unknown as MatchClosePage;
    const result = MatchClosePage.prototype['buildPlayers'].call(context, [captain, captain, visitor, withdrawn]);
    expect(result.map(player => player.userId)).toEqual(['captain', 'visitor']);
    expect(result.map(player => player.teamLabel)).toEqual(['LOCAL', 'VISITA']);
  });
});
