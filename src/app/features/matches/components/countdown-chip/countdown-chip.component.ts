import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, signal } from '@angular/core';

@Component({
  selector: 'app-countdown-chip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './countdown-chip.component.html',
  styleUrls: ['./countdown-chip.component.scss'],
})
export class CountdownChipComponent implements OnInit, OnDestroy {
  @Input() scheduledAt = '';

  readonly label = signal('Sin fecha');
  private timerId?: number;

  ngOnInit(): void {
    this.updateLabel();
    this.timerId = window.setInterval(() => this.updateLabel(), 1000);
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      window.clearInterval(this.timerId);
    }
  }

  private updateLabel(): void {
    if (!this.scheduledAt) {
      this.label.set('Sin fecha');
      return;
    }
    const diff = new Date(this.scheduledAt).getTime() - Date.now();
    if (diff <= 0) {
      this.label.set('Inicia pronto');
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (days > 0) {
      this.label.set(`En ${days}d ${hours}h`);
      return;
    }
    this.label.set(`En ${hours}h ${minutes}m`);
  }
}
