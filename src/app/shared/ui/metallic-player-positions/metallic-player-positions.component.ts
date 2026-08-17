import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface PlayerPositionDisplay {
  name: string;
  priorityLabel: string;
}

@Component({
  selector: 'app-metallic-player-positions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metallic-player-positions.component.html',
  styleUrls: ['./metallic-player-positions.component.scss'],
})
export class MetallicPlayerPositionsComponent {
  @Input() positions: ReadonlyArray<PlayerPositionDisplay> = [];

  readonly itemIconAsset = 'assets/icons/atleta-raster-v1/ic_match_lineup_96.png';
}
