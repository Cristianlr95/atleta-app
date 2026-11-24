import { TestBed } from '@angular/core/testing';
import { TeamsPanelComponent } from './teams-panel.component';

describe('TeamsPanelComponent', () => {
  let component: TeamsPanelComponent;

  beforeEach(() => {
    component = new TeamsPanelComponent();
  });

  it('does not emit team invites for a selected team whose captain permission is unknown or revoked', () => {
    spyOn(component.sendInvite, 'emit');

    component.otherTeams = [{ id: 7, nombre: 'Atleta FC' }];
    component.inviteTeams = [{ id: 8, nombre: 'Otro equipo' }];
    component.inviteTeamId = '7';
    component.onSendInvite('player-1');

    expect(component.sendInvite.emit).not.toHaveBeenCalled();
  });

  it('emits team invites for the selected team', () => {
    spyOn(component.sendInvite, 'emit');

    component.inviteTeams = [{ id: 7, nombre: 'Atleta FC', creadorUuid: 'founder' }];
    component.inviteTeamId = '7';
    component.onSendInvite('player-1');

    expect(component.sendInvite.emit).toHaveBeenCalledOnceWith({ teamId: 7, targetUuid: 'player-1' });
    component.inviteTeams = [];
    component.onSendInvite('player-1');
    expect(component.sendInvite.emit).toHaveBeenCalledTimes(1);
  });

  it('opens any roster and shows direct invitation controls only for confirmed captain teams', () => {
    const fixture = TestBed.createComponent(TeamsPanelComponent);
    const panel = fixture.componentInstance;
    panel.principalTeam = { id: 8, nombre: 'Verde', creadorUuid: 'another' };
    panel.otherTeams = [{ id: 7, nombre: 'Azul' }];
    spyOn(panel.openTeam, 'emit');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-metallic-select')).toBeNull();
    expect(fixture.nativeElement.querySelector('button[aria-label="Eliminar Azul"]')).toBeNull();
    fixture.nativeElement.querySelector('button[aria-label="Ver plantel de Azul"]').click();
    expect(panel.openTeam.emit).toHaveBeenCalledOnceWith(7);

    panel.inviteTeams = [{ id: 8, nombre: 'Verde', creadorUuid: 'another' }];
    fixture.detectChanges();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    expect(Array.from(select.options).map(option => option.value)).toEqual(['', '8']);
    expect(fixture.nativeElement.querySelector('button[aria-label="Invitar jugador a Azul"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('button[aria-label="Invitar jugador a Verde"]')).not.toBeNull();
  });
});
