import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { MatchSize, Player } from '../../models/progressive-match.models';
import { buildBalancedTeams } from '../../utils/team-balance.util';
import {
  FormationPreset,
  FormationSlot,
  getFormationPresets,
  getPlayerRole,
  orderPlayersForFormation,
} from '../../utils/formation-layout.util';

type TeamSide = 'HOME' | 'AWAY';

export interface TeamsBoardChange {
  home: Player[];
  away: Player[];
  homeFormationId: string;
  awayFormationId: string;
}

@Component({
  selector: 'app-teams-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teams-board.component.html',
  styleUrls: ['./teams-board.component.scss'],
})
export class TeamsBoardComponent implements OnChanges {
  @Input() players: Player[] = [];
  @Input() initialHomePlayers: Player[] = [];
  @Input() initialAwayPlayers: Player[] = [];
  @Input() modality = MatchSize.FIVE_VS_FIVE;
  @Input() initialHomeFormationId?: string;
  @Input() initialAwayFormationId?: string;
  @Input() homeColor = 'Sin color';
  @Input() awayColor = 'Sin color';
  @Input() enabled = false;
  @Input() readOnlyMessage = 'Solo el creador puede reorganizar los equipos.';
  @Output() teamsChange = new EventEmitter<TeamsBoardChange>();

  homePlayers: Player[] = [];
  awayPlayers: Player[] = [];
  activeMobileSide: TeamSide = 'HOME';
  selectedPlayerUuid: string | null = null;
  draggingPlayerUuid: string | null = null;
  homeFormationId = '';
  awayFormationId = '';
  private savedSignature = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['players'] ||
      changes['initialHomePlayers'] ||
      changes['initialAwayPlayers'] ||
      changes['modality'] ||
      changes['initialHomeFormationId'] ||
      changes['initialAwayFormationId']
    ) {
      this.bootstrapTeams();
    }
  }

  get formations(): FormationPreset[] {
    return getFormationPresets(this.modality);
  }

  formationFor(side: TeamSide): FormationPreset {
    const formationId = side === 'HOME' ? this.homeFormationId : this.awayFormationId;
    return this.formations.find((formation) => formation.id === formationId) ?? this.formations[0];
  }

  playersFor(side: TeamSide): Player[] {
    return side === 'HOME' ? this.homePlayers : this.awayPlayers;
  }

  playerAt(side: TeamSide, slotIndex: number): Player | undefined {
    return this.playersFor(side)[slotIndex];
  }

  benchFor(side: TeamSide): Player[] {
    return this.playersFor(side).slice(this.formationFor(side).slots.length);
  }

  setActiveMobileSide(side: TeamSide): void {
    this.activeMobileSide = side;
    this.selectedPlayerUuid = null;
  }

  @HostListener('document:keydown.escape')
  cancelSelection(): void {
    this.selectedPlayerUuid = null;
  }

  balanceTeams(): void {
    const balanced = buildBalancedTeams(this.players);
    this.homePlayers = orderPlayersForFormation(balanced.home, this.formationFor('HOME'));
    this.awayPlayers = orderPlayersForFormation(balanced.away, this.formationFor('AWAY'));
    this.selectedPlayerUuid = null;
  }

  onDrop(side: TeamSide, slotIndex: number, event: DragEvent): void {
    event.preventDefault();
    const playerUuid = event.dataTransfer?.getData('text/player-uuid') || this.draggingPlayerUuid;
    if (this.enabled && playerUuid) this.placePlayer(playerUuid, side, slotIndex);
    this.draggingPlayerUuid = null;
  }

  onDragOver(event: DragEvent): void {
    if (this.enabled) event.preventDefault();
  }

  onDragStart(playerUuid: string, event: DragEvent): void {
    if (!event.dataTransfer || !this.enabled) return;
    this.draggingPlayerUuid = playerUuid;
    event.dataTransfer.setData('text/player-uuid', playerUuid);
    event.dataTransfer.effectAllowed = 'move';
  }

  selectOrPlace(playerUuid: string, side: TeamSide, slotIndex: number): void {
    if (!this.enabled) return;
    if (!this.selectedPlayerUuid) {
      this.selectedPlayerUuid = playerUuid;
      return;
    }
    if (this.selectedPlayerUuid === playerUuid) {
      this.selectedPlayerUuid = null;
      return;
    }
    this.placePlayer(this.selectedPlayerUuid, side, slotIndex);
  }

  placeSelectedInEmptySlot(side: TeamSide, slotIndex: number): void {
    if (this.enabled && this.selectedPlayerUuid) this.placePlayer(this.selectedPlayerUuid, side, slotIndex);
  }

  changeFormation(side: TeamSide, formationId: string): void {
    if (!this.enabled || !this.formations.some((formation) => formation.id === formationId)) return;
    if (side === 'HOME') this.homeFormationId = formationId;
    else this.awayFormationId = formationId;
    const players = orderPlayersForFormation(this.playersFor(side), this.formationFor(side));
    if (side === 'HOME') this.homePlayers = players;
    else this.awayPlayers = players;
  }

  isSelected(player: Player | undefined): boolean {
    return !!player && player.uuid === this.selectedPlayerUuid;
  }

  playerRole(player: Player): string {
    return getPlayerRole(player);
  }

  slotLabel(slot: FormationSlot): string {
    return `Posición ${slot.role}`;
  }

  trackByPlayer = (_: number, player: Player): string => player.uuid;

  get homeAverage(): number | string {
    return this.getAverage(this.homePlayers);
  }

  get awayAverage(): number | string {
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
    this.teamsChange.emit({
      home: this.homePlayers,
      away: this.awayPlayers,
      homeFormationId: this.homeFormationId,
      awayFormationId: this.awayFormationId,
    });
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

    const hasSavedAssignment = (home.length || away.length) && hasCompleteAssignment && unassigned.length === 0;
    if (hasSavedAssignment) {
      this.homePlayers = [...home];
      this.awayPlayers = [...away];
    } else {
      const balanced = buildBalancedTeams(this.players);
      this.homePlayers = balanced.home;
      this.awayPlayers = balanced.away;
    }

    this.homeFormationId = this.resolveFormationId(this.initialHomeFormationId);
    this.awayFormationId = this.resolveFormationId(this.initialAwayFormationId);
    if (!hasSavedAssignment) {
      this.homePlayers = orderPlayersForFormation(this.homePlayers, this.formationFor('HOME'));
      this.awayPlayers = orderPlayersForFormation(this.awayPlayers, this.formationFor('AWAY'));
    }
    this.selectedPlayerUuid = null;
    this.savedSignature = this.buildTeamsSignature(this.homePlayers, this.awayPlayers);
  }

  private placePlayer(playerUuid: string, targetSide: TeamSide, targetIndex: number): void {
    const homeIndex = this.homePlayers.findIndex((player) => player.uuid === playerUuid);
    const awayIndex = this.awayPlayers.findIndex((player) => player.uuid === playerUuid);
    const sourceSide: TeamSide | null = homeIndex >= 0 ? 'HOME' : awayIndex >= 0 ? 'AWAY' : null;
    if (!sourceSide) return;

    const sourceIndex = sourceSide === 'HOME' ? homeIndex : awayIndex;
    const sourcePlayers = [...this.playersFor(sourceSide)];
    const targetPlayers = sourceSide === targetSide ? sourcePlayers : [...this.playersFor(targetSide)];
    const source = sourcePlayers[sourceIndex];
    const target = targetPlayers[targetIndex];

    if (sourceSide === targetSide) {
      if (target) {
        sourcePlayers[sourceIndex] = target;
        sourcePlayers[targetIndex] = source;
      } else {
        sourcePlayers.splice(sourceIndex, 1);
        sourcePlayers.splice(Math.min(targetIndex, sourcePlayers.length), 0, source);
      }
      if (sourceSide === 'HOME') this.homePlayers = sourcePlayers;
      else this.awayPlayers = sourcePlayers;
    } else if (target) {
      sourcePlayers[sourceIndex] = target;
      targetPlayers[targetIndex] = source;
      this.homePlayers = sourceSide === 'HOME' ? sourcePlayers : targetPlayers;
      this.awayPlayers = sourceSide === 'AWAY' ? sourcePlayers : targetPlayers;
    } else {
      sourcePlayers.splice(sourceIndex, 1);
      targetPlayers[targetIndex] = source;
      this.homePlayers = sourceSide === 'HOME' ? sourcePlayers : targetPlayers;
      this.awayPlayers = sourceSide === 'AWAY' ? sourcePlayers : targetPlayers;
    }

    this.selectedPlayerUuid = null;
  }

  private getAverage(players: Player[]): number | string {
    const ratings = players.map((player) => player.ovr).filter((ovr): ovr is number => typeof ovr === 'number');
    if (!ratings.length) return '—';
    return Math.round(ratings.reduce((sum, ovr) => sum + ovr, 0) / ratings.length);
  }

  private buildTeamsSignature(home: Player[], away: Player[]): string {
    const homeIds = home.map((player) => player.uuid).join(',');
    const awayIds = away.map((player) => player.uuid).join(',');
    return `H:${homeIds}:${this.homeFormationId}|A:${awayIds}:${this.awayFormationId}`;
  }

  private resolveFormationId(candidate?: string): string {
    return this.formations.some((formation) => formation.id === candidate) ? candidate! : this.formations[0].id;
  }
}
