import { getMatchCloseBlockedReason } from './match-close-window.util';

describe('match close window', () => {
  const startedAt = '2026-10-26T18:00:00Z';
  it('uses the same instant for UTC and Santiago offset responses', () => {
    const now = Date.parse('2026-10-26T19:00:00Z');
    expect(getMatchCloseBlockedReason({ estado: 'INICIADO', startedAt }, now)).toBeNull();
    expect(getMatchCloseBlockedReason({ estado: 'INICIADO', startedAt: '2026-10-26T15:00:00-03:00' }, now)).toBeNull();
  });
  it('blocks a direct close URL before one hour and after three hours', () => {
    expect(getMatchCloseBlockedReason({ estado: 'INICIADO', startedAt }, Date.parse('2026-10-26T18:59:59Z'))).toContain('1 hora');
    expect(getMatchCloseBlockedReason({ estado: 'INICIADO', startedAt }, Date.parse('2026-10-26T21:00:01Z'))).toContain('3 horas');
  });
  it('blocks missing kickoff, unstarted, invalid and finalized matches', () => {
    expect(getMatchCloseBlockedReason({ estado: 'INICIADO' })).toBeTruthy();
    expect(getMatchCloseBlockedReason({ estado: 'CREADO' })).toContain('iniciar');
    expect(getMatchCloseBlockedReason({ estado: 'INVALIDO', validationReason: 'Vencido' })).toBe('Vencido');
    expect(getMatchCloseBlockedReason({ estado: 'FINALIZADO' })).toContain('finalizado');
  });
});
