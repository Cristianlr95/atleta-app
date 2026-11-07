import { TestBed } from '@angular/core/testing';
import { FriendsPanelComponent } from './friends-panel/friends-panel.component';
import { MatchInvitationsPanelComponent } from './match-invitations-panel/match-invitations-panel.component';
import { TeamsPanelComponent } from './teams-panel/teams-panel.component';

describe('Social action names', () => {
  const request = { id: 1, type: 'FRIENDSHIP' as const, status: 'PENDIENTE' as const,
    requesterUuid: 'a', requesterAlias: 'Ana', targetUuid: 'b', targetAlias: 'Beto', teamId: 7, teamName: 'Azules', matchId: 42 };

  it('identifies whose friendship request is being answered', () => {
    const fixture = TestBed.createComponent(FriendsPanelComponent);
    fixture.componentInstance.pendingRequests = [request];
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button').getAttribute('aria-label')).toBe('Aceptar solicitud de Ana');
  });

  it('identifies the match and inviter when answering', () => {
    const fixture = TestBed.createComponent(MatchInvitationsPanelComponent);
    fixture.componentInstance.pendingInvites = [request];
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button').getAttribute('aria-label')).toBe('Aceptar invitación al partido 42 de Ana');
  });

  it('identifies the team when managing or answering invitations', () => {
    const fixture = TestBed.createComponent(TeamsPanelComponent);
    fixture.componentInstance.createdTeams = [{ id: 7, nombre: 'Azules' }];
    fixture.componentInstance.pendingInvites = [request];
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[aria-label="Administrar Azules"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Aceptar invitación a Azules"]')).not.toBeNull();
  });
});
