import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { AuthService } from 'src/app/features/auth/services/auth.service';
import { OnboardingRecoveryPage } from './onboarding-recovery.page';

describe('OnboardingRecoveryPage', () => {
  let fixture: ComponentFixture<OnboardingRecoveryPage>;
  let component: OnboardingRecoveryPage;
  let navigationService: jasmine.SpyObj<NavigationService>;

  beforeEach(async () => {
    navigationService = jasmine.createSpyObj<NavigationService>('NavigationService', [
      'safeNavigateByUrl',
      'goToLoginAfterLogout',
    ]);
    navigationService.safeNavigateByUrl.and.resolveTo(true);
    navigationService.goToLoginAfterLogout.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [OnboardingRecoveryPage],
      providers: [
        { provide: NavigationService, useValue: navigationService },
        { provide: AuthService, useValue: jasmine.createSpyObj<AuthService>('AuthService', ['logout']) },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => ({ reason: 'offline', next: '/matches/42' })[key] ?? null,
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingRecoveryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows the offline state and retries the original URL', async () => {
    expect(component.reason).toBe('offline');
    expect(fixture.nativeElement.textContent).toContain('No hay conexion');

    await component.onRetry();

    expect(navigationService.safeNavigateByUrl).toHaveBeenCalledOnceWith('/matches/42');
  });
});
