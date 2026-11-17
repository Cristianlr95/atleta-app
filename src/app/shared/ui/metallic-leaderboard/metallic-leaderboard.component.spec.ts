import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MetallicLeaderboardComponent } from './metallic-leaderboard.component';

describe('MetallicLeaderboardComponent', () => {
  let component: MetallicLeaderboardComponent;
  let fixture: ComponentFixture<MetallicLeaderboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetallicLeaderboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MetallicLeaderboardComponent);
    component = fixture.componentInstance;
    component.rows = [
      { rank: 1, alias: 'Jugador 1', scoreText: '92.1 OVR' },
      { rank: 2, alias: 'Jugador 2', scoreText: '89.4 OVR' },
      { rank: 3, alias: 'Jugador 3', scoreText: '87.9 OVR' },
      { rank: 4, alias: 'Jugador 4', scoreText: '85.3 OVR' },
    ];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows goals, MVP awards and the last five results in chronological order', () => {
    component.rows = [{
      rank: 1, alias: 'Ana', scoreText: '84.6 OVR', matchesPlayed: 18,
      goalsScored: 12, mvpCount: 4, recentResults: ['P', 'P', 'G', 'E', 'G', 'G'],
    }];
    fixture.detectChanges();
    const row: HTMLElement = fixture.nativeElement.querySelector('tbody tr');
    expect(row.querySelector('.leaderboard__goals')?.textContent).toContain('12');
    expect(row.querySelector('.leaderboard__mvp')?.textContent).toContain('4');
    const results = Array.from(row.querySelectorAll('.leaderboard__result'));
    expect(results.map(result => result.textContent?.trim())).toEqual(['P', 'G', 'E', 'G', 'G']);
    expect(results.map(result => result.getAttribute('aria-label')))
      .toEqual(['Perdido', 'Ganado', 'Empatado', 'Ganado', 'Ganado']);
    expect(fixture.nativeElement.textContent).toContain('Más reciente a la derecha');
  });

  it('distinguishes unavailable statistics from a real zero', () => {
    component.rows = [
      { rank: 1, alias: 'Sin datos', scoreText: '63 OVR' },
      { rank: 2, alias: 'Cero goles', scoreText: '63 OVR', goalsScored: 0, mvpCount: 0, recentResults: [] },
    ];
    fixture.detectChanges();
    const rows: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows[0].querySelector('.leaderboard__goals')?.textContent).toContain('—');
    expect(rows[0].querySelector('.leaderboard__mvp')?.textContent).toContain('—');
    expect(rows[0].querySelector('.leaderboard__form')?.textContent).toContain('Sin datos');
    expect(rows[1].querySelector('.leaderboard__goals')?.textContent).toContain('0');
    expect(rows[1].querySelector('.leaderboard__mvp')?.textContent).toContain('0');
    expect(rows[1].querySelector('.leaderboard__form')?.textContent).toContain('Sin partidos');
  });

  it('labels career and position goals and preserves a position zero', () => {
    component.rows = [{ rank: 1, alias: 'Ana', scoreText: '80 OVR', goalsScored: 5, goalsForRole: 0, recentResults: ['G', 'P'], resultsForRole: ['E'] }];
    fixture.detectChanges();
    const goals = fixture.nativeElement.querySelector('.leaderboard__goals').textContent;
    expect(goals).toContain('Total: 5');
    expect(goals).toContain('Posición: 0');
    const results = fixture.nativeElement.querySelector('.leaderboard__form');
    expect(results.textContent).toContain('Total:');
    expect(results.textContent).toContain('Posición:');
    expect(Array.from(results.querySelectorAll('.leaderboard__result') as NodeListOf<HTMLElement>).map(node => node.textContent?.trim())).toEqual(['G', 'P', 'E']);
    expect(results.querySelector('[aria-label="Últimos resultados de trayectoria, más reciente a la derecha"]')).not.toBeNull();
    expect(results.querySelector('[aria-label="Últimos resultados en la posición, más reciente a la derecha"]')).not.toBeNull();
  });
});
