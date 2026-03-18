import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-metallic-form-section',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './metallic-form-section.component.html',
  styleUrls: ['./metallic-form-section.component.scss'],
})
export class MetallicFormSectionComponent {
  @Input() title = '';
  @Input() titleIconAsset?: string;
  @Input() description?: string;
  @Input() descriptionSize: 'default' | 'small' = 'default';
}
