import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { MetallicButtonComponent } from 'src/app/shared/ui/metallic-button/metallic-button.component';
import { Player } from '../../models/progressive-match.models';
import { buildBalancedTeams } from '../../utils/team-balance.util';

@Component({
  selector: 'app-teams-board',
  standalone: true,
  imports: [CommonModule, MetallicButtonComponent],
  templateUrl: './teams-board.component.html',
  styleUrls: ['./teams-board.component.scss'],
})
export class TeamsBoardComponent implements OnChanges {
  @Input() players: Player[] = [];
  @Input() initialHomePlayers: Player[] = [];
  @Input() initialAwayPlayers: Player[] = [];
  @Input() homeColor = 'Sin color';
  @Input() awayColor = 'Sin color';
  @Input() enabled = false;
  @Input() readOnlyMessage = 'Solo el creador puede reorganizar los equipos.';
  @Output() teamsChange = new EventEmitter<{ home: Player[]; away: Player[] }>();

  mode: 'AUTO' | 'MANUAL' = 'AUTO';
  homePlayers: Player[] = [];
  awayPlayers: Player[] = [];
  private savedSignature = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['players'] || changes['initialHomePlayers'] || changes['initialAwayPlayers']) {
      this.bootstrapTeams();
    }
  }

  setMode(mode: 'AUTO' | 'MANUAL'): void {
    this.mode = mode;
  }

  balanceTeams(): void {
    this.mode = 'AUTO';
    const balanced = buildBalancedTeams(this.players);
    this.homePlayers = balanced.home;
    this.awayPlayers = balanced.away;
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
    if (!event.dataTransfer || !this.enabled || this.mode !== 'MANUAL') {
      return;
    }

    event.dataTransfer.setData('text/player-uuid', playerUuid);
    event.dataTransfer.effectAllowed = 'move';
  }

  trackByPlayer = (_: number, player: Player): string => player.uuid;

  get homeAverage(): number {
    return this.getAverage(this.homePlayers);
  }

  get awayAverage(): number {
    return this.getAverage(this.awayPlayers);
  }

  get hasUnsavedChanges(): boolean {
    return this.buildTeamsSignature(this.homePlayers, this.awayPlayers) !== this.savedSignature;
  }

  saveTeams(): void {
    if (!this.enabled || !this.hasUnsavedChanges) {
      return;
    }

    this.savedSignature = this.buildTeamsSignature(this.homePlayers, this.awayPlayers);
    this.teamsChange.emit({ home: this.homePlayers, away: this.awayPlayers });
  }

  discardChanges(): void {
    this.bootstrapTeams();
  }

  private bootstrapTeams(): void {
    const validIds = new Set(this.players.map((player) => player.uuid));
    const home = this.initialHomePlayers.filter((player) => validIds.has(player.uuid));
    const away = this.initialAwayPlayers.filter((player) => validIds.has(player.uuid));
    const assignedIds = new Set([...home, ...away].map((player) => player.uuid));
    const unassigned = this.players.filter((player) => !assignedIds.has(player.uuid));
    const hasCompleteAssignment = this.players.length > 0 && assignedIds.size === this.players.length;

    if ((home.length || away.length) && hasCompleteAssignment && unassigned.length === 0) {
      this.homePlayers = [...home];
      this.awayPlayers = [...away];
    } else {
      const balanced = buildBalancedTeams(this.players);
      this.homePlayers = balanced.home;
      this.awayPlayers = balanced.away;
    }

    this.mode = 'AUTO';
    this.savedSignature = this.buildTeamsSignature(this.homePlayers, this.awayPlayers);
  }

  private movePlayer(playerUuid: string, side: 'HOME' | 'AWAY'): void {
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

  }

  private getAverage(players: Player[]): number {
    if (!players.length) {
      return 0;
    }

    const total = players.reduce((sum, player) => sum + (player.ovr ?? 65), 0);
    return Math.round(total / players.length);
  }

  private buildTeamsSignature(home: Player[], away: Player[]): string {
    const homeIds = home.map((player) => player.uuid).join(',');
    const awayIds = away.map((player) => player.uuid).join(',');
    return `H:${homeIds}|A:${awayIds}`;
  }
}
