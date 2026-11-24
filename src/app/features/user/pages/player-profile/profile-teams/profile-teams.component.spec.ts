import { TestBed } from '@angular/core/testing';
import { ProfileTeamsComponent } from './profile-teams.component';

describe('ProfileTeamsComponent', () => {
  it('opens the roster for any member and offers invitations when captain access is confirmed', () => {
    const fixture = TestBed.createComponent(ProfileTeamsComponent);
    const component = fixture.componentInstance;
    component.teams = [{ id: 7, nombre: 'Azul', creadorUuid: 'owner' }];
    component.expandedTeamId = 7;
    component.inviteCandidates = [{ atletaUuid: 'player-2', alias: 'Nueve' }];
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.profile-team-invite__input')).toBeNull();
    expect(fixture.nativeElement.querySelector('.profile-team__btn--admin')).toBeNull();
    expect(fixture.nativeElement.querySelector('.profile-team__btn--danger')).toBeNull();
    component.inviteTeamIds = [7];
    fixture.detectChanges();
    spyOn(component.teamToggle, 'emit');
    spyOn(component.viewTeam, 'emit');
    spyOn(component.invite, 'emit');
    spyOn(component.queryChange, 'emit');
    fixture.nativeElement.querySelector('.profile-team__btn--icon').click();
    fixture.nativeElement.querySelector('.profile-team__btn--admin').click();
    fixture.nativeElement.querySelector('.profile-team-invite__item button').click();
    const search: HTMLInputElement = fixture.nativeElement.querySelector('.profile-team-invite__input');
    search.value = 'Nueve';
    search.dispatchEvent(new Event('input'));
    expect(component.teamToggle.emit).toHaveBeenCalledOnceWith(7);
    expect(component.viewTeam.emit).toHaveBeenCalledOnceWith(7);
    expect(component.invite.emit).toHaveBeenCalledOnceWith('player-2');
    expect(component.queryChange.emit).toHaveBeenCalledWith('Nueve');
    component.inviteTeamIds = [];
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.profile-team-invite__input')).toBeNull();
    expect(fixture.nativeElement.querySelector('.profile-team__btn--admin')).toBeNull();
  });
});
