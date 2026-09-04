import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

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
  imports: [CommonModule],
  templateUrl: './metallic-bottom-nav.component.html',
  styleUrls: ['./metallic-bottom-nav.component.scss'],
})
export class MetallicBottomNavComponent {
  private readonly defaultIconAsset = 'assets/icons/atleta-raster-v1/ic_nav_matches_96.png';
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

  formatBadgeCount(count: number | undefined): string {
    const normalized = Math.max(0, Math.floor(count ?? 0));
    return normalized > 9 ? '9+' : String(normalized);
  }

  badgeAriaLabel(item: MetallicBottomNavItem): string {
    const count = Math.max(0, Math.floor(item.badgeCount ?? 0));
    if (item.id === 'matches') {
      return `${count} invitaciones pendientes de respuesta`;
    }

    return `${count} notificaciones pendientes`;
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
