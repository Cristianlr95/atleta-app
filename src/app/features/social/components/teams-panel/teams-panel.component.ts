import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TeamSummary } from 'src/app/features/teams/models/team.models';
import { MetallicInputComponent } from 'src/app/shared/ui/metallic-input/metallic-input.component';
import { MetallicSelectComponent, MetallicSelectOption } from 'src/app/shared/ui/metallic-select/metallic-select.component';
import { SocialPlayerLookupItem, SocialRequestItem } from '../../models/social.models';

@Component({
  selector: 'app-teams-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, MetallicInputComponent, MetallicSelectComponent],
  templateUrl: './teams-panel.component.html',
  styleUrls: ['./teams-panel.component.scss'],
})
export class TeamsPanelComponent {
  @Input() principalTeam: TeamSummary | null = null;
  @Input() otherTeams: TeamSummary[] = [];
  @Input() inviteTeams: TeamSummary[] = [];
  @Input() pendingInvites: SocialRequestItem[] = [];
  @Input() inviteCandidates: SocialPlayerLookupItem[] = [];

  @Output() openTeam = new EventEmitter<number>();
  @Output() respondInvite = new EventEmitter<{ inviteId: number; accept: boolean }>();
  @Output() searchInviteCandidate = new EventEmitter<string>();
  @Output() sendInvite = new EventEmitter<{ teamId: number; targetUuid: string }>();

  inviteTeamId = '';
  inviteQuery = '';

  get teamOptions(): MetallicSelectOption[] {
    return this.inviteTeams.map((team) => ({ label: team.nombre, value: String(team.id) }));
  }

  get canInvitePlayers(): boolean {
    return this.inviteTeams.some(team => String(team.id) === this.inviteTeamId);
  }

  canInviteTo(teamId: number): boolean {
    return this.inviteTeams.some(team => team.id === teamId);
  }

  onSendInvite(targetUuid: string): void {
    if (!this.canInvitePlayers) {
      return;
    }
    this.sendInvite.emit({ teamId: Number(this.inviteTeamId), targetUuid });
  }

  onPickTeamForInvite(team: TeamSummary): void {
    if (!this.canInviteTo(team.id)) return;
    this.inviteTeamId = String(team.id);
  }
}
