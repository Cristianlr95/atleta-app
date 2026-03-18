import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Player } from '../../models/progressive-match.models';

@Component({
  selector: 'app-team-builder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team-builder.component.html',
  styleUrls: ['./team-builder.component.scss'],
})
export class TeamBuilderComponent implements OnChanges {
  @Input() players: Player[] = [];
  @Input() enabled = false;

  @Output() teamsChange = new EventEmitter<{ home: Player[]; away: Player[] }>();

  mode: 'AUTO' | 'MANUAL' = 'AUTO';
  homePlayers: Player[] = [];
  awayPlayers: Player[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['players']) {
      this.generateAutoTeams();
    }
  }

  setMode(mode: 'AUTO' | 'MANUAL'): void {
    this.mode = mode;
    if (mode === 'AUTO') {
      this.generateAutoTeams();
    }
  }

  generateAutoTeams(): void {
    const shuffled = [...this.players].sort(() => Math.random() - 0.5);
    const home: Player[] = [];
    const away: Player[] = [];

    shuffled.forEach((player, index) => {
      if (index % 2 === 0) {
        home.push(player);
      } else {
        away.push(player);
      }
    });

    this.homePlayers = home;
    this.awayPlayers = away;
    this.emitTeams();
  }

  onDrop(side: 'HOME' | 'AWAY', event: DragEvent): void {
    if (!this.enabled || this.mode !== 'MANUAL') {
      return;
    }

    event.preventDefault();
    const playerUuid = event.dataTransfer?.getData('text/player-uuid');
    if (!playerUuid) {
      return;
    }

    this.movePlayer(playerUuid, side);
  }

  onDragOver(event: DragEvent): void {
    if (!this.enabled || this.mode !== 'MANUAL') {
      return;
    }

    event.preventDefault();
  }

  onDragStart(playerUuid: string, event: DragEvent): void {
    if (!event.dataTransfer) {
      return;
    }

    event.dataTransfer.setData('text/player-uuid', playerUuid);
    event.dataTransfer.effectAllowed = 'move';
  }

  movePlayer(playerUuid: string, side: 'HOME' | 'AWAY'): void {
    const source = [...this.homePlayers, ...this.awayPlayers].find((player) => player.uuid === playerUuid);
    if (!source) {
      return;
    }

    this.homePlayers = this.homePlayers.filter((player) => player.uuid !== playerUuid);
    this.awayPlayers = this.awayPlayers.filter((player) => player.uuid !== playerUuid);

    if (side === 'HOME') {
      this.homePlayers = [...this.homePlayers, source];
    } else {
      this.awayPlayers = [...this.awayPlayers, source];
    }

    this.emitTeams();
  }

  private emitTeams(): void {
    this.teamsChange.emit({ home: this.homePlayers, away: this.awayPlayers });
  }
}

