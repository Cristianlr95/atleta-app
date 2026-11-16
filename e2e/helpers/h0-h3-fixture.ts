import { Page } from '@playwright/test';

export type ProfileScenario = 'data' | 'empty' | 'error' | 'loading';

export async function installH0H3Fixture(page: Page, initial: ProfileScenario) {
  let scenario = initial;
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const requests: Array<{ path: string; status: number }> = [];
  await page.addInitScript(() => {
    const session = {
      user: { atletaUuid: 'ath-h3', email: 'h3@atleta.test', nombre: 'Ana Torres' },
      tokens: { accessToken: 'h0-h3-local-fixture' },
    };
    localStorage.setItem('atleta.dev.access-token', session.tokens.accessToken);
    localStorage.setItem('atleta.dev.auth-session', JSON.stringify(session));
  });
  await page.route('**/assets/app-config.json', route => route.fulfill({ json: {
    apiBaseUrl: 'http://127.0.0.1:8080/api/v1', storagePrefix: 'atleta.dev', environmentName: 'test', uploadsEnabled: false,
  } }));
  await page.route('**/api/v1/**', async route => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const stats = path.includes('/ratings/') || /\/matches\/by-player/.test(path);
    if (scenario === 'loading' && stats) await pending;
    let status = 200;
    let body: unknown = [];
    const empty = scenario === 'empty';
    if (path.endsWith('/athletes/ath-h3')) {
      body = { atletaUuid: 'ath-h3', nombre: 'Ana Torres', email: 'h3@atleta.test', genero: 'FEMENINO' };
    } else if (path.endsWith('/player-profiles/ath-h3')) {
      body = { atletaUuid: 'ath-h3', alias: empty ? 'Jugadora nueva' : 'Ana', nombre: 'Ana Torres', genero: 'FEMENINO', trustScore: 100 };
    } else if (path.endsWith('/player-profiles/ath-h3/positions')) {
      body = ['Delantero', 'Mediocampo', 'Defensa'].map((nombre, i) => ({
        id: i + 1, prioridad: i + 1, xp: empty ? 0 : 120, position: { id: i + 1, nombre },
      }));
    } else if (path.endsWith('/player-profiles/ath-h3/achievements')) {
      body = empty ? [] : [{ code: 'MATCH_VETERAN', title: 'Partidos jugados', description: 'Compite en partidos finalizados.',
        metricLabel: 'partidos', currentValue: 1, nextThreshold: 5, progressPercent: 20, tier: null, unlocked: false }];
    } else if (path.endsWith('/teams/by-player/ath-h3')) {
      body = empty ? [] : [{ id: 10, nombre: 'Atleta Prueba FC', anioFundacion: 2026 }];
    } else if (path.endsWith('/teams/10/members/active')) {
      body = [{ playerUuid: 'ath-h3', alias: 'Ana', rol: 'JUGADOR', primaryPositionName: 'Delantero' }];
    } else if (path.endsWith('/teams/10/leaderboard')) {
      body = [{ rank: 1, playerProfileId: 'ath-h3', alias: 'Ana', score: 68.1, matchesPlayed: 1, rated: true }];
    } else if (path.endsWith('/teams/10/external-record')) {
      body = { teamId: 10, matchesPlayed: 1, wins: 1, draws: 0, losses: 0, points: 3 };
    } else if (path.endsWith('/ratings/player/ath-h3/overall')) {
      status = empty ? 404 : 200;
      body = empty ? {} : { playerProfileId: 'ath-h3', alias: 'Ana', hybridOVR: 68.1, weightedOVR: 68.1, simpleOVR: 39.5,
        classification: 'Avanzado', versatilityIndex: 0.5, consistencyScore: 0.7, bestRole: 'ATAQUE', bestRoleRating: 79,
        totalRatings: 2, totalMatchesPlayed: 1, roleBreakdown: { ATAQUE: 79, MEDIOCAMPO: 0 } };
    } else if (path.endsWith('/ratings/player/ath-h3')) {
      body = empty ? [] : ['ATAQUE', 'MEDIOCAMPO'].map((roleType, i) => ({
        id: i + 1, playerProfileId: 'ath-h3', alias: 'Ana', roleType, priorityLevel: 'PRINCIPAL', currentRating: i ? 0 : 79, matchesPlayed: 1,
      }));
    } else if (path.endsWith('/ratings/player/ath-h3/history')) {
      body = empty ? [] : [{ id: 1, playerProfileId: 'ath-h3', roleType: 'ATAQUE', priorityLevel: 'PRINCIPAL', matchId: 64,
        newRating: 79, goalsScored: 1, assistsMade: 0, wasMvp: true, matchResult: 'GANADO', createdAt: '2026-11-15T20:00:00Z' }];
    } else if (path.includes('/ratings/leaderboard')) {
      body = empty ? [] : [{ playerProfileId: 'ath-h3', alias: 'Ana', score: 68.1, matchesPlayed: 1, roleType: 'ATAQUE' }];
    } else if (/\/matches\/by-player(?:-or-creator)?\/ath-h3$/.test(path)) {
      body = empty ? [] : [fixtureMatch(64, true), fixtureMatch(65, false)];
    }
    if (scenario === 'error' && stats) { status = 500; body = {}; }
    requests.push({ path, status });
    await route.fulfill({ status, json: body });
  });
  return { requests, setScenario: (value: ProfileScenario) => { scenario = value; }, release: () => { scenario = 'data'; release(); } };
}

function fixtureMatch(id: number, finished: boolean) {
  return { id, modalidad: 'CINCO_VS_CINCO', matchType: 'INTERNAL', estado: finished ? 'FINALIZADO' : 'CREADO',
    fechaHoraProgramada: finished ? '2026-11-15T19:00:00Z' : new Date(Date.now() + 86_400_000).toISOString(),
    resultado: finished ? 'GANADO' : undefined, finalScoreLocal: finished ? 2 : undefined, finalScoreAway: finished ? 1 : undefined,
    matchTeams: [{ id: 1, esLocal: true, goles: 2, team: { id: 10, nombre: 'Atleta Prueba FC' } },
      { id: 2, esLocal: false, goles: 1, team: { id: 11, nombre: 'Rival FC' } }],
    players: [{ id: 1, confirmado: true, teamSide: 'LOCAL', player: { atletaUuid: 'ath-h3', alias: 'Ana', genero: 'FEMENINO' },
      team: { id: 10, nombre: 'Atleta Prueba FC' }, position: { id: 1, nombre: 'Delantero' } }], events: [] };
}
