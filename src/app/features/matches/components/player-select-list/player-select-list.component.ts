import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Player } from '../../models/progressive-match.models';
import { buildBalancedTeams } from '../../utils/team-balance.util';

@Component({
  selector: 'app-player-select-list',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './player-select-list.component.html',
  styleUrls: ['./player-select-list.component.scss'],
})
export class PlayerSelectListComponent implements OnChanges {
  readonly ratingStarFilledAsset = 'assets/icons/atleta-raster-v1/ic_rating_star_filled_96.png';
  readonly ratingStarOutlineAsset = 'assets/icons/atleta-raster-v1/ic_rating_star_outline_96.png';
  @Input() players: Player[] = [];
  @Input() selectedIds: string[] = [];
  @Input() loading = false;

  @Output() selectionChange = new EventEmitter<string[]>();

  balancedHome: Player[] = [];
  balancedAway: Player[] = [];
  homeAverageOvr = 0;
  awayAverageOvr = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['players'] || changes['selectedIds']) {
      this.equilibrarPartido();
    }
  }

  onToggle(playerUuid: string, checked: boolean): void {
    const current = new Set(this.selectedIds);
    if (checked) {
      current.add(playerUuid);
    } else {
      current.delete(playerUuid);
    }

    this.selectionChange.emit([...current]);
  }

  onSelectAll(): void {
    this.selectionChange.emit(this.players.map((player) => player.uuid));
  }

  onClear(): void {
    this.selectionChange.emit([]);
  }

  isSelected(playerUuid: string): boolean {
    return this.selectedIds.includes(playerUuid);
  }

  get balanceLabel(): string {
    const diff = Math.abs(this.homeAverageOvr - this.awayAverageOvr);
    if (diff <= 3) {
      return 'Muy equilibrado';
    }
    if (diff <= 6) {
      return 'Equilibrado';
    }
    return 'Requiere ajuste';
  }

  get homeStars(): boolean[] {
    return this.buildStars(this.homeAverageOvr);
  }

  get awayStars(): boolean[] {
    return this.buildStars(this.awayAverageOvr);
  }

  equilibrarPartido(): void {
    const selected = this.players.filter((player) => this.selectedIds.includes(player.uuid));
    const balanced = buildBalancedTeams(selected);
    this.balancedHome = balanced.home;
    this.balancedAway = balanced.away;
    this.homeAverageOvr = balanced.homeAverageOvr;
    this.awayAverageOvr = balanced.awayAverageOvr;
  }

  private buildStars(avgOvr: number): boolean[] {
    const stars = Math.round((Math.max(0, Math.min(avgOvr, 100)) / 100) * 5);
    return Array.from({ length: 5 }, (_item, index) => index < stars);
  }
}
