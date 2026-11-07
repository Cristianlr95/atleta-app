import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SocialPlayerLookupItem } from 'src/app/features/social/models/social.models';
import { TeamActiveMember, TeamSummary } from 'src/app/features/teams/models/team.models';

@Component({
  selector: 'app-profile-teams',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-teams.component.html',
  styleUrls: ['./profile-teams.component.scss'],
})
export class ProfileTeamsComponent {
  @Input() teams: TeamSummary[] = [];
  @Input() currentPlayerUuid: string | null = null;
  @Input() expandedTeamId: number | null = null;
  @Input() teamMembers: Array<TeamActiveMember & { ovr: number | null }> = [];
  @Input() teamMembersLoading = false;
  @Input() teamMembersError: string | null = null;
  @Input() inviteQuery = '';
  @Input() inviteLoading = false;
  @Input() inviteCandidates: SocialPlayerLookupItem[] = [];
  @Input() inviteSendingUuid: string | null = null;

  @Output() teamToggle = new EventEmitter<number>();
  @Output() remove = new EventEmitter<TeamSummary>();
  @Output() queryChange = new EventEmitter<string>();
  @Output() invite = new EventEmitter<string>();

  isTeamCreator(team: TeamSummary): boolean {
    return !!this.currentPlayerUuid && (team.creadorUuid === this.currentPlayerUuid || team.creador?.atletaUuid === this.currentPlayerUuid);
  }

  isTeamExpanded(teamId: number): boolean { return this.expandedTeamId === teamId; }
  memberRoleLabel(role: TeamActiveMember['rol']): string { return role === 'CAPITAN' ? 'Capitan' : role === 'DT' ? 'DT' : 'Jugador'; }
  memberOvrLabel(ovr: number | null): string { return ovr === null ? 'OVR N/D' : `OVR ${Math.round(ovr)}`; }
}
