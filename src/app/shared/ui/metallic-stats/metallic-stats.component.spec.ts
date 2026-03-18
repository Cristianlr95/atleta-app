import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { MetallicStatsComponent } from './metallic-stats.component';

describe('MetallicStatsComponent', () => {
  let component: MetallicStatsComponent;
  let fixture: ComponentFixture<MetallicStatsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), MetallicStatsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MetallicStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
