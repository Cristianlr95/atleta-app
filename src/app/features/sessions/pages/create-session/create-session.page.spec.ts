import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { provideAppConfigMock, provideHttpTesting } from 'src/test/testbed-providers';
import { MatchesApiService } from '../../../matches/services/matches-api.service';
import { TeamApiService } from '../../../teams/services/team-api.service';
import { CreateSessionPage } from './create-session.page';

describe('CreateSessionPage', () => {
  let component: CreateSessionPage;
  let fixture: ComponentFixture<CreateSessionPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateSessionPage],
      providers: [
        provideAppConfigMock(),
        ...provideHttpTesting(),
        {
          provide: MatchesApiService,
          useValue: {
            createMatch: () => of({}),
            addTeamToMatch: () => of(void 0),
            joinMatch: () => of(void 0),
            confirmPlayer: () => of(void 0),
            updateMatchStatus: () => of(void 0),
            registerEvent: () => of(void 0),
            confirmEvent: () => of(void 0),
          },
        },
        {
          provide: TeamApiService,
          useValue: {
            getByCreator: () => of([]),
            getByPlayer: () => of([]),
            getActiveMembers: () => of([]),
          },
        },
        {
          provide: AuthSessionService,
          useValue: {
            currentSession: {
              user: {
                atletaUuid: 'uuid-test',
                email: 'test@atleta.app',
                nombre: 'Test',
              },
            },
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: jasmine.createSpy('navigate').and.resolveTo(true),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateSessionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
