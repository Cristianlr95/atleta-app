import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { MatchStatusBadgeComponent } from 'src/app/features/matches/components/match-status-badge/match-status-badge.component';
import { MatchStatus } from 'src/app/features/matches/models/progressive-match.models';
import { ActivityActionType, ActivityItem, ActivityType } from '../../models/activity.models';

@Component({
  selector: 'app-activity-card',
  standalone: true,
  imports: [CommonModule, IonicModule, MatchStatusBadgeComponent],
  templateUrl: './activity-card.component.html',
  styleUrls: ['./activity-card.component.scss'],
})
export class ActivityCardComponent {
  private readonly iconBase = 'assets/icons/atleta';

  @Input({ required: true }) item!: ActivityItem;
  @Output() actionSelected = new EventEmitter<{ activityId: string; action: ActivityActionType }>();
  @Output() openContext = new EventEmitter<ActivityItem>();

  readonly friendIconAsset = `${this.iconBase}/ic_match_invite_24.svg`;
  readonly teamIconAsset = `${this.iconBase}/ic_match_teams_24.svg`;
  readonly matchIconAsset = `${this.iconBase}/ic_nav_matches_24.svg`;
  readonly trophyIconAsset = `${this.iconBase}/ic_comp_trophy_24.svg`;
  readonly statsIconAsset = `${this.iconBase}/ic_comp_stats_24.svg`;

  get iconAsset(): string {
    if (this.item.type.includes('FRIEND')) {
      return this.friendIconAsset;
    }
    if (this.item.type.includes('TEAM')) {
      return this.teamIconAsset;
    }
    if (this.item.type.includes('MATCH')) {
      return this.matchIconAsset;
    }
    if (this.item.type.includes('RANKING') || this.item.type.includes('MVP')) {
      return this.trophyIconAsset;
    }
    return this.statsIconAsset;
  }

  get relativeTime(): string {
    const diffMs = Math.max(0, Date.now() - new Date(this.item.createdAt).getTime());
    const min = Math.floor(diffMs / 60000);
    if (min < 1) {
      return 'Ahora';
    }
    if (min < 60) {
      return `Hace ${min} min`;
    }
    const hrs = Math.floor(min / 60);
    if (hrs < 24) {
      return `Hace ${hrs} h`;
    }
    const days = Math.floor(hrs / 24);
    return `Hace ${days} d`;
  }

  get matchStatus(): MatchStatus | null {
    if (this.item.type === ActivityType.MATCH_CONFIRMED) {
      if (this.item.title.toLowerCase().includes('en juego')) {
        return MatchStatus.LIVE;
      }
      return MatchStatus.CONFIRMED;
    }
    if (this.item.type === ActivityType.MATCH_ALMOST_READY || this.item.type === ActivityType.MATCH_INVITE_ACCEPTED) {
      return MatchStatus.PARTIAL_CONFIRMATIONS;
    }
    if (this.item.type === ActivityType.MATCH_INVITE_RECEIVED) {
      return MatchStatus.CREATED;
    }
    if (this.item.type === ActivityType.MATCH_FINISHED) {
      return MatchStatus.FINISHED;
    }
    return null;
  }

  onAction(action: ActivityActionType): void {
    this.actionSelected.emit({ activityId: this.item.id, action });
  }

  onOpen(): void {
    this.openContext.emit(this.item);
  }
}
