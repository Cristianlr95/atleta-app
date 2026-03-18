import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';

export interface PlayerPositionDisplay {
  name: string;
  priorityLabel: string;
}

@Component({
  selector: 'app-metallic-player-positions',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './metallic-player-positions.component.html',
  styleUrls: ['./metallic-player-positions.component.scss'],
})
export class MetallicPlayerPositionsComponent {
  @Input() positions: ReadonlyArray<PlayerPositionDisplay> = [];

  readonly itemIconAsset = 'assets/icons/atleta/ic_match_lineup_24.svg';
}
