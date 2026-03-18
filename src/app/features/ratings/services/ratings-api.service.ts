import { Injectable } from '@angular/core';
import { API_ENDPOINTS } from 'src/app/core/constants/api-endpoints';
import { ApiService } from 'src/app/core/services/api.service';
import {
  LeaderboardEntry,
  OverallRating,
  RatingByRole,
  RatingHistoryEntry,
  RoleType,
  UpdateRatingsRequest,
} from '../models/rating.models';

@Injectable({ providedIn: 'root' })
export class RatingsApiService extends ApiService {
  updateRatings(payload: UpdateRatingsRequest) {
    return this.post<void, UpdateRatingsRequest>(`${API_ENDPOINTS.ratings.base}/update`, payload);
  }

  getOverall(playerProfileId: string) {
    return this.get<OverallRating>(
      `${API_ENDPOINTS.ratings.base}/player/${playerProfileId}/overall`,
    );
  }

  getByRole(playerProfileId: string) {
    return this.get<RatingByRole[]>(`${API_ENDPOINTS.ratings.base}/player/${playerProfileId}`);
  }

  getHistory(playerProfileId: string) {
    return this.get<RatingHistoryEntry[]>(`${API_ENDPOINTS.ratings.base}/player/${playerProfileId}/history`);
  }

  initializeBaseRatings(playerProfileId: string) {
    return this.post<RatingByRole[], Record<string, never>>(
      `${API_ENDPOINTS.ratings.initializeBase}/${playerProfileId}/initialize-base`,
      {},
    );
  }

  getLeaderboardOverall() {
    return this.get<LeaderboardEntry[]>(API_ENDPOINTS.ratings.leaderboard);
  }

  getLeaderboardByRole(roleType: RoleType) {
    return this.get<LeaderboardEntry[]>(API_ENDPOINTS.ratings.leaderboard, {
      params: { roleType },
    });
  }
}
