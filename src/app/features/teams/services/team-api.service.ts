import { Injectable } from '@angular/core';
import { API_ENDPOINTS } from 'src/app/core/constants/api-endpoints';
import { ApiService } from 'src/app/core/services/api.service';
import {
  CreateTeamRequest,
  TeamActiveMember,
  TeamExternalRecord,
  TeamLeaderboardEntry,
  TeamSummary,
} from '../models/team.models';

@Injectable({ providedIn: 'root' })
export class TeamApiService extends ApiService {
  uploadTeamLogo(file: File) {
    const payload = new FormData();
    payload.append('file', file);
    return this.post<{ logoUrl: string }, FormData>(API_ENDPOINTS.teams.uploadLogo, payload);
  }

  createTeam(payload: CreateTeamRequest) {
    return this.post<TeamSummary, CreateTeamRequest>(API_ENDPOINTS.teams.base, payload);
  }

  getByCreator(creadorUuid: string) {
    return this.get<TeamSummary[]>(`${API_ENDPOINTS.teams.byCreator}/${creadorUuid}`);
  }

  getByPlayer(playerUuid: string) {
    return this.get<TeamSummary[]>(`${API_ENDPOINTS.teams.byPlayer}/${playerUuid}`);
  }

  getById(teamId: number) {
    return this.get<TeamSummary>(`${API_ENDPOINTS.teams.base}/${teamId}`);
  }

  getActiveMembers(teamId: number) {
    return this.get<TeamActiveMember[]>(`${API_ENDPOINTS.teams.base}/${teamId}/members/active`);
  }

  getLeaderboard(teamId: number) {
    return this.get<TeamLeaderboardEntry[]>(`${API_ENDPOINTS.teams.base}/${teamId}/leaderboard`);
  }

  getExternalRecord(teamId: number) {
    return this.get<TeamExternalRecord>(`${API_ENDPOINTS.teams.base}/${teamId}/external-record`);
  }

  deleteTeam(teamId: number, actorUuid: string) {
    return this.delete<void>(`${API_ENDPOINTS.teams.base}/${teamId}`, {
      params: { actorUuid },
    });
  }
}
