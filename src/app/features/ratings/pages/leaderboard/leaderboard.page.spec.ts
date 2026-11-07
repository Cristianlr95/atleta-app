import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { provideAppConfigMock, provideHttpTesting } from 'src/test/testbed-providers';
import { LeaderboardService } from '../../services/leaderboard.service';
import { LeaderboardPage } from './leaderboard.page';
import { RANKING_DEMO_ROWS, RANKING_DEMO_RECORD } from './leaderboard-demo.data';

describe('LeaderboardPage', () => {
  let component: LeaderboardPage;
  let fixture: ComponentFixture<LeaderboardPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaderboardPage],
      providers: [
        provideAppConfigMock({ environmentName: 'development' }),
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

  it('expone el filtro de posición seleccionado', () => {
    component.selectedMode = 'ROLE';
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.leaderboard-roles button');
    expect(buttons.length).toBeGreaterThan(0);
    expect(Array.from<HTMLButtonElement>(buttons).some(button => button.getAttribute('aria-pressed') === 'true')).toBeTrue();
  });
  it('no duplica el número de partidos cuando el texto ya lo incluye', () => {
    component.overallRows = [{ rank: 1, alias: 'Ana', scoreText: '63', matchesPlayed: 8, metaText: '8 partidos' }];
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.leaderboard__mobile-matches')).toBeNull();
  });
  it('mantiene los partidos jugados disponibles en móvil', () => {
    component.overallRows = [{ rank: 1, alias: 'Ana', scoreText: '63', matchesPlayed: 8 }];
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.leaderboard__mobile-matches')?.textContent).toContain('8 partidos');
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('explains no search matches and lets the player clear the query', async () => {
    component.overallRows = [...RANKING_DEMO_ROWS];
    component.searchTerm = 'sin-coincidencias-p3';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.leaderboard__empty')?.textContent)
      .toContain('No encontramos jugadores con esa búsqueda.');
    const clearButton: HTMLButtonElement | undefined = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((button) => button.textContent?.trim() === 'Limpiar búsqueda');
    expect(clearButton).toBeDefined();
    clearButton?.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.searchTerm).toBe('');
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(RANKING_DEMO_ROWS.length);
  });

  it('distinguishes a ranking without data from a search without matches', () => {
    component.overallRows = [];
    component.searchTerm = 'Ana';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.leaderboard__empty')?.textContent)
      .toContain('Todavía no hay datos para este ranking.');
  });

  it('labels the example currently displayed, not a different ranking', () => {
    component.overallRows = [...RANKING_DEMO_ROWS];
    expect(component.usesDevelopmentDemo).toBeTrue();
    component.selectedScope = 'TEAM';
    component.teamRows = [{ rank: 1, alias: 'Real player', scoreText: '63 OVR' }];
    expect(component.usesDevelopmentDemo).toBeFalse();
    component.teamRecord = RANKING_DEMO_RECORD;
    expect(component.usesDevelopmentDemo).toBeTrue();
  });
});
