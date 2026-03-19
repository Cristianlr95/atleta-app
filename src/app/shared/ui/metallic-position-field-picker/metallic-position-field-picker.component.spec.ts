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
});
