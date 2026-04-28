import { Injectable } from '@angular/core';
import { API_ENDPOINTS } from 'src/app/core/constants/api-endpoints';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { ApiService } from 'src/app/core/services/api.service';
import {
  AddTeamToMatchRequest,
  ConfirmMatchEventRequest,
  ConfirmMatchPlayerRequest,
  CreateMatchRequest,
  ImportTeamPlayersRequest,
  JoinMatchRequest,
  MatchPlayerSummary,
  MatchClosePreviewRequest,
  MatchClosePreviewResponse,
  MatchResponse,
  RegisterMatchEventRequest,
  RemoveMatchPlayerRequest,
  MatchStatus,
  PlayerMatchHistoryItem,
  UpdateMatchTeamAssignmentsRequest,
} from '../models/match.models';
import { MatchMvpResponse } from '../models/match-mvp.models';

@Injectable({ providedIn: 'root' })
export class MatchesApiService extends ApiService {
  constructor(private readonly authSessionService: AuthSessionService) {
    super();
  }

  createMatch(payload: CreateMatchRequest) {
    return this.post<MatchResponse, CreateMatchRequest>(API_ENDPOINTS.matches.base, payload);
  }

  getById(matchId: number) {
    return this.get<MatchResponse>(`${API_ENDPOINTS.matches.base}/${matchId}`);
  }

  getByPlayer(playerUuid: string) {
    return this.get<PlayerMatchHistoryItem[]>(`${API_ENDPOINTS.matches.byPlayer}/${playerUuid}`);
  }

  getByPlayerOrCreator(playerUuid: string) {
    return this.get<PlayerMatchHistoryItem[]>(`${API_ENDPOINTS.matches.byPlayerOrCreator}/${playerUuid}`);
  }

  joinMatch(payload: JoinMatchRequest) {
    return this.post<void, JoinMatchRequest>(API_ENDPOINTS.matches.join, payload);
  }

  registerEvent(payload: RegisterMatchEventRequest) {
    const actorUuid = this.authSessionService.currentSession?.user?.atletaUuid;
    const withActor: RegisterMatchEventRequest = {
      ...payload,
      registeredByUuid: payload.registeredByUuid ?? actorUuid,
    };

    return this.post<void, RegisterMatchEventRequest>(API_ENDPOINTS.matches.events, withActor);
  }

  addTeamToMatch(payload: AddTeamToMatchRequest) {
    return this.post<void, null>(
      `${API_ENDPOINTS.matches.base}/${payload.matchId}/teams/${payload.teamId}`,
      null,
      {
        params: { esLocal: payload.esLocal },
      },
    );
  }

  confirmPlayer(payload: ConfirmMatchPlayerRequest) {
    return this.put<void, null>(
      `${API_ENDPOINTS.matches.base}/${payload.matchId}/players/${payload.playerUuid}/confirm`,
      null,
    );
  }

  removePlayer(payload: RemoveMatchPlayerRequest) {
    return this.delete<void>(`${API_ENDPOINTS.matches.base}/${payload.matchId}/players/${payload.playerUuid}`);
  }

  importTeamPlayers(payload: ImportTeamPlayersRequest) {
    return this.post<MatchPlayerSummary[], null>(
      `${API_ENDPOINTS.matches.base}/${payload.matchId}/teams/${payload.teamId}/players/import`,
      null,
    );
  }

  confirmEvent(payload: ConfirmMatchEventRequest) {
    return this.put<void, null>(`${API_ENDPOINTS.matches.events}/${payload.eventId}/confirm`, null, {
      params: {
        confirmingPlayerUuid: payload.confirmingPlayerUuid,
        isLocalTeam: payload.isLocalTeam,
      },
    });
  }

  updateMatchStatus(matchId: number, status: MatchStatus, actorUuid?: string) {
    const params: Record<string, string> = { status };
    if (actorUuid) {
      params['actorUuid'] = actorUuid;
    }

    return this.put<void, null>(`${API_ENDPOINTS.matches.base}/${matchId}/status`, null, {
      params,
    });
  }

  updateTeamAssignments(matchId: number, payload: UpdateMatchTeamAssignmentsRequest) {
    return this.put<MatchResponse, UpdateMatchTeamAssignmentsRequest>(
      `${API_ENDPOINTS.matches.base}/${matchId}/teams/assignment`,
      payload,
    );
  }

  getMatchMvp(matchId: number) {
    return this.get<MatchMvpResponse>(`${API_ENDPOINTS.matches.base}/${matchId}/mvp`);
  }

  voteMatchMvp(matchId: number, votedUserId: string) {
    return this.post<MatchMvpResponse, { votedUserId: string }>(
      `${API_ENDPOINTS.matches.base}/${matchId}/mvp/vote`,
      { votedUserId },
    );
  }

  getClosePreview(matchId: number, payload: MatchClosePreviewRequest) {
    return this.post<MatchClosePreviewResponse, MatchClosePreviewRequest>(
      `${API_ENDPOINTS.matches.base}/${matchId}/close/preview`,
      payload,
    );
  }
}
