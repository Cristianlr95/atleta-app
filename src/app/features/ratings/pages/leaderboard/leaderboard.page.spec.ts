import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { provideAppConfigMock, provideHttpTesting } from 'src/test/testbed-providers';
import { LeaderboardService } from '../../services/leaderboard.service';
import { LeaderboardPage } from './leaderboard.page';

describe('LeaderboardPage', () => {
  let component: LeaderboardPage;
  let fixture: ComponentFixture<LeaderboardPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaderboardPage],
      providers: [
        provideAppConfigMock(),
        ...provideHttpTesting(),
        {
          provide: LeaderboardService,
          useValue: {
            getOverallLeaderboard: () => of([]),
            getRoleLeaderboard: () => of([]),
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

    fixture = TestBed.createComponent(LeaderboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
