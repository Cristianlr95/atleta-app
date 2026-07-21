import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { TeamApiService } from '../../services/team-api.service';
import { TeamDetailPage } from './team-detail.page';

describe('TeamDetailPage', () => {
  let fixture: ComponentFixture<TeamDetailPage>;
  let component: TeamDetailPage;
  let teamApiService: jasmine.SpyObj<TeamApiService>;
  let navigationService: jasmine.SpyObj<NavigationService>;

  beforeEach(async () => {
    teamApiService = jasmine.createSpyObj<TeamApiService>('TeamApiService', ['getById', 'getActiveMembers']);
    navigationService = jasmine.createSpyObj<NavigationService>('NavigationService', [
      'safeNavigate', 'goBackOrProfile', 'goToProfile',
    ]);
    navigationService.safeNavigate.and.resolveTo(true);
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
});
