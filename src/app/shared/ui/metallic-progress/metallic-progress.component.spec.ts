import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { MetallicProgressComponent } from './metallic-progress.component';

describe('MetallicProgressComponent', () => {
  let component: MetallicProgressComponent;
  let fixture: ComponentFixture<MetallicProgressComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), MetallicProgressComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MetallicProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
