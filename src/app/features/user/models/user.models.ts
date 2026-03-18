import { AuthenticatedUser } from 'src/app/core/models/auth-session.model';

export interface PlayerProfile {
  atletaUuid: string;
  alias?: string;
  trustScore?: number;
  createdAt?: string;
}

export interface AthleteProfile extends AuthenticatedUser {
  playerProfile?: PlayerProfile;
}
