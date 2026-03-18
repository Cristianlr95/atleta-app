import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SocialTabId } from '../../services/social-facade.service';

interface SocialTabItem {
  id: SocialTabId;
  label: string;
  badge?: number;
}

@Component({
  selector: 'app-social-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './social-tabs.component.html',
  styleUrls: ['./social-tabs.component.scss'],
})
export class SocialTabsComponent {
  @Input() activeTab: SocialTabId = 'activity';
  @Input() pendingFriends = 0;
  @Input() pendingTeams = 0;
  @Input() pendingMatches = 0;
  @Input() unreadActivity = 0;
  @Output() tabChange = new EventEmitter<SocialTabId>();

  get tabs(): SocialTabItem[] {
    return [
      { id: 'activity', label: 'Actividad', badge: this.unreadActivity },
      { id: 'friends', label: 'Amigos', badge: this.pendingFriends },
      { id: 'teams', label: 'Equipos', badge: this.pendingTeams },
      { id: 'matches', label: 'Partidos', badge: this.pendingMatches },
    ];
  }

  onSelect(tabId: SocialTabId): void {
    this.tabChange.emit(tabId);
  }
}
