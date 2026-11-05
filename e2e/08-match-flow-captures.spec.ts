import { expect, Page, Route, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const captureDirectory = join(process.cwd(), 'docs', 'flow-captures');

test.describe('Flujo visual integral de partidos', () => {
  test.beforeAll(() => mkdirSync(captureDirectory, { recursive: true }));

  test('muestra Inicio sin desbordamiento en movil y escritorio', async ({ page }) => {
    await installFlowFixture(page);
    for (const viewport of [{ width: 320, height: 760 }, { width: 390, height: 844 }, { width: 1366, height: 768 }]) {
      await page.setViewportSize(viewport);
      await page.goto('/home');
      await expect(page.getByRole('button', { name: 'Ver historial' })).toBeVisible();
      await expect(page.getByText('Nivel de posición 2')).toBeVisible();
      await expect(page.locator('.home-metric').nth(2)).toContainText('120');
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: /Mi equipo/i })).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: 'Ver partidos' })).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: 'Ver historial' })).toBeFocused();
      const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
      expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
      await capture(page, `08-inicio-${viewport.width}.png`);
    }
  });
  test('Inicio permite recuperar la actividad cuando falla el historial', async ({ page }) => {
    await installFlowFixture(page);
    const pattern = '**/api/v1/matches/by-player*/ath-flow';
    await page.route(pattern, route => route.fulfill({ status: 500, json: {} }));
    await page.goto('/home');
    await expect(page.getByRole('alert')).toContainText('No se pudo cargar la actividad reciente');
    await expect(page.getByText('Sin partido agendado')).toHaveCount(0);
    await page.unroute(pattern);
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await expect(page.getByText('Sin partido agendado')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
  test('Inicio ofrece crear equipo cuando no hay equipo asociado', async ({ page }) => {
    await installFlowFixture(page);
    await page.route('**/api/v1/teams/by-player/ath-flow', route => json(route, []));
    await page.goto('/home');
    await page.getByRole('button', { name: /Sin equipo.*Crear equipo/ }).click();
    await expect(page).toHaveURL(/\/sessions\/create$/);
    await expect(page.getByRole('button', { name: 'Crear equipo', exact: true })).toBeVisible();
  });
  test('Inicio permite recuperar el equipo si su carga falla', async ({ page }) => {
    await installFlowFixture(page);
    const pattern = '**/api/v1/teams/by-player/ath-flow';
    await page.route(pattern, route => route.fulfill({ status: 500, json: {} }));
    await page.goto('/home');
    const team = page.getByRole('button', { name: /Equipo no disponible.*Reintentar/ });
    await expect(team).toBeVisible();
    await page.unroute(pattern);
    await team.click();
    await expect(page.getByRole('button', { name: /Mi equipo.*Atleta Dev FC/ })).toBeVisible();
  });

  test('Inicio permite recuperar las invitaciones si su carga falla', async ({ page }) => {
    await installFlowFixture(page);
    const pattern = '**/api/v1/social/match-invites/ath-flow';
    await page.route(pattern, route => route.fulfill({ status: 500, json: {} }));
    await page.goto('/home');
    const alert = page.getByRole('alert').filter({ hasText: 'No se pudieron cargar las invitaciones' });
    await expect(alert).toBeVisible();
    await expect(page.locator('.home-metric').nth(1)).toContainText('--');
    await page.unroute(pattern);
    await alert.getByRole('button', { name: 'Reintentar' }).click();
    await expect(alert).toHaveCount(0);
    await expect(page.locator('.home-metric').nth(1)).toContainText('0');
  });

  test('Inicio muestra XP real de la posición principal en móvil', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 760 });
    await installFlowFixture(page);
    await page.goto('/home');
    await expect(page.locator('.home-metric').nth(2)).toContainText('XP posición principal');
    await expect(page.locator('.home-metric').nth(2)).toContainText('120');
    await expect(page.getByText('Nivel de posición 2')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });

  test('Inicio no inventa XP cuando falla la carga del perfil', async ({ page }) => {
    await installFlowFixture(page);
    let profileCalls = 0;
    await page.route('**/api/v1/player-profiles/ath-flow', route => ++profileCalls === 1 ? json(route, playerProfile()) : route.fulfill({ status: 500, json: {} }));
    await page.goto('/home');
    await expect(page.locator('.home-metric').nth(2)).toContainText('--');
    await expect(page.getByText('XP y nivel no disponibles.')).toBeVisible();
  });

  test('Inicio muestra OVR y partido finalizado sin estados contradictorios', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await installFlowFixture(page);
    await page.route('**/api/v1/ratings/player/ath-flow/overall', route => json(route, { hybridOVR: 63.4 }));
    await page.route('**/api/v1/matches/by-player-or-creator/ath-flow', route => json(route, [matchResponse('FINALIZADO')]));
    await page.goto('/home');
    await expect(page.locator('.home-metric').first()).toContainText('63');
    await expect(page.locator('.home-priority')).toContainText('Finalizado');
    await expect(page.locator('.home-priority')).not.toContainText('Próximo');
    await capture(page, '08-inicio-con-datos-390.png');
  });
  test('historial móvil muestra todos los campos y abre el detalle', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 760 });
    await installFlowFixture(page);
    await page.route('**/api/v1/matches/by-player-or-creator/ath-flow', route => json(route, [matchResponse('FINALIZADO')]));
    await page.goto('/matches/history');
    const row = page.locator('.match-history__table tbody tr').first();
    await expect(row).toBeVisible();
    await expect(row.locator('td')).toHaveCount(13);
    for (const cell of await row.locator('td').all()) await expect(cell).toBeVisible();
    const tableDimensions = await page.locator('.match-history').evaluate(el => ({ width: el.clientWidth, scroll: el.scrollWidth }));
    expect(tableDimensions.scroll).toBeLessThanOrEqual(tableDimensions.width);
    await row.screenshot({ path: 'docs/flow-captures/historial-card-320.png' });
    await row.getByRole('button', { name: 'Ver estado' }).click();
    await expect(page).toHaveURL(/\/matches\/64$/);
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/matches/history');
    await expect(page.getByRole('columnheader', { name: 'Equipo' })).toBeVisible();
    await expect(page.locator('.match-history__table tbody tr').first()).toBeVisible();
  });
  test('muestra error y reintento cuando falla la carga de partidos', async ({ page }) => {
    await installFlowFixture(page);
    await page.route('**/api/v1/matches/by-player*/ath-flow', route => route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }));
    await page.goto('/matches/history');
    await expect(page.getByText('No se pudo cargar la agenda e historial de partidos.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reintentar carga' })).toBeVisible();
    await expect(page.getByText('Aun no tienes registros de competicion.')).toHaveCount(0);
  });
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
    await expect(page.locator('p').filter({ hasText: /^Fecha:/ })).toContainText(/\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}/);
    await capture(page, '03-confirmar-convocatoria-mobile.png');
  });

  test('permite reintentar la carga de canchas guardadas', async ({ page }) => {
    await installFlowFixture(page);
    const pattern = '**/api/v1/fields?*';
    await page.route(pattern, route => route.fulfill({ status: 500, json: {} }));
    await page.goto('/matches/venues/new');
    await expect(page.getByRole('alert').filter({ hasText: 'No se pudieron cargar las canchas guardadas' })).toBeVisible();
    await page.unroute(pattern);
    await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'No se pudieron cargar las canchas guardadas' })).toHaveCount(0);
    await expect(page.getByLabel('Canchas guardadas').getByRole('option', { name: /Cancha Central/ })).toHaveCount(1);
  });

  test('permite seleccionar coordenadas de cancha con teclado', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 760 });
    await installFlowFixture(page);
    await page.goto('/matches/venues/new');
    await page.getByLabel('Latitud', { exact: true }).fill('-36.82');
    await page.getByLabel('Longitud', { exact: true }).fill('-73.05');
    const button = page.getByRole('button', { name: 'Usar coordenadas' });
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Coordenadas seleccionadas: -36.82 / -73.05')).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: 'Coordenadas seleccionadas.' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });

  test('la búsqueda de canchas se abre al recibir foco por teclado', async ({ page }) => {
    await installFlowFixture(page);
    await page.goto('/matches/create');
    await page.getByRole('button', { name: 'Enfrentamiento Interno' }).click();
    const search = page.getByLabel('Buscar cancha');
    await search.focus();
    await expect(page.getByRole('button', { name: /Cancha Central/ })).toBeVisible();
  });
  test('creación de partido conserva validación y navegación en escritorio', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await installFlowFixture(page);
    await page.goto('/matches/create');
    await expect(page.getByRole('button', { name: 'Continuar' })).toBeDisabled();
    await page.getByRole('button', { name: 'Enfrentamiento Interno' }).click();
    await selectFutureSchedule(page);
    await selectVenue(page);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Seleccionar todos' }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByText('Paso 3 de 3 · Confirmar')).toBeVisible();
    expect((await page.locator('app-matches-create-page app-metallic-card').boundingBox())!.width).toBeGreaterThanOrEqual(600);
    await expect(page.locator('p').filter({ hasText: /^Fecha:/ })).toContainText(/\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}/);
    await expect(page.getByRole('button', { name: 'Enviar invitaciones' })).toBeVisible();
    await capture(page, '10-confirmacion-desktop.png');
  });
  test('documenta partido confirmado y cierre conservando navegacion', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const fixture = await installFlowFixture(page);
    await page.goto('/matches/64');

    await page.goto('/matches/history');
    const historyTab = page.getByRole('tab', { name: 'Historial' });
    const upcomingTab = page.getByRole('tab', { name: 'Próximos' });
    await expect(historyTab).toHaveAttribute('aria-selected', 'true');
    await historyTab.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(upcomingTab).toBeFocused();
    await expect(upcomingTab).toHaveAttribute('aria-selected', 'true');
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
    const goalButton = page.locator('.players-table').getByRole('button', { name: /Sumar gol a/ }).first();
    const scoreButton = page.locator('.score-editor').getByRole('button', { name: /Sumar gol a/ }).first();
    const scoreButtonBox = await scoreButton.boundingBox();
    expect(scoreButtonBox!.width).toBeGreaterThanOrEqual(44);
    expect(scoreButtonBox!.height).toBeGreaterThanOrEqual(44);
    const goalButtonBox = await goalButton.boundingBox();
    expect(goalButtonBox!.width).toBeGreaterThanOrEqual(44);
    expect(goalButtonBox!.height).toBeGreaterThanOrEqual(44);
    await capture(page, '05-cierre-partido-mobile.png');
    await page.getByRole('button', { name: 'Ir al resumen' }).click();
    await page.getByRole('button', { name: 'Ver recompensas' }).click();
    await expect(page.getByRole('heading', { name: 'XP estimada' })).toBeVisible();
    await expect(page.locator('app-xp-reward-card .xp-item').first()).toContainText('XP estimados');
    await expect(page.locator('app-xp-reward-card .xp-level-up, app-xp-reward-card .xp-bar')).toHaveCount(0);
    await capture(page, '07-recompensas-mobile.png');
  });

  test('ajustes anuncia errores de validación sin enviar datos', async ({ page }) => {
    await installFlowFixture(page);
    await page.goto('/player/settings');
    await page.getByRole('button', { name: 'Actualizar contrasena' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'al menos 8 caracteres' })).toBeVisible();
    await page.getByRole('button', { name: 'Eliminar mi cuenta' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Escribe ELIMINAR' })).toBeVisible();
  });

  test('perfil sin datos reales no muestra estadísticas ni trofeos de ejemplo', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await installFlowFixture(page);
    await page.goto('/player/profile');
    await expect(page.getByText('No hay estadísticas por posición disponibles.')).toBeVisible();
    await expect(page.getByText('No hay trofeos disponibles.')).toBeVisible();
    await expect(page.locator('.achievement-card')).toHaveCount(0);
    await expect(page.locator('app-metallic-role-hexagon')).toHaveCount(0);
  });

  test('perfil permite abrir integrantes de equipo en móvil', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await installFlowFixture(page);
    await page.goto('/player/profile');
    const team = page.getByRole('button', { name: 'Ver integrantes de Atleta Dev FC' });
    await expect(team).toHaveAttribute('aria-expanded', 'false');
    await team.click();
    await expect(page.getByRole('button', { name: 'Ocultar integrantes de Atleta Dev FC' })).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('Participantes y nivel del equipo')).toBeVisible();
  });
  test('perfil indica cuando no puede cargar el historial', async ({ page }) => {
    await installFlowFixture(page);
    await page.route('**/api/v1/matches/by-player*/ath-flow', route => route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }));
    await page.goto('/player/profile');
    await expect(page.getByText('No se pudieron cargar las estadísticas de competición.')).toBeVisible();
    await expect(page.locator('.competition-metrics')).toHaveCount(0);
  });
  test('social distingue acciones y áreas táctiles con invitaciones en móvil', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 760 });
    await installFlowFixture(page);
    const request = { id: 1, status: 'PENDIENTE', requesterUuid: 'a', requesterAlias: 'Ana', targetUuid: 'ath-flow', targetAlias: 'CapitanDev', teamId: 7, teamName: 'Azules', matchId: 42 };
    await page.route('**/api/v1/social/friendships/ath-flow', route => json(route, [{ ...request, type: 'FRIENDSHIP' }]));
    await page.route('**/api/v1/social/team-invites/ath-flow', route => json(route, [{ ...request, type: 'TEAM_INVITE' }]));
    await page.route('**/api/v1/social/match-invites/ath-flow', route => json(route, [{ ...request, type: 'MATCH_INVITE' }]));
    await page.goto('/social');
    for (const [tab, name] of [['Amigos', 'Aceptar solicitud de Ana'], ['Equipos', 'Aceptar invitación a Azules'], ['Partidos', 'Aceptar invitación al partido 42 de Ana']]) {
      await page.getByRole('group', { name: 'Secciones sociales' }).getByRole('button', { name: tab }).click();
      const action = page.getByRole('button', { name, exact: true });
      await expect(action).toBeVisible();
      expect((await action.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    }
  });

  test('social informa de fallos y permite reintentar sin mostrar listas vacías falsas', async ({ page }) => {
    await installFlowFixture(page);
    const pattern = '**/api/v1/social/friendships/ath-flow';
    await page.route(pattern, route => route.fulfill({ status: 500, json: {} }));
    await page.goto('/social');
    await expect(page.getByRole('alert').filter({ hasText: 'No se pudo cargar la actividad social.' })).toBeVisible();
    await expect(page.getByText('No hay actividad por ahora.')).toHaveCount(0);
    await page.unroute(pattern);
    await page.getByRole('button', { name: 'Reintentar carga social' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'No se pudo cargar la actividad social.' })).toHaveCount(0);
    await expect(page.getByText('No hay actividad por ahora.')).toBeVisible();
  });

  test('social permite recorrer secciones en móvil sin desbordamiento', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 760 });
    await installFlowFixture(page);
    await page.goto('/social');
    const sections = page.getByRole('group', { name: 'Secciones sociales' });
    for (const name of ['Actividad', 'Amigos', 'Equipos', 'Partidos']) {
      const button = sections.getByRole('button', { name });
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    }
  });
  test('ranking permite filtrar posiciones en móvil y escritorio', async ({ page }) => {
    await installFlowFixture(page);
    for (const width of [320, 1366]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/leaderboard');
      await page.getByLabel('Clasificar por').selectOption('ROLE');
      const group = page.getByRole('group', { name: 'Filtro de posiciones' });
      const buttons = group.getByRole('button');
      await expect(buttons.first()).toBeVisible();
      await buttons.first().click();
      await expect(buttons.first()).toHaveAttribute('aria-pressed', 'true');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      await capture(page, `09-ranking-${width}.png`);
    }
  });
  test('detalle conserva navegación en estados creado, en juego y finalizado', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const fixture = await installFlowFixture(page);
    for (const status of ['CREADO', 'INICIADO', 'FINALIZADO']) {
      fixture.setStatus(status);
      await page.goto('/matches/64');
      await expect(page.getByText('Estado del partido')).toBeVisible();
      await expect(page.locator('app-metallic-bottom-nav')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    }
  });
  test('votación cerrada no invita a votar y mantiene candidatos deshabilitados', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const fixture = await installFlowFixture(page);
    fixture.setStatus('FINALIZADO');
    await page.route('**/api/v1/matches/64/mvp', route => json(route, { ...mvpState(), open: false, winnerAlias: 'Jugador2' }));
    await page.goto('/matches/64/mvp-vote');
    await expect(page.getByText('Toca un jugador para votar.')).toHaveCount(0);
    await expect(page.getByText('La votación está cerrada.')).toBeVisible();
    const voteButtons = page.locator('app-player-vote-card button');
    expect(await voteButtons.count()).toBeGreaterThan(0);
    for (const button of await voteButtons.all()) await expect(button).toBeDisabled();
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
      await json(route, [...activeMembers(), { playerUuid: 'ath-11', alias: 'Jugador11', rol: 'JUGADOR', primaryPositionId: 1, primaryPositionName: 'Delantero', ovr: 72 }]);
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
    startedAt: status === 'CREADO' ? null : new Date(Date.now() - 90 * 60 * 1000).toISOString(),
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
