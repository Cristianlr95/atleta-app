import { inject } from '@angular/core';
import { CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthSessionService } from '../services/auth-session.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const authSessionService = inject(AuthSessionService);

  return authSessionService.getValidSession()
    ? true
    : createLoginRedirect(inject(Router), state);
};

export function createLoginRedirect(
  router: Router,
  state?: Pick<RouterStateSnapshot, 'url'>,
): UrlTree {
  const next = state?.url?.trim();

  return router.createUrlTree(['/login'], {
    queryParams: next && next !== '/login' ? { next } : undefined,
  });
}
