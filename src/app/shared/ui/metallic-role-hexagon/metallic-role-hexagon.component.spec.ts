import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MetallicRoleHexagonComponent } from './metallic-role-hexagon.component';

describe('MetallicRoleHexagonComponent', () => {
  let component: MetallicRoleHexagonComponent;
  let fixture: ComponentFixture<MetallicRoleHexagonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetallicRoleHexagonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MetallicRoleHexagonComponent);
    component = fixture.componentInstance;
    component.stats = [
      { role: 'ATAQUE', rating: 85 },
      { role: 'MEDIOCAMPO', rating: 78 },
      { role: 'CARRILERO', rating: 72 },
      { role: 'DEFENSA', rating: 65 },
      { role: 'ARQUERO', rating: 55 },
      { role: 'DT', rating: 60 },
    ];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute classification from best role', () => {
    expect(component.overallClassification).toBe('Elite');
  });
});
