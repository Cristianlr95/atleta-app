import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonicModule } from '@ionic/angular';

export type MatchCloseEventType = 'GOL' | 'ASISTENCIA';

export interface MatchCloseEventItem {
  id: string;
  type: MatchCloseEventType;
  playerName: string;
  assistName?: string;
  teamLabel: string;
  persisted?: boolean;
}

@Component({
  selector: 'app-match-events-list',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './match-events-list.component.html',
  styleUrls: ['./match-events-list.component.scss'],
})
export class MatchEventsListComponent {
  @Input() events: MatchCloseEventItem[] = [];

  @Output() addEvent = new EventEmitter<void>();
  @Output() editEvent = new EventEmitter<string>();
  @Output() removeEvent = new EventEmitter<string>();

  iconFor(type: MatchCloseEventType): string {
    return type === 'GOL' ? '⚽' : '🎯';
  }

  titleFor(event: MatchCloseEventItem): string {
    if (event.type === 'ASISTENCIA') {
      return `Asistencia - ${event.playerName}`;
    }
    return event.assistName
      ? `Gol - ${event.playerName} (Asist: ${event.assistName})`
      : `Gol - ${event.playerName}`;
  }

  trackByEventId(_index: number, item: MatchCloseEventItem): string {
    return item.id;
  }
}
