import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { NotificationBadgeService } from 'src/app/features/matches/services/notification-badge.service';
import { RatingsApiService } from 'src/app/features/ratings/services/ratings-api.service';
import { UserApiService } from 'src/app/features/user/services/user-api.service';
import { TeamApiService } from '../../services/team-api.service';
import { TeamDetailPage } from './team-detail.page';

describe('TeamDetailPage', () => {
  let fixture: ComponentFixture<TeamDetailPage>;
  let component: TeamDetailPage;
  let teamApiService: jasmine.SpyObj<TeamApiService>;
  let navigationService: jasmine.SpyObj<NavigationService>;
  let userApiService: jasmine.SpyObj<UserApiService>;
  let ratingsApiService: jasmine.SpyObj<RatingsApiService>;

  beforeEach(async () => {
    teamApiService = jasmine.createSpyObj<TeamApiService>('TeamApiService', ['getById', 'getActiveMembers']);
    navigationService = jasmine.createSpyObj<NavigationService>('NavigationService', [
      'safeNavigate', 'goBackOrProfile', 'goToProfile',
    ]);
    userApiService = jasmine.createSpyObj<UserApiService>('UserApiService', ['getPublicPlayerProfile']);
    ratingsApiService = jasmine.createSpyObj<RatingsApiService>('RatingsApiService', ['getOverall']);
    navigationService.safeNavigate.and.resolveTo(true);
    userApiService.getPublicPlayerProfile.and.returnValue(of({ pictureUrl: '/demo.jpg' } as any));
    ratingsApiService.getOverall.and.returnValue(of({ hybridOVR: 74 } as any));
    teamApiService.getById.and.returnValue(of({ id: 77, nombre: 'Atleta FC', anioFundacion: 2020 }));
    teamApiService.getActiveMembers.and.returnValue(of([{
      playerUuid: 'player-uuid', alias: 'Demo10', rol: 'CAPITAN', primaryPositionId: 9,
      primaryPositionName: 'Delantero',
    }]));

    await TestBed.configureTestingModule({
      imports: [TeamDetailPage],
      providers: [
        { provide: TeamApiService, useValue: teamApiService },
        { provide: NavigationService, useValue: navigationService },
        { provide: UserApiService, useValue: userApiService },
        { provide: RatingsApiService, useValue: ratingsApiService },
        { provide: NotificationBadgeService, useValue: { totalPending: () => 0 } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '77' } } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TeamDetailPage);
    component = fixture.componentInstance;
  });

  it('loads the exact team and opens the selected member profile', () => {
    component.ionViewWillEnter();
    fixture.detectChanges();
    component.onOpenPlayer('player-uuid');

    expect(teamApiService.getById).toHaveBeenCalledOnceWith(77);
    expect(teamApiService.getActiveMembers).toHaveBeenCalledOnceWith(77);
    expect(fixture.nativeElement.textContent).toContain('Atleta FC');
    expect(fixture.nativeElement.textContent).toContain('Demo10');
    expect(navigationService.safeNavigate).toHaveBeenCalledWith(['/players', 'player-uuid']);
  });

  it('offers a recoverable Social exit when the team is missing', () => {
    teamApiService.getById.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    component.ionViewWillEnter();
    fixture.detectChanges();

    expect(component.notFound).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Volver a Social');
  });

  it('uses initials when team and member images cannot load', () => {
    component.ionViewWillEnter();
    component.team!.logoUrl = '/missing-team-logo.png';
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.team-hero img').dispatchEvent(new Event('error'));
    fixture.nativeElement.querySelector('.team-member__player img').dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.team-hero img')).toBeNull();
    expect(fixture.nativeElement.querySelector('.team-shield')?.textContent).toBe('A');
    expect(fixture.nativeElement.querySelector('.team-member__player i')?.textContent).toBe('D');
  });

  it('keeps a team with an empty roster visible', () => {
    teamApiService.getActiveMembers.and.returnValue(of([]));
    component.ionViewWillEnter();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Atleta FC');
    expect(fixture.nativeElement.textContent).toContain('No hay integrantes activos.');
  });

  it('distinguishes a rating failure from an unrated player and retries', () => {
    ratingsApiService.getOverall.and.returnValue(throwError(() => ({ status: 500 })));
    component.ionViewWillEnter();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar las valoraciones.');
    expect(fixture.nativeElement.querySelector('.team-member__ovr').textContent).not.toContain('Sin valoración');
    ratingsApiService.getOverall.and.returnValue(of({ hybridOVR: 74 } as any));
    fixture.nativeElement.querySelector('[aria-label="Reintentar valoraciones de Demo10"]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.team-member__ovr').textContent).toContain('74');
  });

  it('renders real position values, preserving zero and missing ratings', () => {
    ratingsApiService.getOverall.and.returnValue(of({ hybridOVR: 0, roleBreakdown: { ATAQUE: 79, MEDIOCAMPO: 0 } } as any));
    component.ionViewWillEnter();
    fixture.detectChanges();
    const values = fixture.nativeElement.querySelector('.team-member__ratings');
    expect(values.textContent).toContain('Mediocampo0');
    expect(values.textContent).toContain('DefensaSin valoración');
    expect(fixture.nativeElement.querySelector('.team-member__ovr').textContent).toContain('0');
    expect(ratingsApiService.getOverall).toHaveBeenCalledOnceWith('player-uuid');
  });
});
