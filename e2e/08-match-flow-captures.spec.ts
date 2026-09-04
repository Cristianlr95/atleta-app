import { expect, Page, Route, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const captureDirectory = join(process.cwd(), 'docs', 'flow-captures');

test.describe('Flujo visual integral de partidos', () => {
  test.beforeAll(() => mkdirSync(captureDirectory, { recursive: true }));

  test('documenta configurar, convocar y confirmar en movil', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await installFlowFixture(page);
    await page.goto('/matches/create');

    await expect(page.getByText('Paso 1 de 3 · Configurar')).toBeVisible();
    await page.getByRole('button', { name: 'Enfrentamiento Interno' }).click();
    await selectFutureSchedule(page);
    await selectVenue(page);
    await capture(page, '01-configurar-partido-mobile.png');

    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByText('Paso 2 de 3 · Convocar')).toBeVisible();
    await page.getByRole('button', { name: 'Seleccionar todos' }).click();
    await expect(page.getByText('11/10 convocados. Partido viable si todos confirman.')).toBeVisible();
    await capture(page, '02-convocar-sobrecupo-mobile.png');

    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByText('Paso 3 de 3 · Confirmar')).toBeVisible();
    await expect(page.getByText('Invitados: 10')).toBeVisible();
    await capture(page, '03-confirmar-convocatoria-mobile.png');
  });

  test('documenta partido confirmado y cierre conservando navegacion', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const fixture = await installFlowFixture(page);
    await page.goto('/matches/64');

    await expect(page.getByText('Estado del partido')).toBeVisible();
    await expect(page.getByText(/Confirmados 10/)).toBeVisible();
    await page.waitForTimeout(400);
    await expect(page.locator('ion-toast.atleta-notification-toast')).toBeHidden();
    await expect(page.locator('app-metallic-bottom-nav')).toBeVisible();
    await capture(page, '04-partido-confirmado-mobile.png');

    fixture.setStatus('INICIADO');
    await page.goto('/matches/64/close');
    await expect(page.getByText('Ajustes rapidos')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Atleta Dev FC' })).toBeVisible();
    await expect(page.locator('app-metallic-bottom-nav')).toBeVisible();
    await capture(page, '05-cierre-partido-mobile.png');
  });

  test('documenta votacion MVP responsive en escritorio', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const fixture = await installFlowFixture(page);
    fixture.setStatus('FINALIZADO');
    await page.goto('/matches/64/mvp-vote');

    await expect(page.getByRole('heading', { name: 'Jugador del Partido' })).toBeVisible();
    await expect(page.getByText('Votos registrados: 3/10')).toBeVisible();
    await expect(page.locator('ion-router-outlet > .ion-page:not(.ion-page-hidden)')).toHaveCount(1);
    await expect(page.locator('app-metallic-bottom-nav')).toBeVisible();
    await capture(page, '06-votacion-mvp-desktop.png');
  });
});

async function installFlowFixture(page: Page): Promise<{ setStatus: (status: string) => void }> {
  let matchStatus = 'CREADO';
  await page.addInitScript(() => {
    const session = {
      user: { atletaUuid: 'ath-flow', email: 'flow@atleta.local', nombre: 'CapitanDev' },
      tokens: { accessToken: 'flow-test-token' },
    };
    localStorage.setItem('atleta.dev.access-token', 'flow-test-token');
    localStorage.setItem('atleta.dev.auth-session', JSON.stringify(session));
  });

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path.endsWith('/athletes/ath-flow')) {
      await json(route, {
        atletaUuid: 'ath-flow',
        email: 'flow@atleta.local',
        nombre: 'CapitanDev',
        genero: 'MASCULINO',
        createdAt: '2026-01-01T00:00:00Z',
      });
      return;
    }
    if (path.endsWith('/player-profiles/ath-flow')) {
      await json(route, playerProfile());
      return;
    }
    if (path.endsWith('/player-profiles/ath-flow/positions')) {
      await json(route, playerProfile().positions);
      return;
    }
    if (path.endsWith('/teams/by-player/ath-flow')) {
      await json(route, [{ id: 10, nombre: 'Atleta Dev FC', anioFundacion: 2026 }]);
      return;
    }
    if (path.endsWith('/teams/10/members/active')) {
      await json(route, activeMembers());
      return;
    }
    if (path.endsWith('/fields')) {
      await json(route, [{ id: 1, nombre: 'Cancha Central', direccion: 'Av. Deportiva 100', ciudad: 'Concepcion', latitud: -36.827, longitud: -73.05, activo: true }]);
      return;
    }
    if (path.endsWith('/social/match-invites/by-match/64')) {
      await json(route, acceptedInvites());
      return;
    }
    if (path.endsWith('/social/match-invites/ath-flow')) {
      await json(route, []);
      return;
    }
    if (path.endsWith('/matches/64/mvp')) {
      await json(route, mvpState());
      return;
    }
    if (path.endsWith('/matches/64/close/preview')) {
      await json(route, closePreview());
      return;
    }
    if (path.endsWith('/matches/64')) {
      await json(route, matchResponse(matchStatus));
      return;
    }
    if (path.includes('/ratings/') || path.includes('/positions')) {
      await json(route, []);
      return;
    }

    await json(route, request.method() === 'GET' ? [] : {});
  });

  return { setStatus: (status: string) => { matchStatus = status; } };
}

async function selectFutureSchedule(page: Page): Promise<void> {
  const future = new Date(Date.now() + 90 * 60 * 1000).toISOString().slice(0, 19);
  await page.locator('ion-datetime').evaluate((element, value) => {
    (element as { value: string }).value = value;
    element.dispatchEvent(new CustomEvent('ionChange', { detail: { value }, bubbles: true }));
  }, future);
}

async function selectVenue(page: Page): Promise<void> {
  await page.locator('input[placeholder="Nombre o direccion"]').click();
  const venue = page.locator('.venue-result').first();
  await expect(venue).toBeVisible();
  await venue.click();
}

async function capture(page: Page, filename: string): Promise<void> {
  const content = page.locator('ion-content').last();
  if (await content.count()) {
    await content.evaluate(async (element) => {
      await (element as HTMLElement & { scrollToTop: (duration?: number) => Promise<void> }).scrollToTop(0);
    });
  }
  await page.locator('ion-toast.atleta-notification-toast').waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => undefined);
  await page.screenshot({ path: join(captureDirectory, filename), fullPage: true });
}

async function json(route: Route, body: unknown): Promise<void> {
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
}

function playerProfile(): Record<string, unknown> {
  return {
    atletaUuid: 'ath-flow', alias: 'CapitanDev', nombre: 'Capitan Dev', genero: 'MASCULINO', trustScore: 100,
    positions: [
      { id: 1, prioridad: 1, xp: 120, position: { id: 1, nombre: 'Delantero' } },
      { id: 2, prioridad: 2, xp: 90, position: { id: 2, nombre: 'Mediocampo' } },
      { id: 3, prioridad: 3, xp: 60, position: { id: 3, nombre: 'Defensa' } },
    ],
  };
}

function activeMembers(): Array<Record<string, unknown>> {
  return Array.from({ length: 10 }, (_, index) => ({
    playerUuid: index === 0 ? 'ath-flow' : `ath-${index + 1}`,
    alias: index === 0 ? 'CapitanDev' : `Jugador${index + 1}`,
    rol: index === 0 ? 'CAPITAN' : 'JUGADOR',
    primaryPositionId: (index % 3) + 1,
    primaryPositionName: ['Delantero', 'Mediocampo', 'Defensa'][index % 3],
    ovr: 82 - index,
  }));
}

function matchResponse(status: string): Record<string, unknown> {
  const members = activeMembers();
  return {
    id: 64,
    modalidad: 'CINCO_VS_CINCO',
    matchType: 'INTERNAL',
    categoriaGenero: 'MIXED',
    estado: status,
    fechaHoraProgramada: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    startedAt: status === 'CREADO' ? null : new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    finalizedAt: status === 'FINALIZADO' ? new Date().toISOString() : null,
    latitud: -36.827,
    longitud: -73.05,
    creador: { atletaUuid: 'ath-flow', alias: 'CapitanDev', genero: 'MASCULINO' },
    matchTeams: [
      { id: 1, esLocal: true, goles: 0, team: { id: 10, nombre: 'Atleta Dev FC' } },
      { id: 2, esLocal: false, goles: 0, team: { id: 11, nombre: 'Atleta Rival' } },
    ],
    players: members.map((member, index) => ({
      id: index + 1,
      rol: member['rol'],
      confirmado: true,
      teamSide: index < 5 ? 'LOCAL' : 'VISITA',
      player: { atletaUuid: member['playerUuid'], alias: member['alias'], genero: index % 2 ? 'FEMENINO' : 'MASCULINO' },
      team: { id: index < 5 ? 10 : 11, nombre: index < 5 ? 'Atleta Dev FC' : 'Atleta Rival' },
      position: { id: member['primaryPositionId'], nombre: member['primaryPositionName'] },
    })),
    events: [],
    closePending: status === 'INICIADO',
  };
}

function acceptedInvites(): Array<Record<string, unknown>> {
  return activeMembers().slice(1).map((member, index) => ({
    id: index + 1,
    matchId: 64,
    targetUuid: member['playerUuid'],
    targetAlias: member['alias'],
    status: 'ACEPTADA',
    createdAt: new Date().toISOString(),
    respondedAt: new Date().toISOString(),
  }));
}

function closePreview(): Record<string, unknown> {
  return {
    matchId: 64,
    finalScoreLocal: 0,
    finalScoreAway: 0,
    players: activeMembers().map((member, index) => ({
      playerUuid: member['playerUuid'], alias: member['alias'], position: member['primaryPositionName'],
      teamSide: index < 5 ? 'LOCAL' : 'VISITA', goals: 0, estimatedXp: 20, currentHybridOvr: member['ovr'],
    })),
  };
}

function mvpState(): Record<string, unknown> {
  const candidates = activeMembers().map((member) => ({ userId: member['playerUuid'], alias: member['alias'] }));
  return {
    matchId: 64,
    finalizedAt: new Date().toISOString(),
    closesAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    open: true,
    myVote: 'ath-2',
    winnerUserId: null,
    winnerAlias: null,
    candidates,
    tally: candidates.map((candidate, index) => ({ ...candidate, votes: index < 3 ? 1 : 0 })),
  };
}
