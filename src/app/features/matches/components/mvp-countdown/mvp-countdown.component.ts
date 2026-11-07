import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-mvp-countdown',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './mvp-countdown.component.html',
  styleUrls: ['./mvp-countdown.component.scss'],
})
export class MvpCountdownComponent {
  readonly timeIconAsset = 'assets/icons/atleta-raster-v1/ic_match_time_96.png';
  readonly closedIconAsset = 'assets/icons/atleta-raster-v1/ic_status_rejected_96.png';
  @Input() isOpen = false;
  @Input() remainingLabel = '00:00:00';
}
