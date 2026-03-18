import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';

export interface MetallicBottomNavItem {
  id: string;
  label: string;
  icon?: string;
  iconAsset?: string;
  active?: boolean;
  variant?: 'default' | 'cta';
  badgeCount?: number;
}

@Component({
  selector: 'app-metallic-bottom-nav',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './metallic-bottom-nav.component.html',
  styleUrls: ['./metallic-bottom-nav.component.scss'],
})
export class MetallicBottomNavComponent {
  private readonly defaultIconAsset = 'assets/icons/atleta/ic_nav_matches_24.svg';
  @Input() items: ReadonlyArray<MetallicBottomNavItem> = [];
  @Output() itemSelected = new EventEmitter<string>();
  private lastTapAt = 0;
  private readonly tapCooldownMs = 400;

  resolveIconAsset(item: MetallicBottomNavItem): string {
    if (item.iconAsset?.trim()) {
      return item.iconAsset;
    }
    if (item.icon?.startsWith('assets/')) {
      return item.icon;
    }
    return this.defaultIconAsset;
  }

  onSelect(itemId: string): void {
    const item = this.items.find((entry) => entry.id === itemId);
    if (item?.active) {
      return;
    }

    const now = Date.now();
    if (now - this.lastTapAt < this.tapCooldownMs) {
      return;
    }
    this.lastTapAt = now;
    this.itemSelected.emit(itemId);
  }
}
