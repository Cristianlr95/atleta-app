import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
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
  private readonly iconBase = 'assets/icons/atleta';
  private readonly iconMap: Record<string, string> = {
    'trophy-outline': `${this.iconBase}/ic_comp_trophy_24.svg`,
    'star-outline': `${this.iconBase}/ic_comp_level_24.svg`,
    'football-outline': `${this.iconBase}/ic_nav_matches_24.svg`,
    'stats-chart-outline': `${this.iconBase}/ic_comp_stats_24.svg`,
  };

  @Input() stats: Stat[] = [];
  @Input() compact = false;

  constructor(private readonly alertController: AlertController) {}

  resolveIconAsset(icon?: string): string | null {
    if (!icon) {
      return null;
    }
    return this.iconMap[icon] ?? `${this.iconBase}/ic_comp_stats_24.svg`;
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
