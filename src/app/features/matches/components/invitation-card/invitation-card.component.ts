import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Invitation, Match } from '../../models/progressive-match.models';
import { MatchStatusBadgeComponent } from '../match-status-badge/match-status-badge.component';

@Component({
  selector: 'app-invitation-card',
  standalone: true,
  imports: [CommonModule, MatchStatusBadgeComponent],
  templateUrl: './invitation-card.component.html',
  styleUrls: ['./invitation-card.component.scss'],
})
export class InvitationCardComponent {
  @Input({ required: true }) invitation!: Invitation;
  @Input() match: Match | null = null;
  @Input() venueLabel: string | null = null;
  @Input() disabled = false;

  @Output() accepted = new EventEmitter<string>();
  @Output() declined = new EventEmitter<string>();

  onAccept(): void {
    this.accepted.emit(this.invitation.id);
  }

  onDecline(): void {
    this.declined.emit(this.invitation.id);
  }
}

