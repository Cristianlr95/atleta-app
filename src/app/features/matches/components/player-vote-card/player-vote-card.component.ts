import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { MetallicButtonComponent } from 'src/app/shared/ui/metallic-button/metallic-button.component';

@Component({
  selector: 'app-player-vote-card',
  standalone: true,
  imports: [CommonModule, IonicModule, MetallicButtonComponent],
  templateUrl: './player-vote-card.component.html',
  styleUrls: ['./player-vote-card.component.scss'],
})
export class PlayerVoteCardComponent {
  readonly confirmedIconAsset = 'assets/icons/atleta-raster-v1/ic_status_confirmed_96.png';
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
