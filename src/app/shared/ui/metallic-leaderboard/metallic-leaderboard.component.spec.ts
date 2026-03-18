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
});
