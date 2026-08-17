import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatchSize, Player } from '../../models/progressive-match.models';
import { TeamsBoardComponent } from './teams-board.component';

describe('TeamsBoardComponent', () => {
  let fixture: ComponentFixture<TeamsBoardComponent>;
  let component: TeamsBoardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TeamsBoardComponent] }).compileComponents();
    fixture = TestBed.createComponent(TeamsBoardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('enabled', true);
    fixture.componentRef.setInput('modality', MatchSize.FIVE_VS_FIVE);
    fixture.componentRef.setInput('players', players());
    fixture.detectChanges();
  });

  it('renders one tactical slot per player in the modality', () => {
    expect(fixture.nativeElement.querySelectorAll('.pitch-slot').length).toBe(10);
    expect(fixture.nativeElement.textContent).toContain('OVR');
  });

  it('supports selecting and swapping players without duplicating them', () => {
    const home = component.homePlayers[0];
    const away = component.awayPlayers[0];

    component.selectOrPlace(home.uuid, 'HOME', 0);
    component.selectOrPlace(away.uuid, 'AWAY', 0);

    const ids = [...component.homePlayers, ...component.awayPlayers].map((player) => player.uuid);
    expect(new Set(ids).size).toBe(ids.length);
    expect(component.awayPlayers[0].uuid).toBe(home.uuid);
    expect(component.hasUnsavedChanges).toBeTrue();
  });
});

function players(): Player[] {
  const positions = ['Arquero', 'Defensa', 'Defensa central', 'Mediocampista', 'Delantero'];
  return Array.from({ length: 10 }, (_, index) => ({
    uuid: `player-${index}`,
    name: `Jugador ${index + 1}`,
    position: positions[index % positions.length],
    role: 'JUGADOR',
    ovr: 66 + index,
  }));
}
