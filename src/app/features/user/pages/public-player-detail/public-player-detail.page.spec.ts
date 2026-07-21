import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { UserApiService } from '../../services/user-api.service';
import { PublicPlayerDetailPage } from './public-player-detail.page';

describe('PublicPlayerDetailPage', () => {
  let fixture: ComponentFixture<PublicPlayerDetailPage>;
  let component: PublicPlayerDetailPage;
  let userApiService: jasmine.SpyObj<UserApiService>;
  let navigationService: jasmine.SpyObj<NavigationService>;

  beforeEach(async () => {
    userApiService = jasmine.createSpyObj<UserApiService>('UserApiService', ['getPublicPlayerProfile']);
    navigationService = jasmine.createSpyObj<NavigationService>('NavigationService', [
      'safeNavigate', 'goBackOrProfile', 'goToProfile',
    ]);
    navigationService.safeNavigate.and.resolveTo(true);
    userApiService.getPublicPlayerProfile.and.returnValue(of({
      atletaUuid: 'player-uuid', alias: 'Demo10', genero: 'MASCULINO', trustScore: 92,
      positions: [{ id: 1, position: { id: 9, nombre: 'Delantero' }, prioridad: 1, xp: 120 }],
    }));

    await TestBed.configureTestingModule({
      imports: [PublicPlayerDetailPage],
      providers: [
        { provide: UserApiService, useValue: userApiService },
        { provide: NavigationService, useValue: navigationService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'player-uuid' } } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PublicPlayerDetailPage);
    component = fixture.componentInstance;
  });

  it('loads the route player and renders only public competitive data', () => {
    component.ionViewWillEnter();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(userApiService.getPublicPlayerProfile).toHaveBeenCalledOnceWith('player-uuid');
    expect(text).toContain('Demo10');
    expect(text).toContain('Delantero');
    expect(text).not.toContain('email');
    expect(text).not.toContain('password');
  });

  it('offers a recoverable Social exit when the player is missing', () => {
    userApiService.getPublicPlayerProfile.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    component.ionViewWillEnter();
    fixture.detectChanges();

    expect(component.notFound).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Volver a Social');
  });
});
