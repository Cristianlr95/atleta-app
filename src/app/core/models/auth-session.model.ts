export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthenticatedUser {
  atletaUuid: string;
  email: string;
  nombre: string;
  genero?: 'MASCULINO' | 'FEMENINO';
  createdAt?: string;
}

export interface AuthSession {
  user: AuthenticatedUser;
  tokens: AuthTokens;
}
