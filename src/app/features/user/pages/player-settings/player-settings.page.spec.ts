import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AppToastService } from 'src/app/core/services/app-toast.service';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { provideAppConfigMock, provideHttpTesting } from 'src/test/testbed-providers';
import { UserApiService } from '../../services/user-api.service';
import { PlayerSettingsPage } from './player-settings.page';

describe('PlayerSettingsPage', () => {
  let component: PlayerSettingsPage;
  let authSessionService: { currentSession: unknown; clearSession: jasmine.Spy };
  let userApiService: jasmine.SpyObj<UserApiService>;

  beforeEach(async () => {
    authSessionService = { currentSession: null, clearSession: jasmine.createSpy('clearSession') };
    userApiService = jasmine.createSpyObj<UserApiService>('UserApiService', ['changePassword', 'deleteAccount']);
    userApiService.changePassword.and.returnValue(of(void 0));
    const toast = jasmine.createSpyObj<AppToastService>('AppToastService', ['success']);
    toast.success.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [PlayerSettingsPage],
      providers: [
        provideAppConfigMock(),
        ...provideHttpTesting(),
        { provide: AuthSessionService, useValue: authSessionService },
        { provide: UserApiService, useValue: userApiService },
        { provide: AppToastService, useValue: toast },
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
      ],
    }).compileComponents();

    const fixture: ComponentFixture<PlayerSettingsPage> = TestBed.createComponent(PlayerSettingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('changes password from settings and clears sensitive fields', async () => {
    authSessionService.currentSession = { user: { atletaUuid: 'ath-1' } };
    component.currentPassword = 'old-pass-123';
    component.newPassword = 'new-pass-123';
    component.confirmNewPassword = 'new-pass-123';

    await component.onChangePassword();

    expect(userApiService.changePassword).toHaveBeenCalledOnceWith('ath-1', {
      currentPassword: 'old-pass-123',
      newPassword: 'new-pass-123',
    });
    expect(component.currentPassword).toBe('');
    expect(component.passwordChangeMessage).toBe('Contrasena actualizada correctamente.');
  });

  it('validates confirmation before calling the API', async () => {
    authSessionService.currentSession = { user: { atletaUuid: 'ath-1' } };
    component.currentPassword = 'old-pass-123';
    component.newPassword = 'new-pass-123';
    component.confirmNewPassword = 'different-pass';

    await component.onChangePassword();

    expect(userApiService.changePassword).not.toHaveBeenCalled();
    expect(component.passwordChangeError).toBe('La confirmacion no coincide con la nueva contrasena.');
  });

  it('explains the transfer requirement and keeps the session on a captain conflict', async () => {
    authSessionService.currentSession = { user: { atletaUuid: 'ath-1' } };
    component.deleteConfirmation = 'ELIMINAR';
    userApiService.deleteAccount.and.returnValue(throwError(() => ({ status: 409, code: 'CAPTAIN_TRANSFER_REQUIRED' })));

    await component.onDeleteAccount();

    expect(component.deleteError).toContain('Transfiere la capitanía');
    expect(authSessionService.clearSession).not.toHaveBeenCalled();
  });
});
