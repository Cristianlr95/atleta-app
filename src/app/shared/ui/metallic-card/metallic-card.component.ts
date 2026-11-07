import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-metallic-card',
  standalone: true,
  templateUrl: './metallic-card.component.html',
  imports: [CommonModule],
  styleUrls: ['./metallic-card.component.scss']
})
export class MetallicCardComponent {
  @Input() title?: string;
  @Input() titleIconAsset?: string;
}
