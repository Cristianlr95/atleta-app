import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metallic-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metallic-button.component.html',
  styleUrls: ['./metallic-button.component.scss']

})
export class MetallicButtonComponent  {
  @Input() variant: 'primary' | 'secondary' | 'accent' = 'primary';
  @Input() disabled: boolean = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
}
