import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MetallicButtonComponent } from 'src/app/shared/ui/metallic-button/metallic-button.component';
import { MetallicProgressComponent } from 'src/app/shared/ui/metallic-progress/metallic-progress.component';
import { Match, MatchProgressView, MatchStatus } from '../../models/progressive-match.models';

@Component({
  selector: 'app-match-confirmation-progress',
  standalone: true,
  imports: [CommonModule, MetallicProgressComponent, MetallicButtonComponent],
  templateUrl: './match-confirmation-progress.component.html',
  styleUrls: ['./match-confirmation-progress.component.scss'],
})
export class MatchConfirmationProgressComponent {
  @Input({ required: true }) match!: Match;
  @Input({ required: true }) progress!: MatchProgressView;
  @Input() isCreator = false;
  @Output() remindPending = new EventEmitter<void>();
  @Output() inviteMore = new EventEmitter<void>();

  get statusMessage(): string {
    if (this.match.status === MatchStatus.CREATED) {
      return 'Invitaciones enviadas';
    }
    if (this.match.status === MatchStatus.PARTIAL_CONFIRMATIONS) {
      return `Faltan ${this.progress.missing} jugadores`;
    }
    if (this.match.status === MatchStatus.CONFIRMED) {
      return 'Partido confirmado';
    }
    if (this.match.status === MatchStatus.LIVE) {
      return this.match.closePending ? 'Partido terminado. Falta cargar goles y cerrar.' : 'El partido ya esta en juego';
    }
    return this.progress.statusMessage;
  }
}
