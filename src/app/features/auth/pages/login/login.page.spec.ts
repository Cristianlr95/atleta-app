import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { AuthSession } from 'src/app/core/models/auth-session.model';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { LoginPage } from './login.page';
import { AuthService } from '../../services/auth.service';
import { GoogleIdentityService } from '../../services/google-identity.service';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let authService: jasmine.SpyObj<AuthService>;
  let googleIdentityService: jasmine.SpyObj<GoogleIdentityService>;
  let router: jasmine.SpyObj<Router>;
  let queryParams: BehaviorSubject<ParamMap>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'login',
      'loginWithGoogleIdToken',
    ]);
    googleIdentityService = jasmine.createSpyObj<GoogleIdentityService>('GoogleIdentityService', [
      'requestIdToken',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);
    authService.login.and.returnValue(of(buildSession()));
    authService.loginWithGoogleIdToken.and.returnValue(of(buildSession()));
    googleIdentityService.requestIdToken.and.resolveTo('google-id-token');
    Object.assign(googleIdentityService, { isConfigured: () => true });
    router.navigate.and.resolveTo(true);
    router.navigateByUrl.and.resolveTo(true);
    queryParams = new BehaviorSubject(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: GoogleIdentityService,
          useValue: googleIdentityService,
        },
        {
          provide: Router,
          useValue: router,
        },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: queryParams },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('explica y asocia los errores de los campos al perder el foco', () => {
    component.loginForm.controls.email.setValue('correo-invalido');
    component.loginForm.controls.email.markAsTouched();
    component.loginForm.controls.password.setValue('corta');
    component.loginForm.controls.password.markAsTouched();
    fixture.detectChanges();
    const email: HTMLInputElement = fixture.nativeElement.querySelector('input[type=email]');
    const password: HTMLInputElement = fixture.nativeElement.querySelector('input[type=password]');
    expect(email.getAttribute('aria-describedby')).toBe('login-email-error');
    expect(password.getAttribute('aria-describedby')).toBe('login-password-error');
    expect(fixture.nativeElement.querySelector('#login-email-error')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#login-password-error')).not.toBeNull();
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('enters the app after successful login even during the previous navigation lock', async () => {
    jasmine.clock().install();
    try {
      jasmine.clock().mockDate(new Date());
      await TestBed.inject(NavigationService).safeNavigate(['/login']);
      component.loginForm.setValue({ email: 'demo@atleta.cl', password: 'valid-password' });

      await component.onLogin();

      expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/home');
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('uses updated registration parameters when Ionic reuses the login page', async () => {
    queryParams.next(convertToParamMap({ email: 'new@atleta.test', next: '/player/onboarding' }));
    expect(component.loginForm.controls.email.value).toBe('new@atleta.test');
    component.loginForm.controls.password.setValue('valid-password');

    await component.onLogin();

    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/player/onboarding');
  });

  it('recovers from an old login redirect that points back to login', async () => {
    queryParams.next(convertToParamMap({ next: '/login?next=%2Fplayer%2Fonboarding' }));
    component.loginForm.setValue({ email: 'demo@atleta.cl', password: 'valid-password' });

    await component.onLogin();

    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/home');
  });

  it('hides the Google sign-in option when this environment has no client ID', () => {
    Object.assign(googleIdentityService, { isConfigured: () => false });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.login-google')).toBeNull();
  });

  it('authenticates with Google credential and navigates home', async () => {
    await component.onContinueWithGoogle();

    expect(googleIdentityService.requestIdToken).toHaveBeenCalled();
    expect(authService.loginWithGoogleIdToken).toHaveBeenCalledOnceWith('google-id-token');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/home');
    expect(component.authError).toBeNull();
  });

  it('shows a friendly error when Google auth is unavailable', async () => {
    googleIdentityService.requestIdToken.and.rejectWith(new Error('Google auth no esta configurado.'));

    await component.onContinueWithGoogle();

    expect(authService.loginWithGoogleIdToken).not.toHaveBeenCalled();
    expect(component.authError).toBe('Google auth no esta configurado.');
  });

  it('opens the password recovery flow', () => {
    component.onForgotPassword();

    expect(router.navigate).toHaveBeenCalledWith(['/password-reset'], undefined);
  });
});

function buildSession(): AuthSession {
  return {
    user: {
      atletaUuid: 'ath-1',
      email: 'demo@atleta.cl',
      nombre: 'Demo',
    },
    tokens: {
      accessToken: 'access-token',
    },
  };
}
