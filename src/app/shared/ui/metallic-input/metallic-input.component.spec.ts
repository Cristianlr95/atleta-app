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
});
