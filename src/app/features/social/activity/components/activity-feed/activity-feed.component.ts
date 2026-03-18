import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MetallicButtonComponent } from 'src/app/shared/ui/metallic-button/metallic-button.component';
import { ActivityActionType, ActivityItem } from '../../models/activity.models';
import { ActivityCardComponent } from '../activity-card/activity-card.component';

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [CommonModule, MetallicButtonComponent, ActivityCardComponent],
  templateUrl: './activity-feed.component.html',
  styleUrls: ['./activity-feed.component.scss'],
})
export class ActivityFeedComponent {
  @Input() loading = false;
  @Input() items: ActivityItem[] = [];
  @Input() unreadCount = 0;
  @Output() markAllRead = new EventEmitter<void>();
  @Output() actionSelected = new EventEmitter<{ activityId: string; action: ActivityActionType }>();
  @Output() openContext = new EventEmitter<ActivityItem>();
}
