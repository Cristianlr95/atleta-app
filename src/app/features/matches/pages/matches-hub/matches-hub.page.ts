import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { finalize, firstValueFrom, forkJoin, of, Subject } from 'rxjs';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { buildMainBottomNav } from 'src/app/shared/navigation/main-bottom-nav';
import {
  MetallicBottomNavComponent,
  MetallicBottomNavItem,
} from 'src/app/shared/ui/metallic-bottom-nav/metallic-bottom-nav.component';
import { MetallicCardComponent } from 'src/app/shared/ui/metallic-card/metallic-card.component';
import {
  CompetitionHistoryDisplayItem,
  MetallicCompetitionHistoryComponent,
} from 'src/app/shared/ui/metallic-competition-history/metallic-competition-history.component';
import { MetallicFormSectionComponent } from 'src/app/shared/ui/metallic-form-section/metallic-form-section.component';
import { MetallicStatsComponent, Stat } from 'src/app/shared/ui/metallic-stats/metallic-stats.component';
import { MatchHistoryViewItem, MatchHistoryService } from '../../services/match-history.service';
import { PlayerMatchHistoryItem } from '../../models/match.models';
import { MatchesApiService } from '../../services/matches-api.service';
import { NotificationBadgeService } from '../../services/notification-badge.service';
import { InvitationsStore } from '../../stores/invitations.store';
import { Invitation } from '../../models/progressive-match.models';
import { SocialApiService } from '../../../social/services/social-api.service';
import { SocialRequestItem } from '../../../social/models/social.models';
import { PlayerInvitationStatus } from '../../models/progressive-match.models';
import { RatingsApiService } from '../../../ratings/services/ratings-api.service';

type MatchesTab = 'upcoming' | 'history' | 'create';
type UpcomingStatusKey = PlayerMatchHistoryItem['estado'] | 'CONFIRMED';

interface UpcomingMatchCard {
  id: number;
  title: string;
  timeLabel: string;
  statusLabel: string;
  statusKey: UpcomingStatusKey;
  dateLabel: string;
  confirmed: number;
  target: number;
  teamLabel: string;
  levelLabel: string;
}

interface PendingInvitationGroup {
  id: string;
  backendMatchId?: number;
  matchId: string;
  createdAt: string;
  pendingCount: number;
  confirmedCount: number;
  totalInvited: number;
}

interface PendingMatchSummary {
  title: string;
  timeLabel: string;
}

@Component({
  selector: 'app-matches-hub-page',
  standalone: true,
  templateUrl: './matches-hub.page.html',
  styleUrls: ['./matches-hub.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MetallicCardComponent,
    MetallicFormSectionComponent,
    MetallicBottomNavComponent,
    MetallicStatsComponent,
    MetallicCompetitionHistoryComponent,
  ],
})
export class MatchesHubPage implements OnDestroy {
  private readonly authSessionService = inject(AuthSessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly matchesApiService = inject(MatchesApiService);
  private readonly matchHistoryService = inject(MatchHistoryService);
  private readonly socialApiService = inject(SocialApiService);
  private readonly ratingsApiService = inject(RatingsApiService);
  private readonly navigationService = inject(NavigationService);
  private readonly notificationBadgeService = inject(NotificationBadgeService);
  private readonly invitationsStore = inject(InvitationsStore);
  private readonly leave$ = new Subject<void>();
  private readonly playerOvrCache = new Map<string, number | null>();

  readonly iconBase = 'assets/icons/atleta';
  readonly titleIconAsset = `${this.iconBase}/ic_nav_matches_24.svg`;
  readonly upcomingIconAsset = `${this.iconBase}/ic_status_in_assembly_24.svg`;
  readonly historyIconAsset = `${this.iconBase}/ic_match_calendar_24.svg`;
  readonly createIconAsset = `${this.iconBase}/ic_match_create_24.svg`;
  readonly filterIconAsset = `${this.iconBase}/ic_action_filter_24.svg`;
  readonly openIconAsset = `${this.iconBase}/ic_action_search_24.svg`;
  readonly editIconAsset = `${this.iconBase}/ic_action_edit_24.svg`;

  selectedTab: MatchesTab = 'upcoming';
  isLoading = false;
  errorMessage: string | null = null;
  upcomingMatches: UpcomingMatchCard[] = [];
  pendingMatchSummaries: Record<number, PendingMatchSummary> = {};
  readonly pendingInvitations = this.invitationsStore.pendingInvitations;
  readonly allInvitations = this.invitationsStore.invitations;
  readonly pendingInvitationGroups = () =>
    this.groupPendingInvitations(this.pendingInvitations(), this.allInvitations());

  selectedOutcomeFilter = 'ALL';
  selectedModalityFilter = 'ALL';
  selectedStatusFilter = 'FINALIZADO';
  allMatchHistoryItems: CompetitionHistoryDisplayItem[] = [];
  matchHistoryItems: CompetitionHistoryDisplayItem[] = [];
  outcomeStats: Stat[] = [];

  get bottomNavItems(): ReadonlyArray<MetallicBottomNavItem> {
    return buildMainBottomNav('matches', this.notificationBadgeService.totalPending());
  }

  ionViewWillEnter(): void {
    this.applyRequestedTab();
    void this.initializeView();
  }

  ngOnDestroy(): void {
    this.leave$.next();
    this.leave$.complete();
  }

  onTabChange(tab: MatchesTab): void {
    this.selectedTab = tab;
  }

  private applyRequestedTab(): void {
    const requestedTab = this.route.snapshot.queryParamMap.get('tab') ?? this.route.snapshot.data['defaultMatchesTab'];
    if (requestedTab === 'upcoming' || requestedTab === 'history' || requestedTab === 'create') {
      this.selectedTab = requestedTab;
    }
  }

  onOpenMatch(matchId: number): void {
    void this.navigationService.safeNavigate(['/matches', String(matchId)]);
  }

  onGoToCreate(): void {
    void this.navigationService.safeNavigate(['/matches/create']);
  }

  onOpenInvitationGroup(group: PendingInvitationGroup): void {
    if (group.backendMatchId) {
      void this.navigationService.safeNavigate(['/matches', String(group.backendMatchId)]);
      return;
    }
    void this.navigationService.safeNavigate(['/matches']);
  }

  onHistoryFilterChange(): void {
    this.applyHistoryFilters();
  }

  resetHistoryFilters(): void {
    this.selectedOutcomeFilter = 'ALL';
    this.selectedModalityFilter = 'ALL';
    this.selectedStatusFilter = 'FINALIZADO';
    this.applyHistoryFilters();
  }

  onRetryLoad(): void {
    this.loadData();
  }

  onNavItemSelected(itemId: string): void {
    void this.navigationService.goToMainBottomSection(itemId);
  }

  getStatusIconAsset(status: UpcomingStatusKey): string {
    if (status === 'CONFIRMED') {
      return `${this.iconBase}/ic_status_finished_24.svg`;
    }

    if (status === 'INICIADO') {
      return `${this.iconBase}/ic_status_in_progress_24.svg`;
    }

    if (status === 'FINALIZADO') {
      return `${this.iconBase}/ic_status_finished_24.svg`;
    }

    if (status === 'INVALIDO') {
      return `${this.iconBase}/ic_status_canceled_24.svg`;
    }

    return `${this.iconBase}/ic_status_pending_24.svg`;
  }

  getStatusVisualClass(status: UpcomingStatusKey): string {
    if (status === 'FINALIZADO' || status === 'CONFIRMED') {
      return 'matches-status--success';
    }
    if (status === 'INVALIDO') {
      return 'matches-status--danger';
    }
    if (status === 'INICIADO') {
      return 'matches-status--warning';
    }
    return 'matches-status--neutral';
  }

  private loadData(): void {
    const session = this.authSessionService.currentSession;
    if (!session) {
      this.errorMessage = 'Inicia sesión para ver tus partidos.';
      this.upcomingMatches = [];
      this.matchHistoryItems = [];
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    forkJoin({
      upcoming: this.loadUpcomingForUser(session.user.atletaUuid).pipe(
        catchError(() => of([] as PlayerMatchHistoryItem[])),
      ),
      history: this.matchHistoryService.getPlayerHistory(session.user.atletaUuid).pipe(catchError(() => of([] as MatchHistoryViewItem[]))),
    })
      .pipe(
        takeUntil(this.leave$),
        finalize(() => (this.isLoading = false)),
      )
      .subscribe({
        next: async ({ upcoming, history }) => {
          this.upcomingMatches = await this.toUpcomingCards(upcoming);
          void this.loadPendingInvitationSummaries(upcoming);
          this.outcomeStats = this.buildOutcomeStats(history);
          this.setHistoryItems(this.toHistoryDisplay(history));
        },
        error: () => {
          this.errorMessage = 'No se pudo cargar la agenda e historial de partidos.';
          this.upcomingMatches = [];
          this.outcomeStats = [];
          this.matchHistoryItems = [];
        },
      });
  }

  private loadUpcomingForUser(playerUuid: string) {
    return forkJoin({
      matches: this.matchesApiService.getByPlayerOrCreator(playerUuid).pipe(
        catchError(() => this.matchesApiService.getByPlayer(playerUuid)),
        catchError(() => of([] as PlayerMatchHistoryItem[])),
      ),
      socialInvites: this.socialApiService.getMatchInvites(playerUuid).pipe(catchError(() => of([] as SocialRequestItem[]))),
    }).pipe(
      // merge partidos creados por el usuario aunque backend by-player no los devuelva
      // y evitar duplicados por id.
      switchMap(({ matches, socialInvites }: { matches: PlayerMatchHistoryItem[]; socialInvites: SocialRequestItem[] }) => {
        const createdByUserMatchIds = new Set(
          (socialInvites ?? [])
            .filter((invite) => invite.type === 'MATCH_INVITE' && invite.requesterUuid === playerUuid && !!invite.matchId)
            .map((invite) => Number(invite.matchId))
            .filter((id) => Number.isFinite(id)),
        );
        const baseMatches = (matches ?? []).map((item) =>
          this.ensureCreatorIncluded(item, playerUuid, createdByUserMatchIds.has(item.id)),
        );
        const existingIds = new Set(baseMatches.map((item) => item.id));
        const createdMatchIds = [
          ...createdByUserMatchIds,
        ].filter((id) => !existingIds.has(id)).slice(0, 20);

        if (createdMatchIds.length === 0) {
          return of(baseMatches);
        }

        return forkJoin(
          createdMatchIds.map((matchId) =>
            this.matchesApiService.getById(matchId).pipe(catchError(() => of(null))),
          ),
        ).pipe(
          map((extraResponses) => {
            const extraMatches = extraResponses
              .filter((item): item is NonNullable<typeof item> => item !== null)
              .map((response) =>
                this.ensureCreatorIncluded(
                  {
                    id: response.id,
                    modalidad: response.modalidad,
                    fechaHoraProgramada: response.fechaHoraProgramada,
                    estado: response.estado,
                    cuota: response.cuota,
                    resultado: undefined,
                    startedAt: response.startedAt ?? null,
                    closePending: !!response.closePending,
                    matchTeams: response.matchTeams ?? [],
                    players: response.players ?? [],
                    events: response.events ?? [],
                  } as PlayerMatchHistoryItem,
                  playerUuid,
                  true,
                ),
              );
            return [...baseMatches, ...extraMatches];
          }),
        );
      }),
    );
  }

  private ensureCreatorIncluded(
    item: PlayerMatchHistoryItem,
    playerUuid: string,
    isCreatedByCurrentUser: boolean,
  ): PlayerMatchHistoryItem {
    if (!isCreatedByCurrentUser) {
      return item;
    }

    const players = item.players ?? [];
    const alreadyPresent = players.some((player) => player.player?.atletaUuid === playerUuid);
    if (alreadyPresent) {
      return item;
    }

    const currentUserAlias = this.authSessionService.currentSession?.user?.nombre ?? 'Creador';
    return {
      ...item,
      players: [
        ...players,
        {
          id: -1,
          rol: 'CAPITAN',
          confirmado: true,
          player: {
            atletaUuid: playerUuid,
            alias: currentUserAlias,
          },
        },
      ],
    };
  }

  private async toUpcomingCards(items: PlayerMatchHistoryItem[]): Promise<UpcomingMatchCard[]> {
    const now = Date.now();
    const cards = items
      .filter((item) => item.estado !== 'INVALIDO')
      .filter((item) => this.shouldDisplayInAgenda(item, now))
      .sort((a, b) => this.compareAgendaItems(a, b))
      .map((item): UpcomingMatchCard => {
        const target = this.targetPlayers(item.modalidad);
        const totalInvited = this.resolveTotalPlayers(item, target);
        const confirmed = this.resolveConfirmedPlayers(item, target);
        const joinedTeam =
          (item.players ?? []).find((player) => !!player.team?.nombre)?.team?.nombre ?? 'Equipo por definir';
        const isFullyConfirmed = totalInvited > 0 && confirmed >= totalInvited && totalInvited >= target;
        const displayStatus = this.resolveAgendaStatus(item, isFullyConfirmed);

        return {
          id: item.id,
          title: this.buildMatchTitle(item),
          timeLabel: this.formatTime(item.fechaHoraProgramada),
          statusLabel: this.statusLabel(displayStatus),
          statusKey: displayStatus,
          dateLabel: this.formatDate(item.fechaHoraProgramada),
          confirmed,
          target,
          teamLabel: joinedTeam,
          levelLabel: '',
        };
      });

    return Promise.all(
      cards.map(async (card, index): Promise<UpcomingMatchCard> => ({
        ...card,
        levelLabel: await this.resolveUpcomingLevelLabel(items[index], card.statusKey === 'CONFIRMED'),
      })),
    );
  }

  getPendingGroupTitle(group: PendingInvitationGroup): string {
    const summary = this.findUpcomingMatch(group);
    if (summary) {
      return summary.title;
    }

    if (group.backendMatchId && this.pendingMatchSummaries[group.backendMatchId]) {
      return this.pendingMatchSummaries[group.backendMatchId].title;
    }

    return 'Convocatoria pendiente';
  }

  getPendingGroupTimeLabel(group: PendingInvitationGroup): string {
    const summary = this.findUpcomingMatch(group);
    if (summary) {
      return summary.timeLabel;
    }

    if (group.backendMatchId && this.pendingMatchSummaries[group.backendMatchId]) {
      return this.pendingMatchSummaries[group.backendMatchId].timeLabel;
    }

    return 'Horario por confirmar';
  }

  getPendingGroupParticipantsLabel(group: PendingInvitationGroup): string {
    return `${group.confirmedCount}/${group.totalInvited} confirmados`;
  }

  private targetPlayers(modality: PlayerMatchHistoryItem['modalidad']): number {
    if (modality === 'SEIS_VS_SEIS') {
      return 12;
    }

    if (modality === 'SIETE_VS_SIETE') {
      return 14;
    }

    return 10;
  }

  private modalityLabel(modality: PlayerMatchHistoryItem['modalidad']): string {
    if (modality === 'SEIS_VS_SEIS') {
      return '6 vs 6';
    }
    if (modality === 'SIETE_VS_SIETE') {
      return '7 vs 7';
    }
    return '5 vs 5';
  }

  private buildMatchTitle(item: PlayerMatchHistoryItem): string {
    const teams = [...new Set((item.matchTeams ?? []).map((team) => team.team?.nombre).filter(Boolean))];

    if (teams.length >= 2) {
      return `${teams[0]} vs ${teams[1]}`;
    }

    if (teams.length === 1) {
      return `${teams[0]} · ${this.modalityLabel(item.modalidad)}`;
    }

    return `Partido ${this.modalityLabel(item.modalidad)}`;
  }

  private resolveAgendaStatus(item: PlayerMatchHistoryItem, isFullyConfirmed: boolean): UpcomingStatusKey {
    if (item.estado === 'FINALIZADO' || (item.estado === 'INICIADO' && item.closePending)) {
      return 'FINALIZADO';
    }

    if (item.estado === 'INICIADO') {
      return 'INICIADO';
    }

    if (isFullyConfirmed) {
      return 'CONFIRMED';
    }

    return item.estado;
  }

  private statusLabel(status: UpcomingStatusKey): string {
    if (status === 'CONFIRMED') {
      return 'Confirmado';
    }

    if (status === 'INICIADO') {
      return 'En juego';
    }
    if (status === 'FINALIZADO') {
      return 'Finalizado';
    }
    return 'En armado';
  }

  private shouldDisplayInAgenda(item: PlayerMatchHistoryItem, now: number): boolean {
    const displayStatus = this.resolveAgendaStatus(item, false);

    if (displayStatus === 'INICIADO') {
      return true;
    }

    if (displayStatus === 'FINALIZADO') {
      return this.isRecentlyFinished(item, now);
    }

    const epoch = new Date(item.fechaHoraProgramada).getTime();
    return Number.isNaN(epoch) || epoch >= now;
  }

  private isRecentlyFinished(item: PlayerMatchHistoryItem, now: number): boolean {
    const finishedEpoch = this.resolveAgendaEpoch(item);
    if (finishedEpoch === null) {
      return false;
    }

    return now - finishedEpoch <= 6 * 60 * 60 * 1000;
  }

  private compareAgendaItems(a: PlayerMatchHistoryItem, b: PlayerMatchHistoryItem): number {
    const priorityDiff = this.agendaPriority(a) - this.agendaPriority(b);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    const aEpoch = this.resolveAgendaEpoch(a) ?? Number.MAX_SAFE_INTEGER;
    const bEpoch = this.resolveAgendaEpoch(b) ?? Number.MAX_SAFE_INTEGER;

    if (this.resolveAgendaStatus(a, false) === 'FINALIZADO' && this.resolveAgendaStatus(b, false) === 'FINALIZADO') {
      return bEpoch - aEpoch;
    }

    return aEpoch - bEpoch;
  }

  private agendaPriority(item: PlayerMatchHistoryItem): number {
    const displayStatus = this.resolveAgendaStatus(item, false);

    if (displayStatus === 'INICIADO') {
      return 0;
    }

    if (displayStatus === 'FINALIZADO') {
      return 2;
    }

    return 1;
  }

  private resolveAgendaEpoch(item: PlayerMatchHistoryItem): number | null {
    const preferredDate = item.startedAt ?? item.fechaHoraProgramada;
    const epoch = new Date(preferredDate).getTime();
    return Number.isNaN(epoch) ? null : epoch;
  }

  private async resolveUpcomingLevelLabel(item: PlayerMatchHistoryItem, isConfirmed: boolean): Promise<string> {
    if (!isConfirmed) {
      return '';
    }

    const confirmedUuids = [...new Set(
      (item.players ?? [])
        .filter((player) => Boolean(player.confirmado) || player.rol === 'CAPITAN')
        .map((player) => player.player?.atletaUuid)
        .filter((uuid): uuid is string => !!uuid),
    )];

    if (confirmedUuids.length === 0) {
      return '';
    }

    const ovrs = await Promise.all(confirmedUuids.map((uuid) => this.resolvePlayerOvr(uuid)));
    const validOvrs = ovrs.filter((ovr): ovr is number => Number.isFinite(ovr));
    if (validOvrs.length === 0) {
      return '';
    }

    const average = Math.round(validOvrs.reduce((sum, value) => sum + value, 0) / validOvrs.length);
    return `Nivel competitivo: ${average}`;
  }

  private async resolvePlayerOvr(playerUuid: string): Promise<number | null> {
    if (this.playerOvrCache.has(playerUuid)) {
      return this.playerOvrCache.get(playerUuid) ?? null;
    }

    try {
      const overall = await firstValueFrom(this.ratingsApiService.getOverall(playerUuid).pipe(catchError(() => of(null))));
      const raw = Number(overall?.hybridOVR);
      const resolved = Number.isFinite(raw) ? raw : null;
      this.playerOvrCache.set(playerUuid, resolved);
      return resolved;
    } catch {
      this.playerOvrCache.set(playerUuid, null);
      return null;
    }
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

  private formatDate(raw: string): string {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      return raw;
    }

    return date.toLocaleString('es-CL', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private formatTime(raw: string): string {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      return 'Hora no disponible';
    }

    return date.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatInvitationDate(raw: string): string {
    return this.formatDate(raw);
  }

  private groupPendingInvitations(pendingInvitations: Invitation[], allInvitations: Invitation[]): PendingInvitationGroup[] {
    const groups = new Map<string, PendingInvitationGroup>();
    const statsByKey = new Map<string, { totalInvited: number; confirmedCount: number }>();

    for (const invitation of allInvitations) {
      const key = invitation.backendMatchId
        ? `backend-${invitation.backendMatchId}`
        : `local-${invitation.matchId}`;
      const current = statsByKey.get(key) ?? { totalInvited: 0, confirmedCount: 0 };
      current.totalInvited += 1;
      if (invitation.status === PlayerInvitationStatus.ACCEPTED) {
        current.confirmedCount += 1;
      }
      statsByKey.set(key, current);
    }

    for (const invitation of pendingInvitations) {
      const key = invitation.backendMatchId
        ? `backend-${invitation.backendMatchId}`
        : `local-${invitation.matchId}`;
      const current = groups.get(key);
      if (!current) {
        const stats = statsByKey.get(key) ?? { totalInvited: 1, confirmedCount: 0 };
        groups.set(key, {
          id: key,
          backendMatchId: invitation.backendMatchId,
          matchId: invitation.matchId,
          createdAt: invitation.createdAt,
          pendingCount: 1,
          confirmedCount: stats.confirmedCount,
          totalInvited: stats.totalInvited,
        });
        continue;
      }

      current.pendingCount += 1;
      if (new Date(invitation.createdAt).getTime() > new Date(current.createdAt).getTime()) {
        current.createdAt = invitation.createdAt;
      }
    }

    return Array.from(groups.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  private findUpcomingMatch(group: PendingInvitationGroup): UpcomingMatchCard | undefined {
    if (!group.backendMatchId) {
      return undefined;
    }

    return this.upcomingMatches.find((match) => match.id === group.backendMatchId);
  }

  private async initializeView(): Promise<void> {
    await Promise.all([
      this.notificationBadgeService.refresh(),
      this.invitationsStore.loadPendingInvitations(),
    ]);
    this.loadData();
  }

  private async loadPendingInvitationSummaries(upcoming: PlayerMatchHistoryItem[]): Promise<void> {
    const summaryById: Record<number, PendingMatchSummary> = {};

    for (const item of upcoming) {
      summaryById[item.id] = this.toPendingMatchSummary(item);
    }

    const pendingBackendIds = [
      ...new Set(
        this.pendingInvitations()
          .map((invitation) => invitation.backendMatchId)
          .filter((id): id is number => Number.isFinite(id) && !!id),
      ),
    ];

    const missingIds = pendingBackendIds.filter((id) => !summaryById[id]);
    if (missingIds.length > 0) {
      const responses = await firstValueFrom(
        forkJoin(
          missingIds.map((matchId) =>
            this.matchesApiService.getById(matchId).pipe(catchError(() => of(null))),
          ),
        ),
      );

      for (const response of responses) {
        if (!response) {
          continue;
        }

        summaryById[response.id] = {
          title: this.buildMatchTitle({
            id: response.id,
            modalidad: response.modalidad,
            fechaHoraProgramada: response.fechaHoraProgramada,
            estado: response.estado,
            cuota: response.cuota,
            startedAt: response.startedAt ?? null,
            matchTeams: response.matchTeams ?? [],
            players: response.players ?? [],
            events: response.events ?? [],
          }),
          timeLabel: this.formatTime(response.fechaHoraProgramada),
        };
      }
    }

    this.pendingMatchSummaries = summaryById;
  }

  private toPendingMatchSummary(item: PlayerMatchHistoryItem): PendingMatchSummary {
    return {
      title: this.buildMatchTitle(item),
      timeLabel: this.formatTime(item.fechaHoraProgramada),
    };
  }

  private buildOutcomeStats(history: MatchHistoryViewItem[]): Stat[] {
    const outcomes = history
      .map((item) => item.outcome)
      .filter((value): value is NonNullable<typeof value> => value !== null);

    return [
      {
        label: 'Victorias',
        value: outcomes.filter((outcome) => outcome === 'GANADO').length,
        icon: 'trophy-outline',
      },
      {
        label: 'Empates',
        value: outcomes.filter((outcome) => outcome === 'EMPATADO').length,
        icon: 'stats-chart-outline',
      },
      {
        label: 'Derrotas',
        value: outcomes.filter((outcome) => outcome === 'PERDIDO').length,
        icon: 'football-outline',
      },
    ];
  }

  private toHistoryDisplay(history: MatchHistoryViewItem[]): CompetitionHistoryDisplayItem[] {
    return history.map((item) => ({
      id: item.id,
      dateEpoch: item.scheduledAtEpoch,
      modalityKey: item.modality,
      statusKey: item.status,
      outcomeKey: item.outcome ?? 'NONE',
      modalityLabel: item.modalityLabel,
      dateLabel: item.dateLabel,
      statusLabel: item.statusLabel,
      outcomeLabel: this.outcomeLabel(item.outcome),
      outcomeVariant: this.outcomeVariant(item.outcome),
      teamLabel: item.teamLabel,
      positionLabel: item.positionLabel,
      minutesPlayedLabel: item.minutesPlayedLabel,
      goals: item.goals,
      assists: item.assists,
      matchRatingLabel: item.matchRatingLabel,
      mvpLabel: item.mvpLabel,
      scoreLabel: item.scoreLabel,
    }));
  }

  private setHistoryItems(items: CompetitionHistoryDisplayItem[]): void {
    this.allMatchHistoryItems = this.sortHistoryByMostRecent(items);
    this.applyHistoryFilters();
  }

  private sortHistoryByMostRecent(items: CompetitionHistoryDisplayItem[]): CompetitionHistoryDisplayItem[] {
    return [...items].sort((a, b) => {
      const aEpoch = a.dateEpoch ?? Number.MIN_SAFE_INTEGER;
      const bEpoch = b.dateEpoch ?? Number.MIN_SAFE_INTEGER;
      return bEpoch - aEpoch;
    });
  }

  private applyHistoryFilters(): void {
    this.matchHistoryItems = this.allMatchHistoryItems.filter((item) => {
      const outcomeMatches = this.selectedOutcomeFilter === 'ALL' || item.outcomeKey === this.selectedOutcomeFilter;
      const modalityMatches = this.selectedModalityFilter === 'ALL' || item.modalityKey === this.selectedModalityFilter;
      const statusMatches = this.selectedStatusFilter === 'ALL' || item.statusKey === this.selectedStatusFilter;
      return outcomeMatches && modalityMatches && statusMatches;
    });
  }

  private outcomeLabel(outcome: MatchHistoryViewItem['outcome']): string {
    if (outcome === 'GANADO') {
      return 'Victoria';
    }
    if (outcome === 'EMPATADO') {
      return 'Empate';
    }
    if (outcome === 'PERDIDO') {
      return 'Derrota';
    }
    return 'Sin dato';
  }

  private outcomeVariant(outcome: MatchHistoryViewItem['outcome']): CompetitionHistoryDisplayItem['outcomeVariant'] {
    if (outcome === 'GANADO') {
      return 'win';
    }
    if (outcome === 'EMPATADO') {
      return 'draw';
    }
    if (outcome === 'PERDIDO') {
      return 'loss';
    }
    return 'neutral';
  }
}
