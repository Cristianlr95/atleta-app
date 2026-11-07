import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { APP_CONFIG } from 'src/app/core/config/app-config.token';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { MatchStore } from '../stores/match.store';
import { MatchService } from './match.service';
import { MatchLiveService } from './match-live.service';

describe('MatchLiveService', () => {
  let service: MatchLiveService;
  let fetchSpy: jasmine.Spy;
  let capturedInit: RequestInit | undefined;
  let authSession: { currentSession: unknown };

  beforeEach(() => {
    capturedInit = undefined;
    authSession = {
      currentSession: {
        user: { atletaUuid: 'player-uuid' },
        tokens: { accessToken: 'secret-bearer-token' },
      },
    };
    fetchSpy = spyOn(window, 'fetch').and.callFake((_input, init) => {
      capturedInit = init;
      return Promise.resolve(new Response(new ReadableStream<Uint8Array>({ start() {} }), { status: 200 }));
    });
    TestBed.configureTestingModule({ providers: [
      MatchLiveService,
      { provide: APP_CONFIG, useValue: { apiBaseUrl: 'http://localhost:8080/api/v1' } },
      { provide: AuthSessionService, useValue: authSession },
      { provide: MatchService, useValue: { getMatchById: () => ({ backendMatchId: 42, status: 'CONFIRMED' }) } },
      { provide: MatchStore, useValue: { refreshByBackendMatchId: jasmine.createSpy(), applyLiveEvent: jasmine.createSpy() } },
    ] });
    service = TestBed.inject(MatchLiveService);
  });

  afterEach(() => service.ngOnDestroy());

  it('opens SSE with a bearer header and never places the token in the URL', fakeAsync(() => {
    service.watchMatch('local-42');
    flushMicrotasks();

    expect(fetchSpy).toHaveBeenCalled();
    const url = String(fetchSpy.calls.mostRecent().args[0]);
    expect(url).toBe('http://localhost:8080/api/v1/matches/42/live');
    expect(url).not.toContain('secret-bearer-token');
    expect((capturedInit?.headers as Record<string, string>)['Authorization'])
      .toBe('Bearer secret-bearer-token');
    expect(service.liveState()['local-42'].source).toBe('sse');
    service.stopWatching('local-42');
  }));

  it('aborts the authenticated stream when leaving the match', fakeAsync(() => {
    service.watchMatch('local-42');
    flushMicrotasks();
    const signal = capturedInit?.signal as AbortSignal;

    service.stopWatching('local-42');

    expect(signal.aborted).toBeTrue();
  }));

  it('does not attempt SSE without an access token', fakeAsync(() => {
    authSession.currentSession = null;
    service.watchMatch('local-42');
    flushMicrotasks();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(service.liveState()['local-42'].source).toBe('polling');
    service.stopWatching('local-42');
  }));
});
