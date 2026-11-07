import { ErrorMapperService } from './error-mapper.service';

describe('ErrorMapperService', () => {
  it('explains why an invitation without a team cannot be accepted', () => {
    const service = new ErrorMapperService();
    expect(service.toUserMessage({ status: 409, code: 'MATCH_TEAM_REQUIRED', message: 'Conflict' }, 'social'))
      .toBe('El partido no tiene equipo asociado. Pide al organizador que lo configure.');
  });

  it('keeps the actionable reason returned by atomic match creation', () => {
    const service = new ErrorMapperService();

    expect(service.toUserMessage({
      status: 400,
      code: 'MATCH_CREATION_FAILED',
      message: 'Uno o mas jugadores invitados no existen',
    }, 'matches')).toBe('Uno o mas jugadores invitados no existen');
  });
});
