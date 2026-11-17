import { Page } from '@playwright/test';
import { installH0H3Fixture } from './h0-h3-fixture';

export async function installSquad(page: Page) {
  await installH0H3Fixture(page, 'data');
  await page.route('**/api/v1/teams/10', route => route.fulfill({ json: { id: 10, nombre: 'Atleta Prueba FC', anioFundacion: 2026 } }));
  await page.route('**/api/v1/teams/10/members/active', route => route.fulfill({ json: [
    { playerUuid: 'ath-h3', alias: 'Ana', rol: 'CAPITAN', primaryPositionName: 'Delantero' },
    { playerUuid: 'leo', alias: 'Leo', rol: 'JUGADOR', primaryPositionName: 'Mediocampo' },
    { playerUuid: 'new', alias: 'Camila', rol: 'JUGADOR', primaryPositionName: null },
  ] }));
  await page.route('**/api/v1/player-profiles/*/public', route => route.fulfill({ json: { alias: 'Ana', nombre: 'Ana Torres', pictureUrl: null } }));
  await page.route('**/api/v1/ratings/player/leo/overall', route => route.fulfill({ json: { hybridOVR: 0, roleBreakdown: { MEDIOCAMPO: 0, DEFENSA: 45 } } }));
  await page.route('**/api/v1/ratings/player/new/overall', route => route.fulfill({ status: 404, json: {} }));
}
