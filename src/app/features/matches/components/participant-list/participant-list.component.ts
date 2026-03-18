import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatchParticipant } from '../../models/progressive-match.models';

@Component({
  selector: 'app-participant-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './participant-list.component.html',
  styleUrls: ['./participant-list.component.scss'],
})
export class ParticipantListComponent {
  @Input() participants: MatchParticipant[] = [];
  @Input() emptyMessage = 'No hay jugadores para mostrar.';

  trackByUserId = (_: number, item: MatchParticipant): string => item.userId;
}
