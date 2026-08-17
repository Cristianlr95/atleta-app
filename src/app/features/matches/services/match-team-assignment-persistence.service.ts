import { Injectable } from '@angular/core';
import { Match, Player } from '../models/progressive-match.models';

export interface TeamAssignmentSnapshot {
  homeIds: string[];
  awayIds: string[];
  homeFormationId?: string;
  awayFormationId?: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class MatchTeamAssignmentPersistenceService {
  private static readonly STORAGE_KEY = 'atleta.match.team-assignments.v1';

  loadAll(): Record<string, TeamAssignmentSnapshot> {
    try {
      const raw = localStorage.getItem(MatchTeamAssignmentPersistenceService.STORAGE_KEY);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw) as Record<string, TeamAssignmentSnapshot>;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  saveAll(assignments: Record<string, TeamAssignmentSnapshot>): void {
    try {
      localStorage.setItem(MatchTeamAssignmentPersistenceService.STORAGE_KEY, JSON.stringify(assignments));
    } catch {
      // Browser storage can be unavailable in private mode or tests.
    }
  }

  createSnapshot(
    homePlayers: Player[],
    awayPlayers: Player[],
    now = new Date().toISOString(),
    formations?: { homeFormationId?: string; awayFormationId?: string },
  ): TeamAssignmentSnapshot {
    return {
      homeIds: homePlayers.map((player) => player.uuid),
      awayIds: awayPlayers.map((player) => player.uuid),
      ...(formations?.homeFormationId ? { homeFormationId: formations.homeFormationId } : {}),
      ...(formations?.awayFormationId ? { awayFormationId: formations.awayFormationId } : {}),
      updatedAt: now,
    };
  }

  keyForMatch(match: Match): string | null {
    if (match.backendMatchId) {
      return this.keyForBackendMatch(match.backendMatchId);
    }
    if (match.id) {
      return `local-${match.id}`;
    }
    return null;
  }

  keyForBackendMatch(backendMatchId: number): string {
    return `backend-${backendMatchId}`;
  }
}
