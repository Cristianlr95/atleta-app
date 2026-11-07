import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SocialTabsComponent } from './social-tabs.component';

describe('SocialTabsComponent', () => {
  let fixture: ComponentFixture<SocialTabsComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SocialTabsComponent] }).compileComponents();
    fixture = TestBed.createComponent(SocialTabsComponent);
  });
  it('anuncia la sección seleccionada', () => {
    fixture.componentInstance.activeTab = 'friends';
    fixture.detectChanges();
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
  });
});
