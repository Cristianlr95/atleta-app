import { fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MatchMvpVotePage } from './match-mvp-vote.page';

describe('MatchMvpVotePage live progress', () => {
  it('refreshes other voters progress and stops refreshing after closure or leaving', fakeAsync(() => {
    const open = signal(true);
    const refresh = jasmine.createSpy('refresh').and.returnValue(Promise.resolve(null));
    const page = Object.create(MatchMvpVotePage.prototype) as MatchMvpVotePage;
    Object.assign(page, {
      isOpen: open,
      remainingLabel: signal(''),
      routeMatchId: signal('6'),
      mvpVoteStore: { refresh },
    });
    try {
      page['startCountdown'](new Date(Date.now() + 3600000).toISOString());
      tick(5000);
      expect(refresh).toHaveBeenCalledOnceWith('6', true);
      open.set(false);
      tick(5000);
      expect(refresh).toHaveBeenCalledTimes(1);
      open.set(true);
      page.ionViewWillLeave();
      tick(5000);
      expect(refresh).toHaveBeenCalledTimes(1);
    } finally {
      page.ionViewWillLeave();
    }
  }));
});
