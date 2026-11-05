import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { PlayerAchievement } from '../../../models/user.models';

@Component({
  selector: 'app-profile-achievements',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-achievements.component.html',
  styleUrls: ['./profile-achievements.component.scss'],
})
export class ProfileAchievementsComponent {
  @Input() achievements: PlayerAchievement[] = [];
  private readonly iconBase = 'assets/icons/atleta-raster-v1';

  achievementIconAsset(code: PlayerAchievement['code']): string {
    const icons: Record<PlayerAchievement['code'], string> = {
      TOP_SCORER: 'ic_comp_goal_contribution_96.png', TOP_ASSIST: 'ic_event_assist_96.png',
      MATCH_VETERAN: 'ic_comp_stats_96.png', MATCH_CREATOR: 'ic_match_create_96.png', MATCH_WINNER: 'ic_result_win_96.png',
    };
    return `${this.iconBase}/${icons[code]}`;
  }

  achievementTierLabel(achievement: PlayerAchievement): string {
    if (achievement.tier === 'GOLD') return 'Oro';
    if (achievement.tier === 'SILVER') return 'Plata';
    if (achievement.tier === 'BRONZE') return 'Bronce';
    return `Próximo: ${achievement.nextThreshold}`;
  }
}
