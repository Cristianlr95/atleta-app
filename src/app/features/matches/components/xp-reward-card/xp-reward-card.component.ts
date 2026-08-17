import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

export interface XpRewardItem {
  id: string;
  playerName: string;
  position: string;
  xp: number;
  currentOvr?: number | null;
  fromLevel: number;
  toLevel: number;
  progressPercent: number;
}

@Component({
  selector: 'app-xp-reward-card',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './xp-reward-card.component.html',
  styleUrls: ['./xp-reward-card.component.scss'],
})
export class XpRewardCardComponent {
  readonly levelUpIconAsset = 'assets/icons/atleta-raster-v1/ic_comp_level_up_96.png';
  @Input() rewards: XpRewardItem[] = [];

  trackByRewardId(_index: number, item: XpRewardItem): string {
    return item.id;
  }
}
