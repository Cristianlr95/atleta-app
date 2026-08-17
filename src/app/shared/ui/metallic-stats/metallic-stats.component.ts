import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { AlertController, IonicModule } from '@ionic/angular';

export interface Stat {
  label: string;
  value: string | number;
  icon?: string;
  valueClass?: string;
  description?: string;
}

@Component({
  selector: 'app-metallic-stats',
  standalone: true,
  templateUrl: './metallic-stats.component.html',
  styleUrls: ['./metallic-stats.component.scss'],
  imports: [CommonModule, IonicModule],
})
export class MetallicStatsComponent {
  private readonly alertController = inject(AlertController);
  private readonly iconBase = 'assets/icons/atleta-raster-v1';
  private readonly iconMap: Record<string, string> = {
    overall: `${this.iconBase}/ic_comp_overall_96.png`,
    'best-role': `${this.iconBase}/ic_comp_best_role_96.png`,
    matches: `${this.iconBase}/ic_nav_matches_96.png`,
    versatility: `${this.iconBase}/ic_comp_versatility_96.png`,
    effectiveness: `${this.iconBase}/ic_comp_effectiveness_96.png`,
    'goal-contribution': `${this.iconBase}/ic_comp_goal_contribution_96.png`,
    win: `${this.iconBase}/ic_result_win_96.png`,
    draw: `${this.iconBase}/ic_result_draw_96.png`,
    loss: `${this.iconBase}/ic_result_loss_96.png`,
    trophy: `${this.iconBase}/ic_comp_trophy_96.png`,
    streak: `${this.iconBase}/ic_comp_streak_96.png`,
    stats: `${this.iconBase}/ic_comp_stats_96.png`,
  };

  @Input() stats: Stat[] = [];
  @Input() compact = false;

  resolveIconAsset(icon?: string): string | null {
    if (!icon) {
      return null;
    }
    return this.iconMap[icon] ?? `${this.iconBase}/ic_comp_stats_96.png`;
  }

  async showStatDescription(stat: Stat): Promise<void> {
    if (!stat.description) {
      return;
    }

    const alert = await this.alertController.create({
      header: stat.label,
      message: stat.description,
      buttons: ['Entendido'],
    });

    await alert.present();
  }
}
