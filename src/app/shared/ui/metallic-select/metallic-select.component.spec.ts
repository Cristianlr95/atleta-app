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
});
