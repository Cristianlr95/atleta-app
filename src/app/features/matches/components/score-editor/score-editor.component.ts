import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-score-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './score-editor.component.html',
  styleUrls: ['./score-editor.component.scss'],
})
export class ScoreEditorComponent {
  @Input({ required: true }) homeScore = 0;
  @Input({ required: true }) awayScore = 0;
  @Input() homeLabel = 'Local';
  @Input() awayLabel = 'Visita';

  @Output() homeScoreChange = new EventEmitter<number>();
  @Output() awayScoreChange = new EventEmitter<number>();

  incrementHome(): void { this.homeScoreChange.emit(this.homeScore + 1); }
  decrementHome(): void { this.homeScoreChange.emit(Math.max(0, this.homeScore - 1)); }
  incrementAway(): void { this.awayScoreChange.emit(this.awayScore + 1); }
  decrementAway(): void { this.awayScoreChange.emit(Math.max(0, this.awayScore - 1)); }
}

