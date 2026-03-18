import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonLabel } from "@ionic/angular/standalone";

@Component({
  selector: 'app-metallic-progress',
  standalone: true,
  templateUrl: './metallic-progress.component.html',
  styleUrls: ['./metallic-progress.component.scss'],
  imports: [CommonModule, IonLabel]
})
export class MetallicProgressComponent {
  @Input() value: number = 0;
  @Input() max: number = 100;
  @Input() label?: string;
  @Input() showValue: boolean = true;
  @Input() color: string = 'primary';
  
  get percentage(): number {
    return Math.min((this.value / this.max) * 100, 100);
  }
  
  get normalizedValue(): number {
    return this.value / this.max;
  }
}
