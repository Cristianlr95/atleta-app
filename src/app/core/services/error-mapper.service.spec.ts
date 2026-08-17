import { ErrorMapperService } from './error-mapper.service';

describe('ErrorMapperService', () => {
  it('keeps the actionable reason returned by atomic match creation', () => {
    const service = new ErrorMapperService();

    expect(service.toUserMessage({
      status: 400,
      code: 'MATCH_CREATION_FAILED',
      message: 'Uno o mas jugadores invitados no existen',
    }, 'matches')).toBe('Uno o mas jugadores invitados no existen');
  });
});
