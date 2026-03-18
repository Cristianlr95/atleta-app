import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

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
  imports: [CommonModule],
  templateUrl: './xp-reward-card.component.html',
  styleUrls: ['./xp-reward-card.component.scss'],
})
export class XpRewardCardComponent {
  @Input() rewards: XpRewardItem[] = [];

  trackByRewardId(_index: number, item: XpRewardItem): string {
    return item.id;
  }
}
