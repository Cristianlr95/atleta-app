import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-mvp-countdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mvp-countdown.component.html',
  styleUrls: ['./mvp-countdown.component.scss'],
})
export class MvpCountdownComponent {
  @Input() isOpen = false;
  @Input() remainingLabel = '00:00:00';
}
