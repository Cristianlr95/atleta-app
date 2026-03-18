import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { MetallicButtonComponent } from './metallic-button.component';

describe('MetallicButtonComponent', () => {
  let component: MetallicButtonComponent;
  let fixture: ComponentFixture<MetallicButtonComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), MetallicButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MetallicButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
