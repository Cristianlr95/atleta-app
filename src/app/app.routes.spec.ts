import { routes } from './app.routes';

describe('app routes', () => {
  it('exposes social as a guarded page instead of redirecting to matches', () => {
    const route = routes.find((item) => item.path === 'social');

    expect(route).toBeDefined();
    expect(route?.redirectTo).toBeUndefined();
    expect(route?.loadComponent).toBeDefined();
    expect(route?.canActivate?.length).toBeGreaterThan(0);
  });

  it('opens legacy invitations in the social matches tab', () => {
    const route = routes.find((item) => item.path === 'invitations');

    expect(route).toBeDefined();
    expect(route?.redirectTo).toBeUndefined();
    expect(route?.loadComponent).toBeDefined();
    expect(route?.data?.['defaultSocialTab']).toBe('matches');
  });
});
