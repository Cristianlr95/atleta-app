import { Injectable, inject, signal } from '@angular/core';
import { Observable, shareReplay, tap } from 'rxjs';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { TeamActiveMember } from '../models/team.models';
import { TeamApiService } from './team-api.service';

export const TEAM_INVITE_FORBIDDEN = 'Solo el capitán activo del equipo puede enviar invitaciones.';

@Injectable({ providedIn: 'root' })
export class TeamInvitationAccessService {
  private readonly auth = inject(AuthSessionService);
  private readonly teamApi = inject(TeamApiService);
  private readonly requests = new Map<number, Observable<TeamActiveMember[]>>();
  private readonly captains = signal<Record<number, string | undefined>>({});

  canInvite(teamId: number): boolean {
    const uuid = this.auth.currentSession?.user.atletaUuid;
    return !!uuid && this.captains()[teamId] === uuid;
  }

  loadMembers(teamId: number): Observable<TeamActiveMember[]> {
    const existing = this.requests.get(teamId);
    if (existing) return existing;

    const uuid = this.auth.currentSession?.user.atletaUuid;
    const request = this.teamApi.getActiveMembers(teamId).pipe(
      tap(members => {
        if (this.requests.get(teamId) === request) {
          const canInvite = members.some(member => member.playerUuid === uuid && member.rol === 'CAPITAN');
          this.captains.update(captains => ({ ...captains, [teamId]: canInvite ? uuid : undefined }));
        }
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.requests.set(teamId, request);
    return request;
  }

  invalidate(teamId: number): void {
    this.requests.delete(teamId);
    this.captains.update(captains => ({ ...captains, [teamId]: undefined }));
  }

  clear(): void {
    this.requests.clear();
    this.captains.set({});
  }
}
