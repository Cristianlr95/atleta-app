import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SocialPlayerLookupItem } from 'src/app/features/social/models/social.models';
import { TeamActiveMember, TeamSummary, teamMemberRoleLabel } from 'src/app/features/teams/models/team.models';

@Component({
  selector: 'app-profile-teams',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-teams.component.html',
  styleUrls: ['./profile-teams.component.scss'],
})
export class ProfileTeamsComponent {
  @Input() teams: TeamSummary[] = [];
  @Input() inviteTeamIds: number[] = [];
  @Input() expandedTeamId: number | null = null;
  @Input() teamMembers: Array<TeamActiveMember & { ovr: number | null }> = [];
  @Input() teamMembersLoading = false;
  @Input() teamMembersError: string | null = null;
  @Input() inviteQuery = '';
  @Input() inviteLoading = false;
  @Input() inviteCandidates: SocialPlayerLookupItem[] = [];
  @Input() inviteSendingUuid: string | null = null;

  @Output() viewTeam = new EventEmitter<number>();
  @Output() teamToggle = new EventEmitter<number>();
  @Output() queryChange = new EventEmitter<string>();
  @Output() invite = new EventEmitter<string>();

  isTeamExpanded(teamId: number): boolean { return this.expandedTeamId === teamId; }
  canManageInvites(teamId: number): boolean { return this.inviteTeamIds.includes(teamId); }
  readonly memberRoleLabel = teamMemberRoleLabel;
  memberOvrLabel(ovr: number | null): string { return ovr === null ? 'OVR N/D' : `OVR ${Math.round(ovr)}`; }
}
