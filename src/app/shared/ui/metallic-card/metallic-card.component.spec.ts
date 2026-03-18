import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { MetallicCardComponent } from './metallic-card.component';

describe('MetallicCardComponent', () => {
  let component: MetallicCardComponent;
  let fixture: ComponentFixture<MetallicCardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), MetallicCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MetallicCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
