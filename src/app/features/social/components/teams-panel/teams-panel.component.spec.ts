import { TeamsPanelComponent } from './teams-panel.component';

describe('TeamsPanelComponent', () => {
  let component: TeamsPanelComponent;

  beforeEach(() => {
    component = new TeamsPanelComponent();
  });

  it('does not emit team invites until a created team is selected', () => {
    spyOn(component.sendInvite, 'emit');

    component.inviteCandidates = [{ atletaUuid: 'player-1', alias: 'Nueve' }];
    component.onSendInvite('player-1');

    expect(component.sendInvite.emit).not.toHaveBeenCalled();
  });

  it('emits team invites for the selected team', () => {
    spyOn(component.sendInvite, 'emit');

    component.createdTeams = [{ id: 7, nombre: 'Atleta FC' }];
    component.inviteTeamId = '7';
    component.onSendInvite('player-1');

    expect(component.sendInvite.emit).toHaveBeenCalledOnceWith({ teamId: 7, targetUuid: 'player-1' });
  });
});
