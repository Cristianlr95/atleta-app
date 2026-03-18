import { Injectable } from '@angular/core';
import { API_ENDPOINTS } from 'src/app/core/constants/api-endpoints';
import { ApiService } from 'src/app/core/services/api.service';
import {
  CreateFriendRequestPayload,
  CreateMatchInvitePayload,
  CreateMatchInvitesBatchPayload,
  CreateTeamInvitePayload,
  RespondRequestPayload,
  SocialPlayerLookupItem,
  SocialNotificationItem,
  SocialRequestItem,
} from '../models/social.models';

@Injectable({ providedIn: 'root' })
export class SocialApiService extends ApiService {
  getFriendships(playerUuid: string) {
    return this.get<SocialRequestItem[]>(`${API_ENDPOINTS.social.friendships}/${playerUuid}`);
  }

  createFriendRequest(payload: CreateFriendRequestPayload) {
    return this.post<SocialRequestItem, CreateFriendRequestPayload>(
      API_ENDPOINTS.social.friendshipRequests,
      payload,
    );
  }

  respondFriendRequest(requestId: number, payload: RespondRequestPayload) {
    return this.put<SocialRequestItem, RespondRequestPayload>(
      `${API_ENDPOINTS.social.friendshipRequests}/${requestId}/decision`,
      payload,
    );
  }

  getTeamInvites(playerUuid: string) {
    return this.get<SocialRequestItem[]>(`${API_ENDPOINTS.social.teamInvites}/${playerUuid}`);
  }

  createTeamInvite(payload: CreateTeamInvitePayload) {
    return this.post<SocialRequestItem, CreateTeamInvitePayload>(API_ENDPOINTS.social.teamInvites, payload);
  }

  respondTeamInvite(inviteId: number, payload: RespondRequestPayload) {
    return this.put<SocialRequestItem, RespondRequestPayload>(
      `${API_ENDPOINTS.social.teamInvites}/${inviteId}/decision`,
      payload,
    );
  }

  getMatchInvites(playerUuid: string) {
    return this.get<SocialRequestItem[]>(`${API_ENDPOINTS.social.matchInvites}/${playerUuid}`);
  }

  getMatchInvitesByMatch(matchId: number) {
    return this.get<SocialRequestItem[]>(`${API_ENDPOINTS.social.matchInvitesByMatch}/${matchId}`);
  }

  createMatchInvite(payload: CreateMatchInvitePayload) {
    return this.post<SocialRequestItem, CreateMatchInvitePayload>(API_ENDPOINTS.social.matchInvites, payload);
  }

  createMatchInvitesBatch(payload: CreateMatchInvitesBatchPayload) {
    return this.post<SocialRequestItem[], CreateMatchInvitesBatchPayload>(
      API_ENDPOINTS.social.matchInvitesBatch,
      payload,
    );
  }

  respondMatchInvite(inviteId: number, payload: RespondRequestPayload) {
    return this.put<SocialRequestItem, RespondRequestPayload>(
      `${API_ENDPOINTS.social.matchInvites}/${inviteId}/decision`,
      payload,
    );
  }

  getNotifications(playerUuid: string) {
    return this.get<SocialNotificationItem[]>(`${API_ENDPOINTS.social.notifications}/${playerUuid}`);
  }

  markNotificationRead(notificationId: number, playerUuid: string) {
    return this.put<SocialNotificationItem, null>(
      `${API_ENDPOINTS.social.notifications}/${notificationId}/read`,
      null,
      { params: { playerUuid } },
    );
  }

  sendIncompleteFormReminder(playerUuid: string) {
    return this.post<SocialNotificationItem, null>(`${API_ENDPOINTS.social.reminders}/${playerUuid}`, null);
  }

  searchPlayers(query: string) {
    return this.get<SocialPlayerLookupItem[]>(API_ENDPOINTS.social.searchPlayers, {
      params: { q: query },
    });
  }
}
