import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { AuthService } from '../../services/auth.service';
import { PasswordResetPage } from './password-reset.page';

describe('PasswordResetPage', () => {
  let fixture: ComponentFixture<PasswordResetPage>;
  let component: PasswordResetPage;
  let auth: jasmine.SpyObj<AuthService>;
  let navigation: jasmine.SpyObj<NavigationService>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['requestPasswordReset', 'confirmPasswordReset']);
    navigation = jasmine.createSpyObj<NavigationService>('NavigationService', ['safeNavigate']);
    auth.requestPasswordReset.and.returnValue(of(void 0));
    auth.confirmPasswordReset.and.returnValue(of(void 0));
    navigation.safeNavigate.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [PasswordResetPage],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: NavigationService, useValue: navigation },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PasswordResetPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('requests recovery with a non-enumerating confirmation', async () => {
    component.requestForm.setValue({ email: 'demo@atleta.cl' });

    await component.onSubmitRequest();

    expect(auth.requestPasswordReset).toHaveBeenCalledOnceWith('demo@atleta.cl');
    expect(component.message).toContain('Si el correo existe');
  });

  it('prevents mismatched password confirmation', async () => {
    Object.defineProperty(component, 'token', { value: 'reset-token' });
    component.confirmForm.setValue({ password: 'secret-123', confirmation: 'different-123' });

    await component.onSubmitConfirmation();

    expect(auth.confirmPasswordReset).not.toHaveBeenCalled();
    expect(component.error).toContain('no coinciden');
  });

  it('consumes the reset token and returns to login after a valid confirmation', async () => {
    Object.defineProperty(component, 'token', { value: 'reset-token' });
    component.confirmForm.setValue({ password: 'secret-123', confirmation: 'secret-123' });

    await component.onSubmitConfirmation();

    expect(auth.confirmPasswordReset).toHaveBeenCalledOnceWith('reset-token', 'secret-123');
    expect(navigation.safeNavigate).toHaveBeenCalledWith(['/login'], { queryParams: { reset: 'success' } });
  });
});
