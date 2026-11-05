import { TestBed } from '@angular/core/testing';
import { ProfileAchievementsComponent } from './profile-achievements.component';

describe('ProfileAchievementsComponent', () => {
  it('renders the achievement tier and progress', () => {
    const fixture = TestBed.createComponent(ProfileAchievementsComponent);
    fixture.componentInstance.achievements = [{
      code: 'TOP_SCORER', title: 'Goleador', description: 'Marca goles', metricLabel: 'goles',
      currentValue: 5, nextThreshold: 10, progressPercent: 50, tier: 'GOLD', unlocked: true,
    }];
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Goleador');
    expect(fixture.nativeElement.textContent).toContain('Oro');
    expect(fixture.nativeElement.textContent).toContain('5 / 10 goles');
  });
});
