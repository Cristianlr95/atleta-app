import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { MetallicCardComponent } from 'src/app/shared/ui/metallic-card/metallic-card.component';
import { PageNavComponent } from 'src/app/shared/ui/page-nav/page-nav.component';

@Component({
  selector: 'app-stats-page',
  standalone: true,
  imports: [CommonModule, IonicModule, MetallicCardComponent, PageNavComponent],
  templateUrl: './stats.page.html',
  styleUrls: ['./stats.page.scss'],
})
export class StatsPage {
  readonly titleIconAsset = 'assets/icons/atleta/ic_comp_stats_24.svg';
}
