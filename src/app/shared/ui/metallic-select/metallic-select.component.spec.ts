import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MetallicSelectComponent } from './metallic-select.component';

describe('MetallicSelectComponent', () => {
  let component: MetallicSelectComponent;
  let fixture: ComponentFixture<MetallicSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetallicSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MetallicSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('associates its visible label with the native select', () => {
    component.label = 'Equipo';
    fixture.detectChanges();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    expect(select.labels?.[0]?.textContent?.trim()).toBe('Equipo');
  });

  it('exposes invalid state on the native select', () => {
    component.invalid = true;
    fixture.detectChanges();

    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    expect(select.getAttribute('aria-invalid')).toBe('true');
  });
});
