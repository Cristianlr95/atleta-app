import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

export interface XpRewardItem {
  id: string;
  playerName: string;
  position: string;
  xp: number;
  currentOvr?: number | null;
}

@Component({
  selector: 'app-xp-reward-card',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './xp-reward-card.component.html',
  styleUrls: ['./xp-reward-card.component.scss'],
})
export class XpRewardCardComponent {
  @Input() rewards: XpRewardItem[] = [];

  trackByRewardId(_index: number, item: XpRewardItem): string {
    return item.id;
  }
}
