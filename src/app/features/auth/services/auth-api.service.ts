import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from 'src/app/core/constants/api-endpoints';
import { ApiService } from 'src/app/core/services/api.service';
import {
  AuthApiResponse,
  CreatePlayerProfileRequest,
  GoogleLoginRequest,
  LoginRequest,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  RefreshTokenRequest,
  RegisterAthleteRequest,
} from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService extends ApiService {
  login(payload: LoginRequest): Observable<HttpResponse<AuthApiResponse>> {
    return this.http.post<AuthApiResponse>(this.url(API_ENDPOINTS.auth.login), payload, {
      observe: 'response',
    });
  }

  loginWithGoogle(payload: GoogleLoginRequest): Observable<AuthApiResponse> {
    return this.post<AuthApiResponse, GoogleLoginRequest>(API_ENDPOINTS.auth.googleLogin, payload);
  }

  registerAthlete(payload: RegisterAthleteRequest): Observable<AuthApiResponse> {
    return this.post<AuthApiResponse, RegisterAthleteRequest>(
      API_ENDPOINTS.auth.registerAthlete,
      payload,
    );
  }

  createPlayerProfile(payload: CreatePlayerProfileRequest): Observable<AuthApiResponse> {
    return this.post<AuthApiResponse, CreatePlayerProfileRequest>(
      API_ENDPOINTS.auth.createPlayerProfile,
      payload,
    );
  }

  refresh(payload: RefreshTokenRequest): Observable<AuthApiResponse> {
    return this.post<AuthApiResponse, RefreshTokenRequest>(API_ENDPOINTS.auth.refresh, payload);
  }

  logout(payload: RefreshTokenRequest): Observable<void> {
    return this.post<void, RefreshTokenRequest>(API_ENDPOINTS.auth.logout, payload);
  }

  requestPasswordReset(payload: PasswordResetRequest): Observable<void> {
    return this.post<void, PasswordResetRequest>(API_ENDPOINTS.auth.passwordResetRequest, payload);
  }

  confirmPasswordReset(payload: PasswordResetConfirmRequest): Observable<void> {
    return this.post<void, PasswordResetConfirmRequest>(API_ENDPOINTS.auth.passwordResetConfirm, payload);
  }
}
