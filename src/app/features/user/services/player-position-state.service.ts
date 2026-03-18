import { inject, Injectable } from '@angular/core';
import { APP_CONFIG } from 'src/app/core/config/app-config.token';
import { PlayerAssignedPosition, PositionPriorityLevel } from '../models/position.models';

interface StorePlayerPositionInput {
  playerUuid: string;
  positionId: number;
  positionName: string;
  prioridad: PositionPriorityLevel;
}

@Injectable({ providedIn: 'root' })
export class PlayerPositionStateService {
  private readonly config = inject(APP_CONFIG);

  private get storageKey(): string {
    return `${this.config.storagePrefix}.player-positions`;
  }

  storePosition(input: StorePlayerPositionInput): void {
    const positions = this.readAll();

    const filtered = positions.filter((item) =>
      !(item.playerUuid === input.playerUuid && item.prioridad === input.prioridad),
    );

    filtered.push({
      playerUuid: input.playerUuid,
      positionId: input.positionId,
      positionName: input.positionName,
      prioridad: input.prioridad,
      assignedAt: new Date().toISOString(),
    });

    this.writeAll(filtered);
  }

  getByPlayer(playerUuid: string): PlayerAssignedPosition[] {
    return this.readAll()
      .filter((item) => item.playerUuid === playerUuid)
      .sort((a, b) => a.prioridad - b.prioridad);
  }

  private readAll(): PlayerAssignedPosition[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as PlayerAssignedPosition[]) : [];
    } catch {
      return [];
    }
  }

  private writeAll(positions: PlayerAssignedPosition[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(positions));
    } catch {
      // Ignore storage errors on unsupported/private contexts.
    }
  }
}
