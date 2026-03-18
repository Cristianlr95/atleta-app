import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MetallicPlayerPositionsComponent } from './metallic-player-positions.component';

describe('MetallicPlayerPositionsComponent', () => {
  let component: MetallicPlayerPositionsComponent;
  let fixture: ComponentFixture<MetallicPlayerPositionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetallicPlayerPositionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MetallicPlayerPositionsComponent);
    component = fixture.componentInstance;
    component.positions = [{ name: 'Delantero', priorityLabel: 'Principal' }];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
