import { Injectable, inject } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import {
  MatchEventSummary,
  MatchModality,
  MatchOutcome,
  MatchStatus,
  PlayerMatchHistoryItem,
} from '../models/match.models';
import { toCanonicalMatchOutcome } from '../models/match-outcome.mapper';
import { RatingsApiService } from '../../ratings/services/ratings-api.service';
import { RatingHistoryEntry } from '../../ratings/models/rating.models';
import { MatchesApiService } from './matches-api.service';
import { SocialApiService } from '../../social/services/social-api.service';

export interface MatchHistoryViewItem {
  id: number;
  scheduledAtEpoch: number | null;
  modality: MatchModality;
  status: MatchStatus;
  displayStatusKey: 'CREATED' | 'CONFIRMED' | 'LIVE' | 'FINISHED' | 'INVALID';
  modalityLabel: string;
  dateLabel: string;
  statusLabel: string;
  outcome: MatchOutcome | null;
  teamLabel: string;
  positionLabel: string;
  minutesPlayedLabel: string;
  goals: number;
  assists: number;
  matchRatingLabel: string;
  mvpLabel: string;
  scoreLabel: string;
}

@Injectable({ providedIn: 'root' })
export class MatchHistoryService {
  private readonly matchesApiService = inject(MatchesApiService);
  private readonly ratingsApiService = inject(RatingsApiService);
  private readonly socialApiService = inject(SocialApiService);
  private readonly authSessionService = inject(AuthSessionService);

  getPlayerHistory(playerUuid: string): Observable<MatchHistoryViewItem[]> {
    return forkJoin({
      matches: this.matchesApiService.getByPlayerOrCreator(playerUuid).pipe(
        catchError(() => this.matchesApiService.getByPlayer(playerUuid)),
      ),
      socialInvites: this.socialApiService.getMatchInvites(playerUuid).pipe(catchError(() => of([]))),
      ratingHistory: this.ratingsApiService
        .getHistory(playerUuid)
        .pipe(
          map((items) => items ?? []),
          catchError(() => of([] as RatingHistoryEntry[])),
        ),
    }).pipe(
      switchMap(({ matches, socialInvites, ratingHistory }) => {
        const baseMatches = matches ?? [];
        const existingIds = new Set(baseMatches.map((item) => item.id));
        const createdMatchIds = [
          ...new Set(
            (socialInvites ?? [])
              .filter((invite) => invite.type === 'MATCH_INVITE' && invite.requesterUuid === playerUuid && !!invite.matchId)
              .map((invite) => Number(invite.matchId))
              .filter((id) => Number.isFinite(id)),
          ),
        ].filter((id) => !existingIds.has(id)).slice(0, 20);

        if (createdMatchIds.length === 0) {
          return of({ matches: baseMatches, ratingHistory });
        }

        return forkJoin(
          createdMatchIds.map((matchId) =>
            this.matchesApiService.getById(matchId).pipe(catchError(() => of(null))),
          ),
        ).pipe(
          map((extraResponses) => {
            const extraMatches = extraResponses
              .filter((item): item is NonNullable<typeof item> => item !== null)
              .map((response) => this.toPlayerHistoryItem(response));
            return {
              matches: [...baseMatches, ...extraMatches],
              ratingHistory,
            };
          }),
        );
      }),
      map(({ matches, ratingHistory }) => {
        const ratingByMatch = new Map<number, RatingHistoryEntry>();
        for (const item of ratingHistory) {
          if (!ratingByMatch.has(item.matchId)) {
            ratingByMatch.set(item.matchId, item);
          }
        }

        return (matches ?? []).map((item) => this.toViewItem(item, playerUuid, ratingByMatch));
      }),
    );
  }

  private toPlayerHistoryItem(response: import('../models/match.models').MatchResponse): PlayerMatchHistoryItem {
    return {
      id: response.id,
      modalidad: response.modalidad,
      fechaHoraProgramada: response.fechaHoraProgramada,
      estado: response.estado,
      cuota: response.cuota,
      resultado: undefined,
      startedAt: response.startedAt ?? null,
      closePending: !!response.closePending,
      finalScoreLocal: response.finalScoreLocal,
      finalScoreAway: response.finalScoreAway,
      matchTeams: response.matchTeams ?? [],
      players: response.players ?? [],
      events: response.events ?? [],
    };
  }

  private toViewItem(
    item: PlayerMatchHistoryItem,
    playerUuid: string,
    ratingByMatch: Map<number, RatingHistoryEntry>,
  ): MatchHistoryViewItem {
    const date = new Date(item.fechaHoraProgramada);
    const dateLabel = Number.isNaN(date.getTime())
      ? item.fechaHoraProgramada
      : date.toLocaleString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

    const ratingHistory = ratingByMatch.get(item.id);
    const participation = (item.players ?? []).find((player) => player.player?.atletaUuid === playerUuid);
    const scoreLabel = this.buildScoreLabel(item);

    return {
      id: item.id,
      scheduledAtEpoch: Number.isNaN(date.getTime()) ? null : date.getTime(),
      modality: item.modalidad,
      status: item.estado,
      displayStatusKey: this.resolveDisplayStatusKey(item),
      modalityLabel: this.mapModality(item.modalidad),
      dateLabel,
      statusLabel: this.mapStatus(item),
      outcome: this.resolveOutcome(item, ratingHistory),
      teamLabel: participation?.team?.nombre ?? 'N/D',
      positionLabel: participation?.position?.nombre ?? 'N/D',
      minutesPlayedLabel: this.resolveMinutesPlayed(item),
      goals: ratingHistory?.goalsScored ?? this.countGoals(item.events ?? [], playerUuid),
      assists: ratingHistory?.assistsMade ?? this.countAssists(item.events ?? [], playerUuid),
      matchRatingLabel:
        ratingHistory && Number.isFinite(Number(ratingHistory.newRating))
          ? Number(ratingHistory.newRating).toFixed(1)
          : 'N/D',
      mvpLabel: ratingHistory?.wasMvp ? 'Si' : 'No',
      scoreLabel,
    };
  }

  private buildScoreLabel(item: PlayerMatchHistoryItem): string {
    if (item.finalScoreLocal !== undefined && item.finalScoreAway !== undefined) {
      return `${item.finalScoreLocal} - ${item.finalScoreAway}`;
    }

    const localTeam = (item.matchTeams ?? []).find((team) => team.esLocal);
    const awayTeam = (item.matchTeams ?? []).find((team) => !team.esLocal);

    if (!localTeam || !awayTeam) {
      return 'N/D';
    }

    return `${localTeam.goles ?? 0} - ${awayTeam.goles ?? 0}`;
  }

  private resolveOutcome(
    item: PlayerMatchHistoryItem,
    ratingHistory: RatingHistoryEntry | undefined,
  ): MatchOutcome | null {
    const outcomeFromMatch = toCanonicalMatchOutcome((item as { resultado?: unknown }).resultado);
    if (outcomeFromMatch) {
      return outcomeFromMatch;
    }

    const outcomeFromRating = toCanonicalMatchOutcome(ratingHistory?.matchResult);
    if (outcomeFromRating) {
      return outcomeFromRating;
    }

    return this.resolveOutcomeFromScore(item);
  }

  private resolveOutcomeFromScore(item: PlayerMatchHistoryItem): MatchOutcome | null {
    const localScore = item.finalScoreLocal;
    const awayScore = item.finalScoreAway;
    if (localScore === undefined || awayScore === undefined) {
      return null;
    }

    if (localScore === awayScore) {
      return 'EMPATADO';
    }

    const currentUserUuid = this.authSessionService.currentSession?.user?.atletaUuid;
    const participation = (item.players ?? []).find((player) => player.player?.atletaUuid === currentUserUuid);
    if (!participation) {
      return null;
    }

    const side =
      participation.teamSide === 'LOCAL' || participation.teamSide === 'VISITA'
        ? participation.teamSide
        : this.resolveParticipantSideFromTeams(item, participation.team?.id);

    if (!side) {
      return null;
    }

    const localWon = localScore > awayScore;
    if (side === 'LOCAL') {
      return localWon ? 'GANADO' : 'PERDIDO';
    }

    return localWon ? 'PERDIDO' : 'GANADO';
  }

  private resolveParticipantSideFromTeams(
    item: PlayerMatchHistoryItem,
    teamId: number | undefined,
  ): 'LOCAL' | 'VISITA' | null {
    if (!teamId) {
      return null;
    }

    const localTeam = (item.matchTeams ?? []).find((team) => team.esLocal);
    const awayTeam = (item.matchTeams ?? []).find((team) => !team.esLocal);

    if (localTeam?.team?.id === teamId) {
      return 'LOCAL';
    }

    if (awayTeam?.team?.id === teamId) {
      return 'VISITA';
    }

    return null;
  }

  private resolveMinutesPlayed(item: PlayerMatchHistoryItem): string {
    const startRaw = item.startedAt;
    if (!startRaw) {
      return 'N/D';
    }

    const startDate = new Date(startRaw);
    if (Number.isNaN(startDate.getTime())) {
      return 'N/D';
    }

    const confirmedEventDates = (item.events ?? [])
      .filter((event) => Boolean(event.confirmedByLocal) && Boolean(event.confirmedByVisitante))
      .map((event) => new Date(event.createdAt ?? ''))
      .filter((date) => !Number.isNaN(date.getTime()));

    if (confirmedEventDates.length === 0) {
      return 'N/D';
    }

    const endDate = confirmedEventDates.reduce((latest, current) =>
      current.getTime() > latest.getTime() ? current : latest,
    );

    const diffMinutes = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000));

    return `${diffMinutes}`;
  }

  private countGoals(events: MatchEventSummary[], playerUuid: string): number {
    return events.filter(
      (event) =>
        event.eventType === 'GOL' &&
        event.player?.atletaUuid === playerUuid &&
        Boolean(event.confirmedByLocal) &&
        Boolean(event.confirmedByVisitante),
    ).length;
  }

  private countAssists(events: MatchEventSummary[], playerUuid: string): number {
    return events.filter(
      (event) =>
        event.eventType === 'GOL' &&
        event.assistPlayer?.atletaUuid === playerUuid &&
        Boolean(event.confirmedByLocal) &&
        Boolean(event.confirmedByVisitante),
    ).length;
  }

  private mapModality(modality: MatchModality): string {
    if (modality === 'SEIS_VS_SEIS') {
      return '6 vs 6';
    }

    if (modality === 'SIETE_VS_SIETE') {
      return '7 vs 7';
    }

    return '5 vs 5';
  }

  private mapStatus(item: PlayerMatchHistoryItem): string {
    const displayStatus = this.resolveDisplayStatusKey(item);
    if (displayStatus === 'CONFIRMED') {
      return 'Confirmado';
    }
    if (displayStatus === 'LIVE') {
      return 'En juego';
    }
    if (displayStatus === 'FINISHED') {
      return 'Finalizado';
    }
    if (displayStatus === 'INVALID') {
      return 'Cancelado';
    }
    return 'Creado';
  }

  private resolveDisplayStatusKey(item: PlayerMatchHistoryItem): 'CREATED' | 'CONFIRMED' | 'LIVE' | 'FINISHED' | 'INVALID' {
    if (item.estado === 'FINALIZADO') {
      return 'FINISHED';
    }

    if (item.estado === 'INVALIDO') {
      return 'INVALID';
    }

    if (item.estado === 'INICIADO' && item.closePending) {
      return 'FINISHED';
    }

    if (item.estado === 'INICIADO') {
      return 'LIVE';
    }

    const target = this.targetPlayers(item.modalidad);
    const confirmed = this.resolveConfirmedPlayers(item, target);
    const total = this.resolveTotalPlayers(item, target);
    const isFullyConfirmed = total > 0 && total >= target && confirmed >= total;
    return isFullyConfirmed ? 'CONFIRMED' : 'CREATED';
  }

  private resolveConfirmedPlayers(item: PlayerMatchHistoryItem, target: number): number {
    const confirmed = (item.players ?? []).filter((player) => Boolean(player.confirmado) || player.rol === 'CAPITAN').length;
    const currentUserUuid = this.authSessionService.currentSession?.user?.atletaUuid;
    const includesCurrentUser = (item.players ?? []).some((player) => player.player?.atletaUuid === currentUserUuid);

    if (!includesCurrentUser && confirmed === target - 1) {
      return target;
    }

    return confirmed;
  }

  private resolveTotalPlayers(item: PlayerMatchHistoryItem, target: number): number {
    const total = (item.players ?? []).length;
    const currentUserUuid = this.authSessionService.currentSession?.user?.atletaUuid;
    const includesCurrentUser = (item.players ?? []).some((player) => player.player?.atletaUuid === currentUserUuid);

    if (!includesCurrentUser && total === target - 1) {
      return target;
    }

    return total;
  }

  private targetPlayers(modality: MatchModality): number {
    if (modality === 'SEIS_VS_SEIS') {
      return 12;
    }

    if (modality === 'SIETE_VS_SIETE') {
      return 14;
    }

    return 10;
  }
}
