import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NavigationService } from './navigation.service';

describe('NavigationService', () => {
  let service: NavigationService;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl'], {
      url: '/home',
    });
    router.navigate.and.resolveTo(true);
    router.navigateByUrl.and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        NavigationService,
        { provide: Router, useValue: router },
        { provide: Location, useValue: jasmine.createSpyObj<Location>('Location', ['back']) },
      ],
    });

    service = TestBed.inject(NavigationService);
  });

  it('routes main bottom nav sections through their canonical app routes', async () => {
    const unlock = () => ((service as unknown as { lockedUntil: number }).lockedUntil = 0);

    await service.goToMainBottomSection('home');
    unlock();
    await service.goToMainBottomSection('matches');
    unlock();
    await service.goToMainBottomSection('ranking');
    unlock();
    await service.goToMainBottomSection('profile');

    expect(router.navigate).toHaveBeenCalledWith(['/home'], undefined);
    expect(router.navigate).toHaveBeenCalledWith(['/matches'], undefined);
    expect(router.navigate).toHaveBeenCalledWith(['/leaderboard'], undefined);
    expect(router.navigate).toHaveBeenCalledWith(['/player/profile'], undefined);
  });

  it('ignores unknown main bottom nav ids', async () => {
    const navigated = await service.goToMainBottomSection('unknown');

    expect(navigated).toBeFalse();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
