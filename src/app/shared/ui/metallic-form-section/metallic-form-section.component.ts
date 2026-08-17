import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-metallic-form-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metallic-form-section.component.html',
  styleUrls: ['./metallic-form-section.component.scss'],
})
export class MetallicFormSectionComponent {
  @Input() title = '';
  @Input() titleIconAsset?: string;
  @Input() description?: string;
  @Input() descriptionSize: 'default' | 'small' = 'default';
}
