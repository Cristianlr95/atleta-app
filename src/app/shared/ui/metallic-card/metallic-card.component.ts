import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';


@Component({
  selector: 'app-metallic-card',
  standalone: true,
  templateUrl: './metallic-card.component.html',
  imports: [CommonModule, IonIcon],
  styleUrls: ['./metallic-card.component.scss']
})
export class MetallicCardComponent {
  @Input() title?: string;
  @Input() titleIconAsset?: string;
}
