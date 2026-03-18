import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MetallicFormSectionComponent } from './metallic-form-section.component';

describe('MetallicFormSectionComponent', () => {
  let component: MetallicFormSectionComponent;
  let fixture: ComponentFixture<MetallicFormSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetallicFormSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MetallicFormSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
