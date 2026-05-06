import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  provideAppConfigMock,
  provideAuthMocks,
  provideHttpTesting,
} from '../../../test/testbed-providers';
import { AuthApiService } from '../../features/auth/services/auth-api.service';
import { MatchesApiService } from '../../features/matches/services/matches-api.service';
import { RatingsApiService } from '../../features/ratings/services/ratings-api.service';
import { TeamApiService } from '../../features/teams/services/team-api.service';
import { CreateMatchRequest } from '../../features/matches/models/match.models';
import { UpdateRatingsRequest } from '../../features/ratings/models/rating.models';

describe('API contracts smoke', () => {
  const apiBaseUrl = 'http://localhost:8080/api/v1';
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpTesting(),
        provideAppConfigMock({
          apiBaseUrl,
          storagePrefix: 'atleta.contracts',
        }),
        provideAuthMocks({
          user: {
            atletaUuid: '11111111-1111-1111-1111-111111111111',
            email: 'jugador@atleta.test',
            nombre: 'Jugador Demo',
          },
          tokens: {
            accessToken: 'test-token',
          },
        }),
      ],
    });

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('keeps auth endpoints aligned with backend routes', () => {
    const service = TestBed.inject(AuthApiService);

    service.login({ email: 'jugador@atleta.test', password: 'secret' }).subscribe();
    expectRequest('POST', '/athletes/login').flush({});

    service.registerAthlete({
      nombre: 'Jugador Demo',
      email: 'nuevo@atleta.test',
      password: 'secret',
      genero: 'MASCULINO',
    }).subscribe();
    expectRequest('POST', '/athletes/register').flush({});

    service.loginWithGoogle({ idToken: 'google-id-token' }).subscribe();
    expectRequest('POST', '/athletes/auth/google').flush({});

    service.createPlayerProfile({
      atletaUuid: '11111111-1111-1111-1111-111111111111',
      alias: 'Demo10',
    }).subscribe();
    expectRequest('POST', '/player-profiles').flush({});
  });

  it('keeps team endpoints aligned with backend routes', () => {
    const service = TestBed.inject(TeamApiService);
    const creatorUuid = '11111111-1111-1111-1111-111111111111';
    const playerUuid = '22222222-2222-2222-2222-222222222222';

    service.createTeam({ nombre: 'Atleta FC', creadorUuid: creatorUuid }).subscribe();
    expectRequest('POST', '/teams').flush({});

    service.getByCreator(creatorUuid).subscribe();
    expectRequest('GET', `/teams/by-creator/${creatorUuid}`).flush([]);

    service.getByPlayer(playerUuid).subscribe();
    expectRequest('GET', `/teams/by-player/${playerUuid}`).flush([]);

    service.getActiveMembers(77).subscribe();
    expectRequest('GET', '/teams/77/members/active').flush([]);

    service.deleteTeam(77, creatorUuid).subscribe();
    const deleteRequest = expectRequest('DELETE', '/teams/77');
    expect(deleteRequest.request.params.get('actorUuid')).toBe(creatorUuid);
    deleteRequest.flush({});
  });

  it('keeps match and MVP endpoints aligned with backend routes', () => {
    const service = TestBed.inject(MatchesApiService);
    const playerUuid = '22222222-2222-2222-2222-222222222222';
    const creatorUuid = '11111111-1111-1111-1111-111111111111';
    const createPayload: CreateMatchRequest = {
      creadorUuid: creatorUuid,
      modalidad: 'CINCO_VS_CINCO',
      categoriaGenero: 'MIXTO',
      fechaHoraProgramada: '2026-05-07T20:00:00',
    };

    service.createMatch(createPayload).subscribe();
    expectRequest('POST', '/matches').flush({});

    service.getById(42).subscribe();
    expectRequest('GET', '/matches/42').flush({});

    service.getByPlayer(playerUuid).subscribe();
    expectRequest('GET', `/matches/by-player/${playerUuid}`).flush([]);

    service.getByPlayerOrCreator(playerUuid).subscribe();
    expectRequest('GET', `/matches/by-player-or-creator/${playerUuid}`).flush([]);

    service.joinMatch({
      matchId: 42,
      playerUuid,
      teamId: 7,
      positionId: 3,
      role: 'JUGADOR',
    }).subscribe();
    expectRequest('POST', '/matches/join').flush({});

    service.registerEvent({
      matchId: 42,
      playerUuid,
      teamId: 7,
      eventType: 'GOL',
    }).subscribe();
    expectRequest('POST', '/matches/events').flush({});

    service.addTeamToMatch({ matchId: 42, teamId: 7, esLocal: true }).subscribe();
    const addTeamRequest = expectRequest('POST', '/matches/42/teams/7');
    expect(addTeamRequest.request.params.get('esLocal')).toBe('true');
    addTeamRequest.flush({});

    service.confirmPlayer({ matchId: 42, playerUuid }).subscribe();
    expectRequest('PUT', `/matches/42/players/${playerUuid}/confirm`).flush({});

    service.removePlayer({ matchId: 42, playerUuid }).subscribe();
    expectRequest('DELETE', `/matches/42/players/${playerUuid}`).flush({});

    service.importTeamPlayers({ matchId: 42, teamId: 7 }).subscribe();
    expectRequest('POST', '/matches/42/teams/7/players/import').flush([]);

    service.confirmEvent({
      eventId: 99,
      confirmingPlayerUuid: playerUuid,
      isLocalTeam: true,
    }).subscribe();
    const confirmEventRequest = expectRequest('PUT', '/matches/events/99/confirm');
    expect(confirmEventRequest.request.params.get('confirmingPlayerUuid')).toBe(playerUuid);
    expect(confirmEventRequest.request.params.get('isLocalTeam')).toBe('true');
    confirmEventRequest.flush({});

    service.updateMatchStatus(42, 'FINALIZADO', creatorUuid).subscribe();
    const statusRequest = expectRequest('PUT', '/matches/42/status');
    expect(statusRequest.request.params.get('status')).toBe('FINALIZADO');
    expect(statusRequest.request.params.get('actorUuid')).toBe(creatorUuid);
    statusRequest.flush({});

    service.updateTeamAssignments(42, {
      actorUuid: creatorUuid,
      homePlayerUuids: [creatorUuid],
      awayPlayerUuids: [playerUuid],
    }).subscribe();
    expectRequest('PUT', '/matches/42/teams/assignment').flush({});

    service.getClosePreview(42, {
      finalScoreLocal: 2,
      finalScoreAway: 1,
      goalsByPlayer: { [creatorUuid]: 2 },
    }).subscribe();
    expectRequest('POST', '/matches/42/close/preview').flush({});

    service.getMatchMvp(42).subscribe();
    expectRequest('GET', '/matches/42/mvp').flush({
      matchId: 42,
      open: true,
      candidates: [],
      tally: [],
    });

    service.voteMatchMvp(42, playerUuid).subscribe();
    expectRequest('POST', '/matches/42/mvp/vote').flush({
      matchId: 42,
      open: true,
      candidates: [],
      tally: [],
    });
  });

  it('keeps ratings and leaderboard endpoints aligned with backend routes', () => {
    const service = TestBed.inject(RatingsApiService);
    const playerProfileId = '11111111-1111-1111-1111-111111111111';
    const updatePayload: UpdateRatingsRequest = {
      matchId: 42,
      performances: [
        {
          playerProfileId,
          roleType: 'ATAQUE',
          priorityLevel: 'PRINCIPAL',
          goalsScored: 2,
          assistsMade: 1,
          wasMvp: true,
          matchResult: 'GANADO',
        },
      ],
    };

    service.updateRatings(updatePayload).subscribe();
    expectRequest('POST', '/ratings/update').flush({});

    service.getOverall(playerProfileId).subscribe();
    expectRequest('GET', `/ratings/player/${playerProfileId}/overall`).flush({});

    service.getByRole(playerProfileId).subscribe();
    expectRequest('GET', `/ratings/player/${playerProfileId}`).flush([]);

    service.getHistory(playerProfileId).subscribe();
    expectRequest('GET', `/ratings/player/${playerProfileId}/history`).flush([]);

    service.initializeBaseRatings(playerProfileId).subscribe();
    expectRequest('POST', `/ratings/player/${playerProfileId}/initialize-base`).flush([]);

    service.getLeaderboardOverall().subscribe();
    expectRequest('GET', '/ratings/leaderboard').flush([]);

    service.getLeaderboardByRole('ATAQUE').subscribe();
    const leaderboardByRoleRequest = expectRequest('GET', '/ratings/leaderboard');
    expect(leaderboardByRoleRequest.request.params.get('roleType')).toBe('ATAQUE');
    leaderboardByRoleRequest.flush([]);
  });

  function expectRequest(method: string, path: string) {
    const request = http.expectOne((candidate) => {
      const requestUrl = candidate.urlWithParams.split('?')[0];
      return candidate.method === method && requestUrl === `${apiBaseUrl}${path}`;
    });
    expect(request.request.method).toBe(method);
    expect(request.request.url).toBe(`${apiBaseUrl}${path}`);
    return request;
  }
});
