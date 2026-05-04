import { AuthenticatedUser } from 'src/app/core/models/auth-session.model';

export type AthleteGender = 'MASCULINO' | 'FEMENINO';

export interface RegisterAthleteRequest {
  nombre: string;
  email: string;
  password: string;
  genero: AthleteGender;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface CreatePlayerProfileRequest {
  atletaUuid: string;
  alias?: string;
}

export interface AuthApiResponse extends AuthenticatedUser {
  genero?: AthleteGender;
  accessToken?: string;
  refreshToken?: string;
  token?: string;
}
