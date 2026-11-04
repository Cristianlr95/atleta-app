import { ComponentFixture, TestBed } from '@angular/core/testing';
import { XpRewardCardComponent } from './xp-reward-card.component';

describe('XpRewardCardComponent', () => {
  let fixture: ComponentFixture<XpRewardCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [XpRewardCardComponent] }).compileComponents();
    fixture = TestBed.createComponent(XpRewardCardComponent);
  });

  it('muestra XP y OVR sin inventar niveles ni progreso', () => {
    fixture.componentInstance.rewards = [{ id: 'p1', playerName: 'Ana', position: 'DEL', xp: 17, currentOvr: 63.5 }];
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Ana');
    expect(text).toContain('+17 XP estimados');
    expect(text).toContain('63.5');
    expect(text).not.toContain('Nivel');
    expect(fixture.nativeElement.querySelector('.xp-bar')).toBeNull();
  });

  it('muestra el estado vacío sin recompensas', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sin recompensas para mostrar');
  });
});
