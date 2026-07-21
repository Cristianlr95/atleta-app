import { HttpErrorResponse, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthSessionService } from '../services/auth-session.service';
import { HttpErrorService } from '../services/http-error.service';
import { NavigationService } from '../services/navigation.service';
import { SessionRefreshService } from '../services/session-refresh.service';
import { HttpErrorInterceptor } from './http-error.interceptor';

describe('HttpErrorInterceptor refresh', () => {
  it('rotates once on 401 and retries the protected request with the new access token', (done) => {
    const refresh = jasmine.createSpyObj<SessionRefreshService>('SessionRefreshService', ['refreshAccessToken']);
    refresh.refreshAccessToken.and.returnValue(of('access-2'));
    const handler = jasmine.createSpyObj<HttpHandler>('HttpHandler', ['handle']);
    handler.handle.and.returnValues(
      throwError(() => new HttpErrorResponse({ status: 401 })),
      of(new HttpResponse({ status: 200 })),
    );
    const router = jasmine.createSpyObj<Router>('Router', ['serializeUrl'], { url: '/matches' });

    TestBed.configureTestingModule({ providers: [
      HttpErrorInterceptor,
      { provide: SessionRefreshService, useValue: refresh },
      { provide: AuthSessionService, useValue: jasmine.createSpyObj('AuthSessionService', ['clearSession']) },
      { provide: HttpErrorService, useValue: jasmine.createSpyObj('HttpErrorService', ['map']) },
      { provide: NavigationService, useValue: jasmine.createSpyObj('NavigationService', ['safeNavigateByUrl']) },
      { provide: Router, useValue: router },
    ] });

    const interceptor = TestBed.inject(HttpErrorInterceptor);
    interceptor.intercept(new HttpRequest('GET', 'http://localhost:8080/api/v1/matches'), handler).subscribe({
      next: () => {
        const retried = handler.handle.calls.mostRecent().args[0] as HttpRequest<unknown>;
        expect(retried.headers.get('Authorization')).toBe('Bearer access-2');
        expect(refresh.refreshAccessToken).toHaveBeenCalledTimes(1);
        done();
      },
      error: done.fail,
    });
  });
});
