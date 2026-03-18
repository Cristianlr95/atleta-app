import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MetallicButtonComponent } from 'src/app/shared/ui/metallic-button/metallic-button.component';

@Component({
  selector: 'app-player-vote-card',
  standalone: true,
  imports: [CommonModule, MetallicButtonComponent],
  templateUrl: './player-vote-card.component.html',
  styleUrls: ['./player-vote-card.component.scss'],
})
export class PlayerVoteCardComponent {
  @Input({ required: true }) userId = '';
  @Input({ required: true }) name = 'Jugador';
  @Input() teamLabel = 'Equipo';
  @Input() accent = '#4a84d8';
  @Input() selected = false;
  @Input() disabled = false;

  @Output() vote = new EventEmitter<string>();

  onVote(): void {
    this.vote.emit(this.userId);
  }
}
