import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TeamSummary } from 'src/app/features/teams/models/team.models';
import { MetallicInputComponent } from 'src/app/shared/ui/metallic-input/metallic-input.component';
import { MetallicSelectComponent, MetallicSelectOption } from 'src/app/shared/ui/metallic-select/metallic-select.component';
import { SocialPlayerLookupItem, SocialRequestItem } from '../../models/social.models';

@Component({
  selector: 'app-teams-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MetallicInputComponent, MetallicSelectComponent],
  templateUrl: './teams-panel.component.html',
  styleUrls: ['./teams-panel.component.scss'],
})
export class TeamsPanelComponent {
  @Input() principalTeam: TeamSummary | null = null;
  @Input() createdTeams: TeamSummary[] = [];
  @Input() pendingInvites: SocialRequestItem[] = [];
  @Input() inviteCandidates: SocialPlayerLookupItem[] = [];

  @Output() openTeam = new EventEmitter<number>();
  @Output() deleteTeam = new EventEmitter<number>();
  @Output() respondInvite = new EventEmitter<{ inviteId: number; accept: boolean }>();
  @Output() searchInviteCandidate = new EventEmitter<string>();
  @Output() sendInvite = new EventEmitter<{ teamId: number; targetUuid: string }>();

  inviteTeamId = '';
  inviteQuery = '';

  get teamOptions(): MetallicSelectOption[] {
    return this.createdTeams.map((team) => ({ label: team.nombre, value: String(team.id) }));
  }

  get canInvitePlayers(): boolean {
    return this.teamOptions.length > 0 && this.inviteTeamId.trim().length > 0 && Number.isFinite(Number(this.inviteTeamId));
  }

  onSendInvite(targetUuid: string): void {
    if (!this.canInvitePlayers) {
      return;
    }
    this.sendInvite.emit({ teamId: Number(this.inviteTeamId), targetUuid });
  }

  onPickTeamForInvite(team: TeamSummary): void {
    this.inviteTeamId = String(team.id);
  }

  onDeleteTeam(team: TeamSummary): void {
    const confirmed = window.confirm(`Eliminar el equipo "${team.nombre}"? Esta accion no se puede deshacer.`);
    if (!confirmed) {
      return;
    }
    this.deleteTeam.emit(team.id);
  }
}
