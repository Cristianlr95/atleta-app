import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MetallicPositionFieldPickerComponent } from './metallic-position-field-picker.component';

describe('MetallicPositionFieldPickerComponent', () => {
  let component: MetallicPositionFieldPickerComponent;
  let fixture: ComponentFixture<MetallicPositionFieldPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetallicPositionFieldPickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MetallicPositionFieldPickerComponent);
    component = fixture.componentInstance;
    component.options = [
      { label: 'Defensa', value: 'DEF' },
      { label: 'Mediocampo', value: 'MED' },
      { label: 'DT', value: 'COACH' },
    ];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render DT as a special role outside the pitch nodes', () => {
    expect(component.pitchNodes.map((node) => node.label)).not.toContain('DT');
    expect(component.specialRoleNodes.map((node) => node.label)).toContain('DT');
  });

  it('should preserve the selection order in the priority summary', () => {
    component.maxSelections = 3;
    component.selectedValues = ['MED', 'DEF'];

    expect(component.selectedLabels).toEqual(['Mediocampo', 'Defensa']);
    expect(component.positionAriaLabel(component.nodes[1])).toBe('Mediocampo, prioridad 1');
  });

  it('places each wingback on its matching side of the pitch', () => {
    component.options = [
      { label: 'Carrilero Derecho', value: 'CD' },
      { label: 'Carrilero Izquierdo', value: 'CI' },
    ];

    const rightWingback = component.nodes.find((node) => node.value === 'CD');
    const leftWingback = component.nodes.find((node) => node.value === 'CI');

    expect(rightWingback?.x).toBe(78);
    expect(leftWingback?.x).toBe(22);
  });
});
