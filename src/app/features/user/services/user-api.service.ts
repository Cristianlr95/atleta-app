import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { API_ENDPOINTS } from 'src/app/core/constants/api-endpoints';
import { ApiService } from 'src/app/core/services/api.service';
import { CreatePlayerProfileRequest } from '../../auth/models/auth.models';
import {
  AssignPlayerPositionRequest,
  PlayerAssignedPosition,
  PlayerPosition,
} from '../models/position.models';
import { AthleteProfile, PlayerProfile } from '../models/user.models';

@Injectable({ providedIn: 'root' })
export class UserApiService extends ApiService {
  getAthlete(atletaUuid: string) {
    return this.get<AthleteProfile>(`${API_ENDPOINTS.users.athletes}/${atletaUuid}`);
  }

  changePassword(atletaUuid: string, payload: { currentPassword: string; newPassword: string }) {
    return this.put<void, { currentPassword: string; newPassword: string }>(
      `${API_ENDPOINTS.users.athletes}/${atletaUuid}/password`,
      payload,
    );
  }

  getPlayerProfile(atletaUuid: string) {
    return this.get<PlayerProfile>(`${API_ENDPOINTS.users.playerProfiles}/${atletaUuid}`);
  }

  createPlayerProfile(payload: CreatePlayerProfileRequest) {
    return this.post<PlayerProfile, CreatePlayerProfileRequest>(
      API_ENDPOINTS.users.playerProfiles,
      payload,
    );
  }

  getPositions() {
    return this.get<PlayerPosition[]>(API_ENDPOINTS.users.positions);
  }

  assignPosition(payload: AssignPlayerPositionRequest) {
    return this.post<void, AssignPlayerPositionRequest>(
      API_ENDPOINTS.users.playerProfilePositions,
      payload,
    );
  }

  getPlayerPositions(atletaUuid: string) {
    return this.get<unknown[]>(`${API_ENDPOINTS.users.playerProfiles}/${atletaUuid}/positions`).pipe(
      map((items) =>
        (Array.isArray(items) ? items : [])
          .map((item) => {
            const record = (item ?? {}) as Record<string, unknown>;
            const positionRecord = (record['position'] ?? {}) as Record<string, unknown>;
            const prioridadRaw = Number(record['prioridad']);
            const prioridad = prioridadRaw === 2 || prioridadRaw === 3 ? prioridadRaw : 1;

            return {
              playerUuid: String(record['playerUuid'] ?? atletaUuid),
              positionId: Number(record['positionId'] ?? positionRecord['id'] ?? 0),
              positionName: String(
                record['positionName'] ??
                  positionRecord['nombre'] ??
                  record['nombre'] ??
                  'Posicion principal',
              ),
              prioridad,
              assignedAt: String(record['assignedAt'] ?? new Date().toISOString()),
            } as PlayerAssignedPosition;
          })
          .sort((a, b) => a.prioridad - b.prioridad),
      ),
    );
  }
}
