import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MetallicInputComponent } from 'src/app/shared/ui/metallic-input/metallic-input.component';
import { SocialPlayerLookupItem, SocialRequestItem } from '../../models/social.models';

@Component({
  selector: 'app-friends-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MetallicInputComponent],
  templateUrl: './friends-panel.component.html',
  styleUrls: ['./friends-panel.component.scss'],
})
export class FriendsPanelComponent {
  @Input() pendingRequests: SocialRequestItem[] = [];
  @Input() acceptedFriendships: SocialRequestItem[] = [];
  @Input() candidates: SocialPlayerLookupItem[] = [];
  @Input() loadingSearch = false;
  @Input() currentPlayerUuid: string | null = null;

  @Output() searchChange = new EventEmitter<string>();
  @Output() sendRequest = new EventEmitter<string>();
  @Output() respondRequest = new EventEmitter<{ requestId: number; accept: boolean }>();
  @Output() openProfile = new EventEmitter<string>();

  query = '';

  onSearchQueryChange(value: string): void {
    this.query = value;
    this.searchChange.emit(value);
  }

  formatCandidate(candidate: SocialPlayerLookupItem): string {
    if (candidate.alias && candidate.athleteName) {
      return `${candidate.alias} (${candidate.athleteName})`;
    }
    return candidate.alias || candidate.athleteName || candidate.atletaUuid;
  }

  getFriendProfileUuid(item: SocialRequestItem): string {
    if (item.requesterUuid === this.currentPlayerUuid && item.targetUuid) {
      return item.targetUuid;
    }

    return item.requesterUuid;
  }
}
