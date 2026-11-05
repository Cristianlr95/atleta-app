import { TestBed } from '@angular/core/testing';
import { ProfileTeamsComponent } from './profile-teams.component';

describe('ProfileTeamsComponent', () => {
  it('emits team actions and limits creator actions to the owner', () => {
    const fixture = TestBed.createComponent(ProfileTeamsComponent);
    const component = fixture.componentInstance;
    component.teams = [{ id: 7, nombre: 'Azul', creadorUuid: 'owner' }];
    component.currentPlayerUuid = 'owner';
    component.expandedTeamId = 7;
    component.inviteCandidates = [{ atletaUuid: 'player-2', alias: 'Nueve' }];
    fixture.detectChanges();
    spyOn(component.teamToggle, 'emit');
    spyOn(component.remove, 'emit');
    spyOn(component.invite, 'emit');
    spyOn(component.queryChange, 'emit');
    fixture.nativeElement.querySelector('.profile-team__btn--icon').click();
    fixture.nativeElement.querySelector('.profile-team__btn--danger').click();
    fixture.nativeElement.querySelector('.profile-team-invite__item button').click();
    const search: HTMLInputElement = fixture.nativeElement.querySelector('.profile-team-invite__input');
    search.value = 'Nueve';
    search.dispatchEvent(new Event('input'));
    expect(component.teamToggle.emit).toHaveBeenCalledOnceWith(7);
    expect(component.remove.emit).toHaveBeenCalledOnceWith(component.teams[0]);
    expect(component.invite.emit).toHaveBeenCalledOnceWith('player-2');
    expect(component.queryChange.emit).toHaveBeenCalledWith('Nueve');
    component.currentPlayerUuid = 'other';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.profile-team__btn--danger')).toBeNull();
  });
});
