import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthSession } from 'src/app/core/models/auth-session.model';
import { LoginPage } from './login.page';
import { AuthService } from '../../services/auth.service';
import { GoogleIdentityService } from '../../services/google-identity.service';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let authService: jasmine.SpyObj<AuthService>;
  let googleIdentityService: jasmine.SpyObj<GoogleIdentityService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'login',
      'loginWithGoogleIdToken',
    ]);
    googleIdentityService = jasmine.createSpyObj<GoogleIdentityService>('GoogleIdentityService', [
      'requestIdToken',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    authService.login.and.returnValue(of(buildSession()));
    authService.loginWithGoogleIdToken.and.returnValue(of(buildSession()));
    googleIdentityService.requestIdToken.and.resolveTo('google-id-token');
    router.navigate.and.resolveTo(true);

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
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => null,
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('authenticates with Google credential and navigates home', async () => {
    await component.onContinueWithGoogle();

    expect(googleIdentityService.requestIdToken).toHaveBeenCalled();
    expect(authService.loginWithGoogleIdToken).toHaveBeenCalledOnceWith('google-id-token');
    expect(router.navigate).toHaveBeenCalledWith(['/home'], undefined);
    expect(component.authError).toBeNull();
  });

  it('shows a friendly error when Google auth is unavailable', async () => {
    googleIdentityService.requestIdToken.and.rejectWith(new Error('Google auth no esta configurado.'));

    await component.onContinueWithGoogle();

    expect(authService.loginWithGoogleIdToken).not.toHaveBeenCalled();
    expect(component.authError).toBe('Google auth no esta configurado.');
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
