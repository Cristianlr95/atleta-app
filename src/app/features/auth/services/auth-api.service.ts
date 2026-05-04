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
}
