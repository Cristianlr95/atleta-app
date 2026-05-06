import { CommonModule } from '@angular/common';
import { Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AppToastService } from 'src/app/core/services/app-toast.service';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { ErrorMapperService } from 'src/app/core/services/error-mapper.service';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { PageLoadGuard } from 'src/app/core/utils/page-load-guard';
import { buildMainBottomNav } from 'src/app/shared/navigation/main-bottom-nav';
import { MetallicButtonComponent } from 'src/app/shared/ui/metallic-button/metallic-button.component';
import {
  MetallicBottomNavComponent,
  MetallicBottomNavItem,
} from 'src/app/shared/ui/metallic-bottom-nav/metallic-bottom-nav.component';
import { MetallicCardComponent } from 'src/app/shared/ui/metallic-card/metallic-card.component';
import { MetallicFormSectionComponent } from 'src/app/shared/ui/metallic-form-section/metallic-form-section.component';
import { MatchConfirmationProgressComponent } from '../../components/match-confirmation-progress/match-confirmation-progress.component';
import { MatchHeaderCardComponent } from '../../components/match-header-card/match-header-card.component';
import { ParticipantListComponent } from '../../components/participant-list/participant-list.component';
import {
  ParticipantSegment,
  ParticipantSegmentComponent,
} from '../../components/participant-segment/participant-segment.component';
import { TeamsBoardComponent } from '../../components/teams-board/teams-board.component';
import { VenueSelectedCardComponent } from '../../components/venue-selected-card/venue-selected-card.component';
import { DEFAULT_MATCH_THEME_ID, MATCH_THEMES } from '../../models/match-theme.constants';
import { MatchViewState, toMatchViewState } from '../../models/match-view-state.models';
import { MatchState, lifecycleToUserLabel } from '../../models/match-state.models';
import { MatchStatus, Player, PlayerInvitationStatus } from '../../models/progressive-match.models';
import { MatchLiveService } from '../../services/match-live.service';
import { MatchService } from '../../services/match.service';
import { NotificationService } from '../../services/notification.service';
import { NotificationBadgeService } from '../../services/notification-badge.service';
import { MatchStore } from '../../stores/match.store';
import { InvitationsStore } from '../../stores/invitations.store';
import { MvpVoteStore } from '../../stores/mvp-vote.store';
import { buildBalancedTeams } from '../../utils/team-balance.util';

@Component({
  selector: 'app-match-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    MetallicCardComponent,
    MetallicFormSectionComponent,
    MetallicBottomNavComponent,
    MetallicButtonComponent,
    MatchHeaderCardComponent,
    MatchConfirmationProgressComponent,
    ParticipantSegmentComponent,
    ParticipantListComponent,
    TeamsBoardComponent,
    VenueSelectedCardComponent,
  ],
  templateUrl: './match-detail.page.html',
  styleUrls: ['./match-detail.page.scss'],
})
export class MatchDetailPage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly navigationService = inject(NavigationService);
  private readonly matchStore = inject(MatchStore);
  private readonly matchService = inject(MatchService);
  private readonly matchLiveService = inject(MatchLiveService);
  private readonly notificationService = inject(NotificationService);
  private readonly notificationBadgeService = inject(NotificationBadgeService);
  private readonly invitationsStore = inject(InvitationsStore);
  private readonly mvpVoteStore = inject(MvpVoteStore);
  private readonly appToastService = inject(AppToastService);
  private readonly errorMapper = inject(ErrorMapperService);
  private readonly authSessionService = inject(AuthSessionService);

  readonly iconBase = 'assets/icons/atleta';
  readonly titleIconAsset = `${this.iconBase}/ic_nav_matches_24.svg`;
  readonly progressIconAsset = `${this.iconBase}/ic_status_in_progress_24.svg`;
  readonly participantsIconAsset = `${this.iconBase}/ic_match_invite_24.svg`;
  readonly rankingIconAsset = `${this.iconBase}/ic_comp_stats_24.svg`;
  readonly actionsIconAsset = `${this.iconBase}/ic_action_edit_24.svg`;

  readonly themes = MATCH_THEMES;
  readonly selectedParticipantSegment = signal<ParticipantSegment>('CONFIRMED');
  readonly statusFeedback = signal<string | null>(null);
  readonly teamBalanceFeedback = signal<string | null>(null);
  readonly teamAssignmentError = signal<string | null>(null);
  readonly inviteActionLoading = signal(false);

  private readonly routeMatchId = signal('');
  private readonly localMatchId = signal('');
  private readonly now = signal(Date.now());
  private feedbackTimer?: number;
  private teamBalanceFeedbackTimer?: number;
  private teamAssignmentErrorTimer?: number;
  private nowTimer?: number;
  private lastTeamDistributionSnapshot: { confirmed: number; home: number; away: number } | null = null;
  private autoPersistedTeamsSignature: string | null = null;
  private autoPersistTeamsInFlight = false;
  private lastLoadedMvpRouteMatchId: string | null = null;
  private readonly enterLoadGuard = new PageLoadGuard();

  readonly resource = computed(() => this.matchStore.getStateSnapshot(this.routeMatchId()));
  readonly loadingMatch = computed(() => this.resource().loading && !this.resource().data);
  readonly loadError = computed(() => this.resource().error);
  readonly state = computed<MatchState | null>(() => this.resource().data);
  readonly viewState = computed<MatchViewState | null>(() => {
    const state = this.state();
    return state ? toMatchViewState(state) : null;
  });
  readonly match = computed(() => this.state()?.match ?? null);
  readonly progress = computed(() => this.state()?.progress ?? null);
  readonly selectedVenue = computed(() => this.state()?.venue ?? null);
  readonly mvpVoteResource = computed(() => this.mvpVoteStore.getStateSnapshot(this.routeMatchId()));
  readonly mvpVoteState = computed(() => this.mvpVoteResource().data ?? null);

  readonly confirmedParticipants = computed(() => this.state()?.confirmedParticipants ?? []);
  readonly pendingParticipants = computed(() => this.state()?.pendingParticipants ?? []);
  readonly declinedParticipants = computed(() => this.state()?.declinedParticipants ?? []);
  readonly participants = computed(() => this.state()?.participants ?? []);
  readonly confirmedPlayers = computed(() => this.state()?.confirmedPlayers ?? []);

  readonly visibleParticipants = computed(() => {
    if (this.selectedParticipantSegment() === 'PENDING') {
      return this.pendingParticipants();
    }
    if (this.selectedParticipantSegment() === 'DECLINED') {
      return this.declinedParticipants();
    }
    return this.confirmedParticipants();
  });

  readonly isCreator = computed(() => {
    const currentUser = this.authSessionService.currentSession?.user?.atletaUuid?.trim().toLowerCase();
    const creatorUuid = this.match()?.creatorUuid?.trim().toLowerCase();
    return !!currentUser && !!creatorUuid && creatorUuid === currentUser;
  });

  readonly canShowTeams = computed(() => {
    const status = this.match()?.status;
    return (
      status === MatchStatus.CONFIRMED ||
      status === MatchStatus.LIVE ||
      status === MatchStatus.FINISHED ||
      this.confirmedParticipants().length >= 2
    );
  });

  readonly hasMatchStarted = computed(() => {
    const match = this.match();
    if (!match) {
      return false;
    }

    if (match.startedAt || match.status === MatchStatus.LIVE || match.status === MatchStatus.FINISHED) {
      return true;
    }

    const scheduledAt = new Date(match.scheduledAt).getTime();
    return Number.isFinite(scheduledAt) && scheduledAt <= Date.now();
  });

  readonly canEditTeams = computed(
    () => this.isCreator() && this.confirmedParticipants().length >= 2 && !this.hasMatchStarted(),
  );

  readonly assignedHomePlayers = computed(() => {
    const confirmed = new Set(this.confirmedPlayers().map((player) => player.uuid));
    return (this.match()?.homePlayers ?? []).filter((player) => confirmed.has(player.uuid));
  });

  readonly assignedAwayPlayers = computed(() => {
    const confirmed = new Set(this.confirmedPlayers().map((player) => player.uuid));
    return (this.match()?.awayPlayers ?? []).filter((player) => confirmed.has(player.uuid));
  });

  readonly teamsReadOnlyMessage = computed(() => {
    if (this.canEditTeams()) {
      return '';
    }
    if (this.hasMatchStarted()) {
      return 'Los equipos se bloquean al comenzar el partido.';
    }
    return 'Solo el creador puede reorganizar los equipos.';
  });
  readonly isFinalized = computed(() => this.match()?.status === MatchStatus.FINISHED);
  readonly closeAvailableAt = computed(() => {
    const match = this.match();
    if (!match) {
      return null;
    }

    const kickoffRaw = match.startedAt ?? match.scheduledAt;
    const kickoffAt = new Date(kickoffRaw).getTime();
    if (!Number.isFinite(kickoffAt)) {
      return null;
    }

    return kickoffAt + 60 * 60 * 1000;
  });
  readonly canCloseMatch = computed(() => {
    if (!this.isCreator() || this.isFinalized() || !this.hasMatchStarted()) {
      return false;
    }

    if (this.match()?.closePending) {
      return true;
    }

    const closeAvailableAt = this.closeAvailableAt();
    return closeAvailableAt !== null && this.now() >= closeAvailableAt;
  });
  readonly closeMatchMessage = computed(() => {
    if (!this.isCreator() || this.isFinalized()) {
      return '';
    }

    if (!this.hasMatchStarted()) {
      return 'El cierre se habilita 1 hora después del inicio del partido.';
    }

    if (this.canCloseMatch()) {
      return 'Ya puedes cerrar el partido y cargar el resultado final.';
    }

    const closeAvailableAt = this.closeAvailableAt();
    if (closeAvailableAt === null) {
      return 'El cierre se habilita 1 hora después del inicio del partido.';
    }

    return `Podrás cerrar el partido desde las ${this.formatCloseTime(closeAvailableAt)}.`;
  });
  readonly canOpenMvpVote = computed(() => {
    const match = this.match();
    if (!match || match.status !== MatchStatus.FINISHED || !match.finalizedAt) {
      return false;
    }
    const closesAt = new Date(match.finalizedAt).getTime() + 3 * 60 * 60 * 1000;
    return Date.now() < closesAt;
  });
  readonly mvpTotalEligibleVotes = computed(() => this.mvpVoteState()?.candidates.length ?? 0);
  readonly mvpTotalRecordedVotes = computed(() =>
    (this.mvpVoteState()?.tally ?? []).reduce((acc, item) => acc + (Number(item.votes) || 0), 0),
  );
  readonly mvpVotesProgressLabel = computed(() => {
    const eligible = this.mvpTotalEligibleVotes();
    if (eligible <= 0) {
      return '';
    }
    return `${this.mvpTotalRecordedVotes()}/${eligible} votos MVP`;
  });
  readonly mvpProgressHint = computed(() => {
    const eligible = this.mvpTotalEligibleVotes();
    if (eligible <= 0) {
      return '';
    }

    const recorded = this.mvpTotalRecordedVotes();
    const winnerAlias = this.mvpVoteState()?.winnerAlias;
    if (winnerAlias) {
      return `Votacion cerrada. MVP definido: ${winnerAlias}.`;
    }
    if (this.canOpenMvpVote()) {
      return `Votos registrados: ${recorded}/${eligible}. Cuando se complete el ${eligible}/${eligible}, la votacion se cerrara automaticamente.`;
    }
    return `La votacion cerro con ${recorded}/${eligible} votos registrados.`;
  });
  readonly finalizedScoreLabel = computed(() => {
    const match = this.match();
    if (!match || match.finalScoreLocal === undefined || match.finalScoreAway === undefined) {
      return '';
    }
    return `${match.finalScoreLocal} - ${match.finalScoreAway}`;
  });
  readonly finalizedResolutionLabel = computed(() => {
    const match = this.match();
    if (!match || !this.isFinalized()) {
      return '';
    }

    if (match.mvpUserAlias) {
      return `Cierre competitivo consolidado. MVP confirmado: ${match.mvpUserAlias}.`;
    }

    if (this.canOpenMvpVote()) {
      return 'Partido finalizado con historial y XP base consolidados. Falta definir el MVP.';
    }

    return 'Partido finalizado. La ventana MVP ya cerro.';
  });
  readonly currentUserUuid = computed(() => this.authSessionService.currentSession?.user?.atletaUuid ?? '');
  readonly currentUserParticipantStatus = computed(() => {
    const me = this.currentUserUuid();
    if (!me) {
      return null;
    }
    return this.participants().find((item) => item.userId === me)?.status ?? null;
  });
  readonly currentUserInvitation = computed(() => {
    const me = this.currentUserUuid();
    const backendMatchId = this.match()?.backendMatchId;
    if (!me || !backendMatchId) {
      return null;
    }

    return (
      this.invitationsStore
        .invitations()
        .find((item) => item.backendMatchId === backendMatchId && item.targetUuid === me) ?? null
    );
  });
  readonly canRespondInvitationInMatch = computed(() => {
    if (this.isCreator() || this.isFinalized()) {
      return false;
    }
    const participantStatus = this.currentUserParticipantStatus();
    if (participantStatus === PlayerInvitationStatus.PENDING || participantStatus === PlayerInvitationStatus.INVITED) {
      return true;
    }

    const inviteStatus = this.currentUserInvitation()?.status;
    return inviteStatus === PlayerInvitationStatus.PENDING || inviteStatus === PlayerInvitationStatus.INVITED;
  });

  readonly selectedTheme = computed(() => {
    const themeId = this.match()?.themeId || DEFAULT_MATCH_THEME_ID;
    return this.themes.find((theme) => theme.id === themeId) ?? this.themes[0];
  });

  get bottomNavItems(): ReadonlyArray<MetallicBottomNavItem> {
    return buildMainBottomNav('matches', this.notificationBadgeService.totalPending());
  }

  constructor() {
    this.nowTimer = window.setInterval(() => this.now.set(Date.now()), 60000);

    effect(() => {
      const lifecycle = this.state()?.lifecycleState;
      if (!lifecycle) {
        return;
      }

      const message = lifecycleToUserLabel(lifecycle);
      this.statusFeedback.set(message);
      if (this.feedbackTimer) {
        window.clearTimeout(this.feedbackTimer);
      }
      this.feedbackTimer = window.setTimeout(() => this.statusFeedback.set(null), 2500);
    });

    effect(() => {
      const canShowTeams = this.canShowTeams();
      const confirmed = this.confirmedParticipants().length;
      const home = this.assignedHomePlayers().length;
      const away = this.assignedAwayPlayers().length;

      const previous = this.lastTeamDistributionSnapshot;
      this.lastTeamDistributionSnapshot = { confirmed, home, away };

      if (!canShowTeams || !previous) {
        return;
      }

      const confirmedIncreased = confirmed > previous.confirmed;
      const distributionChanged = home !== previous.home || away !== previous.away;
      const hasBothSides = home > 0 && away > 0;

      if (!confirmedIncreased || !distributionChanged || !hasBothSides) {
        return;
      }

      this.teamBalanceFeedback.set('Equipos balanceados automaticamente tras la nueva confirmacion.');
      if (this.teamBalanceFeedbackTimer) {
        window.clearTimeout(this.teamBalanceFeedbackTimer);
      }
      this.teamBalanceFeedbackTimer = window.setTimeout(() => this.teamBalanceFeedback.set(null), 3000);
    });

    effect(() => {
      const match = this.match();
      const confirmedPlayers = this.confirmedPlayers();
      const assignedHomePlayers = this.assignedHomePlayers();
      const assignedAwayPlayers = this.assignedAwayPlayers();
      const hasStarted = this.hasMatchStarted();
      const isCreator = this.isCreator();

      if (!match || !isCreator || confirmedPlayers.length < 2 || hasStarted) {
        this.autoPersistedTeamsSignature = null;
        return;
      }

      const signature = this.buildAutoPersistTeamsSignature(match.id, confirmedPlayers);
      const assignedIds = new Set([...assignedHomePlayers, ...assignedAwayPlayers].map((player) => player.uuid));
      const hasFullAssignment =
        assignedHomePlayers.length > 0 &&
        assignedAwayPlayers.length > 0 &&
        assignedIds.size === confirmedPlayers.length &&
        confirmedPlayers.every((player) => assignedIds.has(player.uuid));

      if (hasFullAssignment) {
        this.autoPersistedTeamsSignature = signature;
        return;
      }

      if (this.autoPersistTeamsInFlight || this.autoPersistedTeamsSignature === signature) {
        return;
      }

      this.autoPersistedTeamsSignature = signature;
      void this.autoPersistBalancedTeams(match.id, confirmedPlayers);
    });

    effect(() => {
      const routeMatchId = this.routeMatchId();
      const match = this.match();

      if (!routeMatchId || match?.status !== MatchStatus.FINISHED || !match.backendMatchId) {
        this.lastLoadedMvpRouteMatchId = null;
        return;
      }

      if (this.lastLoadedMvpRouteMatchId === routeMatchId) {
        return;
      }

      this.lastLoadedMvpRouteMatchId = routeMatchId;
      void this.mvpVoteStore.refresh(routeMatchId, true);
    });
  }

  ionViewWillEnter(): void {
    void this.loadOnEnter();
  }

  private async loadOnEnter(): Promise<void> {
    await this.enterLoadGuard.runSingle(async () => {
      await Promise.all([
        this.notificationBadgeService.refresh(),
        this.invitationsStore.loadPendingInvitations(),
        this.loadRouteMatch(true),
      ]);
    });
  }

  ionViewWillLeave(): void {
    const localId = this.localMatchId();
    if (localId) {
      this.matchLiveService.stopWatching(localId);
    }
  }

  ngOnDestroy(): void {
    if (this.nowTimer) {
      window.clearInterval(this.nowTimer);
    }
    if (this.feedbackTimer) {
      window.clearTimeout(this.feedbackTimer);
    }
    if (this.teamBalanceFeedbackTimer) {
      window.clearTimeout(this.teamBalanceFeedbackTimer);
    }
    if (this.teamAssignmentErrorTimer) {
      window.clearTimeout(this.teamAssignmentErrorTimer);
    }

    const localId = this.localMatchId();
    if (localId) {
      this.matchLiveService.stopWatching(localId);
    }
  }

  onSegmentChange(segment: ParticipantSegment): void {
    this.selectedParticipantSegment.set(segment);
  }

  async onTeamsChange(payload: { home: Player[]; away: Player[] }): Promise<void> {
    if (!this.canEditTeams()) {
      return;
    }

    const match = this.match();
    if (!match) {
      return;
    }

    try {
      await this.matchService.setTeams(match.id, payload.home, payload.away);
      this.teamAssignmentError.set(null);
      await this.matchStore.refresh(this.routeMatchId(), true);
    } catch (error) {
      const message = this.errorMapper.toUserMessage(error, 'matches');
      this.teamAssignmentError.set(message);
      if (this.teamAssignmentErrorTimer) {
        window.clearTimeout(this.teamAssignmentErrorTimer);
      }
      this.teamAssignmentErrorTimer = window.setTimeout(() => this.teamAssignmentError.set(null), 5000);
      await this.appToastService.error(message);
    }
  }

  async onRemindPending(): Promise<void> {
    const missing = this.progress()?.missing ?? 0;
    try {
      await this.notificationService.notifyAlmostReady(missing);
      await this.appToastService.success('Recordatorio enviado a pendientes.');
    } catch (error) {
      await this.appToastService.error(this.errorMapper.toUserMessage(error, 'matches'));
    }
  }

  onInviteMore(): void {
    const backendMatchId = this.match()?.backendMatchId;
    void this.navigationService.safeNavigate(['/social'], {
      queryParams: {
        tab: 'friends',
        matchId: backendMatchId ?? this.routeMatchId(),
      },
    });
  }

  async onAcceptFromMatchState(): Promise<void> {
    await this.respondFromMatchState(true);
  }

  async onDeclineFromMatchState(): Promise<void> {
    await this.respondFromMatchState(false);
  }

  async onFinishMatch(): Promise<void> {
    const routeMatchId = this.routeMatchId();
    if (!routeMatchId) {
      return;
    }
    void this.navigationService.safeNavigate(['/matches', routeMatchId, 'close']);
  }

  private async autoPersistBalancedTeams(matchId: string, confirmedPlayers: Player[]): Promise<void> {
    this.autoPersistTeamsInFlight = true;
    try {
      const balanced = buildBalancedTeams(confirmedPlayers);
      await this.matchService.setTeams(matchId, balanced.home, balanced.away);
    } catch {
      // Evita ruido al usuario; el siguiente cambio real de roster reintentara.
    } finally {
      this.autoPersistTeamsInFlight = false;
    }
  }

  private buildAutoPersistTeamsSignature(matchId: string, players: Player[]): string {
    const playerIds = players.map((player) => player.uuid).sort().join(',');
    return `${matchId}:${playerIds}`;
  }

  private formatCloseTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  onRetry(): void {
    void this.loadRouteMatch(true);
  }

  onNavItemSelected(itemId: string): void {
    void this.navigationService.goToMainBottomSection(itemId);
  }

  onOpenMvpVote(): void {
    const routeMatchId = this.routeMatchId();
    if (!routeMatchId) {
      return;
    }
    void this.navigationService.safeNavigate(['/matches', routeMatchId, 'mvp-vote']);
  }

  private async respondFromMatchState(accept: boolean): Promise<void> {
    if (!this.canRespondInvitationInMatch() || this.inviteActionLoading()) {
      return;
    }

    const invitation = this.currentUserInvitation();
    const backendMatchId = this.match()?.backendMatchId;
    const actorUuid = this.currentUserUuid();

    if (backendMatchId && actorUuid) {
      this.matchStore.optimisticPatchByBackendMatchId(backendMatchId, {
        actorUuid,
        status: accept ? PlayerInvitationStatus.ACCEPTED : PlayerInvitationStatus.DECLINED,
      });
    }

    this.inviteActionLoading.set(true);
    try {
      if (!invitation?.id) {
        await this.invitationsStore.loadPendingInvitations();
      }

      const current = this.currentUserInvitation();
      if (!current?.id) {
        throw new Error('No se encontro la invitacion pendiente para este partido.');
      }

      const updated = await this.invitationsStore.respondInvitation(current.id, accept);
      if (!updated) {
        throw new Error('No se pudo actualizar la invitacion.');
      }

      if (updated.backendMatchId) {
        await this.matchStore.refreshByBackendMatchId(updated.backendMatchId, true);
      } else if (this.routeMatchId()) {
        await this.matchStore.refresh(this.routeMatchId(), true);
      }

      await this.notificationBadgeService.refresh();
      await this.appToastService.success(accept ? 'Invitacion aceptada.' : 'Invitacion rechazada.');
    } catch (error) {
      await this.appToastService.error(this.errorMapper.toUserMessage(error, 'invitations'));
      if (this.routeMatchId()) {
        await this.matchStore.refresh(this.routeMatchId(), true);
      }
    } finally {
      this.inviteActionLoading.set(false);
    }
  }

  private async loadRouteMatch(force: boolean): Promise<void> {
    const routeMatchId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!routeMatchId) {
      return;
    }

    this.routeMatchId.set(routeMatchId);
    const loaded = force
      ? await this.matchStore.refresh(routeMatchId, true)
      : await this.matchStore.load(routeMatchId);

    if (!loaded) {
      return;
    }

    this.localMatchId.set(loaded.localMatchId);
    this.matchLiveService.watchMatch(loaded.localMatchId);
  }
}
