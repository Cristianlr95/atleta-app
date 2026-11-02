import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { RegisterPage } from './register.page';
import { APP_CONFIG } from 'src/app/core/config/app-config.token';
import { provideAppConfigMock } from 'src/test/testbed-providers';

describe('RegisterPage', () => {
  let component: RegisterPage;
  let fixture: ComponentFixture<RegisterPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        provideAppConfigMock(),
        {
          provide: AuthService,
          useValue: {
            register: () => of({}),
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: () => Promise.resolve(true),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    const content: HTMLIonContentElement = fixture.nativeElement.querySelector('ion-content');
    await content.componentOnReady?.();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('requires and passes the invitation code in beta', () => {
    TestBed.inject(APP_CONFIG).environmentName = 'beta';
    const beta = TestBed.createComponent(RegisterPage).componentInstance;
    const register = spyOn(TestBed.inject(AuthService), 'register').and.callThrough();
    beta.registerForm.setValue({
      nombre: 'Ana', email: 'ana@atleta.test', genero: 'FEMENINO',
      password: 'Password123', confirmPassword: 'Password123', invitationCode: '',
    });
    beta.onRegister();
    expect(register).not.toHaveBeenCalled();
    beta.registerForm.controls.invitationCode.setValue('codigo-local');
    beta.onRegister();
    expect(register).toHaveBeenCalledWith(jasmine.objectContaining({ email: 'ana@atleta.test' }), 'codigo-local');
  });

  it('announces validation errors and focuses the first invalid field', () => {
    component.onRegister();
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const errorId = input.getAttribute('aria-describedby');
    expect(errorId).toBeTruthy();
    expect(fixture.nativeElement.querySelector(`#${errorId}`)?.textContent).toContain('El nombre es obligatorio.');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    expect(document.activeElement).toBe(input);

    component.registerForm.controls.nombre.setValue('Ana');
    fixture.detectChanges();
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(input.getAttribute('aria-describedby')).toBeNull();
  });

  it('focuses confirmation and describes a password mismatch', () => {
    component.registerForm.setValue({
      nombre: 'Ana', email: 'ana@atleta.test', genero: 'FEMENINO',
      password: 'Password123', confirmPassword: 'Different123', invitationCode: '',
    });
    fixture.detectChanges();
    component.onRegister();
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      'app-metallic-input[formControlName="confirmPassword"] input',
    );
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector(`#${input.getAttribute('aria-describedby')}`)?.textContent)
      .toContain('Las contraseñas no coinciden.');
  });
});
