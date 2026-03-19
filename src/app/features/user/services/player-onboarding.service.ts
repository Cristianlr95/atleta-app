import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable, switchMap, tap } from 'rxjs';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { CreatePlayerProfileRequest } from '../../auth/models/auth.models';
import { RatingsApiService } from '../../ratings/services/ratings-api.service';
import { PositionPriorityLevel } from '../models/position.models';
import { PlayerPositionStateService } from './player-position-state.service';
import { UserApiService } from './user-api.service';

export interface CompletePlayerOnboardingPosition {
  positionId: number;
  positionName: string;
  prioridad: PositionPriorityLevel;
}

export interface CompletePlayerOnboardingRequest {
  alias: string;
  positions: CompletePlayerOnboardingPosition[];
}

@Injectable({ providedIn: 'root' })
export class PlayerOnboardingService {
  private readonly authSessionService = inject(AuthSessionService);
  private readonly userApiService = inject(UserApiService);
  private readonly ratingsApiService = inject(RatingsApiService);
  private readonly playerPositionStateService = inject(PlayerPositionStateService);

  completeOnboarding(request: CompletePlayerOnboardingRequest): Observable<void> {
    const session = this.authSessionService.currentSession;
    if (!session) {
      throw new Error('No hay sesion activa para completar onboarding.');
    }

    const profileRequest: CreatePlayerProfileRequest = {
      atletaUuid: session.user.atletaUuid,
      alias: request.alias,
    };

    return this.userApiService.createPlayerProfile(profileRequest).pipe(
      switchMap(() =>
        forkJoin(
          request.positions.map((position) =>
            this.userApiService.assignPosition({
              playerUuid: session.user.atletaUuid,
              positionId: position.positionId,
              prioridad: position.prioridad,
            }),
          ),
        ),
      ),
      switchMap(() => this.ratingsApiService.initializeBaseRatings(session.user.atletaUuid)),
      tap(() => {
        request.positions.forEach((position) => {
          this.playerPositionStateService.storePosition({
            playerUuid: session.user.atletaUuid,
            positionId: position.positionId,
            positionName: position.positionName,
            prioridad: position.prioridad,
          });
        });
      }),
      map(() => void 0),
    );
  }
}
