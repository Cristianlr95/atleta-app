import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export type ParticipantSegment = 'CONFIRMED' | 'PENDING' | 'DECLINED';

@Component({
  selector: 'app-participant-segment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './participant-segment.component.html',
  styleUrls: ['./participant-segment.component.scss'],
})
export class ParticipantSegmentComponent {
  @Input() selected: ParticipantSegment = 'CONFIRMED';
  @Input() confirmedCount = 0;
  @Input() pendingCount = 0;
  @Input() declinedCount = 0;
  @Output() selectedChange = new EventEmitter<ParticipantSegment>();

  readonly options: Array<{ id: ParticipantSegment; label: string; count: () => number }> = [
    { id: 'CONFIRMED', label: 'Confirmados', count: () => this.confirmedCount },
    { id: 'PENDING', label: 'Pendientes', count: () => this.pendingCount },
    { id: 'DECLINED', label: 'Rechazaron', count: () => this.declinedCount },
  ];
}
