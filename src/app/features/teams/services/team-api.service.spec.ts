import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideAppConfigMock, provideHttpTesting } from 'src/test/testbed-providers';
import { TeamApiService } from './team-api.service';

describe('TeamApiService.removeMember', () => {
  it('sends the team and target in the DELETE path without supplying an actor', () => {
    TestBed.configureTestingModule({ providers: [provideAppConfigMock(), ...provideHttpTesting()] });
    const http = TestBed.inject(HttpTestingController);
    const target = '732ba969-f6aa-4721-9a4c-dbe01341b706';

    TestBed.inject(TeamApiService).removeMember(77, target).subscribe();

    const request = http.expectOne({ method: 'DELETE', url: `http://localhost:8080/api/v1/teams/77/members/${target}` });
    expect(request.request.body).toBeNull();
    request.flush(null, { status: 204, statusText: 'No Content' });
    http.verify();
  });
});

describe('TeamApiService.leaveTeam', () => {
  it('uses the authenticated membership endpoint without an actor or request body', () => {
    TestBed.configureTestingModule({ providers: [provideAppConfigMock(), ...provideHttpTesting()] });
    const http = TestBed.inject(HttpTestingController);
    TestBed.inject(TeamApiService).leaveTeam(77).subscribe();
    const request = http.expectOne({ method: 'DELETE', url: 'http://localhost:8080/api/v1/teams/77/members/me' });
    expect(request.request.body).toBeNull();
    request.flush(null, { status: 204, statusText: 'No Content' });
    http.verify();
  });
});
