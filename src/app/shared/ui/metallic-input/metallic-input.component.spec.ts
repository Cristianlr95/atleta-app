import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { MetallicInputComponent } from './metallic-input.component';

describe('MetallicInputComponent', () => {
  let component: MetallicInputComponent;
  let fixture: ComponentFixture<MetallicInputComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), MetallicInputComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MetallicInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('associates its visible label with the native input', () => {
    component.label = 'Email';
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.labels?.[0]?.textContent?.trim()).toBe('Email');
  });

  it('exposes invalid state on the native input', () => {
    component.invalid = true;
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });
});
