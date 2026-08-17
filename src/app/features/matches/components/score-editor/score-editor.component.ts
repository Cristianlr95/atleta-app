import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-score-editor',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './score-editor.component.html',
  styleUrls: ['./score-editor.component.scss'],
})
export class ScoreEditorComponent {
  readonly addIconAsset = 'assets/icons/atleta-raster-v1/ic_action_add_96.png';
  readonly removeIconAsset = 'assets/icons/atleta-raster-v1/ic_action_remove_96.png';
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

