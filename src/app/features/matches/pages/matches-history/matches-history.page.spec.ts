import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { provideAppConfigMock, provideHttpTesting } from 'src/test/testbed-providers';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { MatchHistoryService } from '../../services/match-history.service';
import { MatchesHistoryPage } from './matches-history.page';

describe('MatchesHistoryPage', () => {
  let component: MatchesHistoryPage;
  let fixture: ComponentFixture<MatchesHistoryPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchesHistoryPage],
      providers: [
        provideAppConfigMock(),
        ...provideHttpTesting(),
        {
          provide: AuthSessionService,
          useValue: {
            currentSession: null,
          },
        },
        {
          provide: MatchHistoryService,
          useValue: {
            getPlayerHistory: () => of([]),
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: () => Promise.resolve(true),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => null,
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchesHistoryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

