import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AppToastService } from 'src/app/core/services/app-toast.service';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { ErrorMapperService } from 'src/app/core/services/error-mapper.service';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { buildMainBottomNav } from 'src/app/shared/navigation/main-bottom-nav';
import { MetallicButtonComponent } from 'src/app/shared/ui/metallic-button/metallic-button.component';
import {
  MetallicBottomNavComponent,
  MetallicBottomNavItem,
} from 'src/app/shared/ui/metallic-bottom-nav/metallic-bottom-nav.component';
import { MetallicCardComponent } from 'src/app/shared/ui/metallic-card/metallic-card.component';
import { MatchSummaryCardComponent, TeamEventSummary } from '../../components/match-summary-card/match-summary-card.component';
import { ScoreEditorComponent } from '../../components/score-editor/score-editor.component';
import { MatchState } from '../../models/match-state.models';
import { XpRewardCardComponent, XpRewardItem } from '../../components/xp-reward-card/xp-reward-card.component';
import {
  MatchClosePreviewResponse,
  MatchResponse,
  MatchPlayerSummary,
  MatchStatus as BackendMatchStatus,
} from '../../models/match.models';
import { MatchService } from '../../services/match.service';
import { MatchesApiService } from '../../services/matches-api.service';
import { NotificationBadgeService } from '../../services/notification-badge.service';
import { MatchStore } from '../../stores/match.store';

interface ClosePlayerOption {
  userId: string;
  name: string;
  teamId?: number;
  teamLabel: 'LOCAL' | 'VISITA';
  position: string;
}

@Component({
  selector: 'app-match-close-page',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    MetallicBottomNavComponent,
    MetallicCardComponent,
    MetallicButtonComponent,
    MatchSummaryCardComponent,
    ScoreEditorComponent,
    XpRewardCardComponent,
  ],
  templateUrl: './match-close.page.html',
  styleUrls: ['./match-close.page.scss'],
})
export class MatchClosePage {
  private readonly route = inject(ActivatedRoute);
  private readonly navigationService = inject(NavigationService);
  private readonly matchStore = inject(MatchStore);
  private readonly matchesApiService = inject(MatchesApiService);
  private readonly matchService = inject(MatchService);
  private readonly notificationBadgeService = inject(NotificationBadgeService);
  private readonly errorMapper = inject(ErrorMapperService);
  private readonly appToast = inject(AppToastService);
  private readonly authSessionService = inject(AuthSessionService);

  readonly iconBase = 'assets/icons/atleta';
  readonly titleIconAsset = `${this.iconBase}/ic_status_finished_24.svg`;
  readonly adjustIconAsset = `${this.iconBase}/ic_action_edit_24.svg`;
  readonly rewardIconAsset = `${this.iconBase}/ic_comp_xp_24.svg`;

  readonly step = signal<1 | 2 | 3>(1);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly closedSuccess = signal(false);

  readonly routeMatchId = signal('');
  readonly localMatchId = signal('');
  readonly matchResponse = signal<MatchResponse | null>(null);
  private readonly playersTableWrap = viewChild<HTMLElement>('playersTableWrap');

  readonly homeName = signal('Local');
  readonly awayName = signal('Visita');
  readonly homeColor = signal('Azul');
  readonly awayColor = signal('Rojo');
  readonly homeScore = signal(0);
  readonly awayScore = signal(0);

  readonly players = signal<ClosePlayerOption[]>([]);
  readonly isCreator = signal(false);

  readonly goalCounts = signal<Record<string, number>>({});
  readonly baselineGoalCounts = signal<Record<string, number>>({});
  readonly closePreview = signal<MatchClosePreviewResponse | null>(null);

  readonly assignedHomeGoals = computed(() =>
    this.players()
      .filter((player) => player.teamLabel === 'LOCAL')
      .reduce((acc, player) => acc + this.getCount(this.goalCounts(), player.userId), 0),
  );

  readonly assignedAwayGoals = computed(() =>
    this.players()
      .filter((player) => player.teamLabel === 'VISITA')
      .reduce((acc, player) => acc + this.getCount(this.goalCounts(), player.userId), 0),
  );

  readonly localPlayers = computed(() =>
    this.players().filter((player) => player.teamLabel === 'LOCAL'),
  );

  readonly awayPlayers = computed(() =>
    this.players().filter((player) => player.teamLabel === 'VISITA'),
  );

  readonly homeEvents = computed<TeamEventSummary[]>(() =>
    this.players()
      .filter((player) => player.teamLabel === 'LOCAL')
      .map((player) => {
        const goals = this.getCount(this.goalCounts(), player.userId);
        return {
          icon: goals > 0 ? '⚽' : '🎯',
          text: `${player.name}${goals > 0 ? ` (${goals} gol${goals > 1 ? 'es' : ''})` : ''}`,
          goals,
        };
      })
      .filter((item) => item.goals > 0)
      .map((item) => ({ icon: item.icon, text: item.text })),
  );

  readonly awayEvents = computed<TeamEventSummary[]>(() =>
    this.players()
      .filter((player) => player.teamLabel === 'VISITA')
      .map((player) => {
        const goals = this.getCount(this.goalCounts(), player.userId);
        return {
          icon: goals > 0 ? '⚽' : '🎯',
          text: `${player.name}${goals > 0 ? ` (${goals} gol${goals > 1 ? 'es' : ''})` : ''}`,
          goals,
        };
      })
      .filter((item) => item.goals > 0)
      .map((item) => ({ icon: item.icon, text: item.text })),
  );

  readonly xpRewards = computed<XpRewardItem[]>(() =>
    (this.closePreview()?.players?.length
      ? this.players().map((player) => {
          const preview = this.closePreview()?.players.find((item) => item.playerUuid === player.userId);
          const totalXp = preview?.estimatedXp ?? 0;
          const fromLevel = Math.max(1, Math.floor(40 / 10));
          const toLevel = Math.max(fromLevel, Math.floor((40 + totalXp) / 10));
          const progress = Math.min(100, ((40 + totalXp) % 10) * 10);

          return {
            id: player.userId,
            playerName: player.name,
            position: player.position,
            xp: totalXp,
            currentOvr: preview?.currentHybridOvr ?? null,
            fromLevel,
            toLevel,
            progressPercent: progress,
          };
        })
      : this.players().map((player) => {
      const goals = this.getCount(this.goalCounts(), player.userId);
      const base = 10;
      const result = this.resultXpFor(player.teamLabel);
      const goalXp = goals * this.goalXpByPosition(player.position);
      const totalXp = base + result + goalXp;
      const fromLevel = Math.max(1, Math.floor(40 / 10));
      const toLevel = Math.max(fromLevel, Math.floor((40 + totalXp) / 10));
      const progress = Math.min(100, ((40 + totalXp) % 10) * 10);

      return {
        id: player.userId,
        playerName: player.name,
        position: player.position,
        xp: totalXp,
        currentOvr: null,
        fromLevel,
        toLevel,
        progressPercent: progress,
      };
    })),
  );

  readonly canContinue = computed(() => {
    if (this.step() === 1) {
      return this.players().length > 0 && this.scoreboardMatchesAssignedGoals();
    }
    return true;
  });

  readonly scoreboardMatchesAssignedGoals = computed(() =>
    this.assignedHomeGoals() === this.homeScore() && this.assignedAwayGoals() === this.awayScore(),
  );

  constructor() {
    effect(() => {
      const currentStep = this.step();
      const playerCount = this.players().length;
      const wrap = this.playersTableWrap();
      if (currentStep !== 1 || playerCount === 0 || !wrap) {
        return;
      }

      queueMicrotask(() => {
        const currentWrap = this.playersTableWrap();
        if (currentWrap) {
          currentWrap.scrollTop = 0;
        }
      });
    });
  }

  get bottomNavItems(): ReadonlyArray<MetallicBottomNavItem> {
    return buildMainBottomNav('matches', this.notificationBadgeService.totalPending());
  }

  ionViewWillEnter(): void {
    void this.notificationBadgeService.refresh();
    void this.load();
  }

  onBackStep(): void {
    if (this.step() === 1) {
      void this.navigationService.goBackOrProfile();
      return;
    }
    this.step.set((this.step() - 1) as 1 | 2 | 3);
  }

  onNextStep(): void {
    if (!this.canContinue() || this.step() === 3) {
      return;
    }
    const nextStep = (this.step() + 1) as 1 | 2 | 3;
    this.step.set(nextStep);
    if (nextStep === 3) {
      void this.loadClosePreview();
    }
  }

  onRetry(): void {
    void this.load();
  }

  onOpenMvp(): void {
    const routeMatchId = this.routeMatchId();
    if (!routeMatchId) {
      return;
    }
    void this.navigationService.safeNavigate(['/matches', routeMatchId, 'mvp-vote']);
  }

  onNavItemSelected(itemId: string): void {
    if (itemId === 'home') {
      void this.navigationService.safeNavigate(['/home']);
      return;
    }
    if (itemId === 'matches') {
      void this.navigationService.safeNavigate(['/matches']);
      return;
    }
    if (itemId === 'ranking') {
      void this.navigationService.safeNavigate(['/leaderboard']);
      return;
    }
    if (itemId === 'profile') {
      void this.navigationService.safeNavigate(['/player/profile']);
    }
  }

  onHomeScoreChange(nextScore: number): void {
    if (nextScore < this.assignedHomeGoals()) {
      void this.appToast.error('Primero ajusta los goles asignados a jugadores locales.');
      return;
    }
    this.homeScore.set(nextScore);
  }

  onAwayScoreChange(nextScore: number): void {
    if (nextScore < this.assignedAwayGoals()) {
      void this.appToast.error('Primero ajusta los goles asignados a jugadores visitantes.');
      return;
    }
    this.awayScore.set(nextScore);
  }

  incrementGoal(playerId: string): void {
    if (!this.isCreator()) {
      return;
    }

    const player = this.players().find((item) => item.userId === playerId);
    if (!player) {
      return;
    }

    const assigned = player.teamLabel === 'LOCAL' ? this.assignedHomeGoals() : this.assignedAwayGoals();
    const limit = player.teamLabel === 'LOCAL' ? this.homeScore() : this.awayScore();

    if (assigned >= limit) {
      void this.appToast.error('Aumenta primero el marcador global de ese equipo.');
      return;
    }

    this.goalCounts.update((state) => ({
      ...state,
      [playerId]: this.getCount(state, playerId) + 1,
    }));
  }

  decrementGoal(playerId: string): void {
    if (!this.isCreator()) {
      return;
    }

    this.goalCounts.update((state) => {
      const current = this.getCount(state, playerId);
      if (current <= 0) {
        return state;
      }

      return {
        ...state,
        [playerId]: current - 1,
      };
    });
  }

  async onConfirmClose(): Promise<void> {
    if (this.saving() || !this.isCreator()) {
      return;
    }

    const localMatchId = this.localMatchId();
    if (!localMatchId) {
      return;
    }

    this.saving.set(true);
    try {
      const backendMatchId = this.matchResponse()?.id;
      if (backendMatchId) {
        await this.ensureMatchStartedForClose(backendMatchId);
      }

      for (const player of this.players()) {
        const goalDelta = this.getCount(this.goalCounts(), player.userId) - this.getCount(this.baselineGoalCounts(), player.userId);

        if (!player.teamId) {
          continue;
        }

        for (let i = 0; i < goalDelta; i += 1) {
          await this.matchService.registerMatchEvent({
            matchId: localMatchId,
            playerUuid: player.userId,
            teamId: player.teamId,
            eventType: 'GOL',
          });
        }
      }

      await this.matchService.finishMatch(localMatchId);
      await this.matchStore.refresh(this.routeMatchId(), true);
      this.closedSuccess.set(true);
      await this.appToast.success('Partido finalizado y recompensas aplicadas.');
    } catch (error) {
      await this.appToast.error(this.errorMapper.toUserMessage(error, 'matches'));
    } finally {
      this.saving.set(false);
    }
  }

  private async ensureMatchStartedForClose(backendMatchId: number): Promise<void> {
    const actorUuid = this.authSessionService.currentSession?.user?.atletaUuid;
    if (!actorUuid) {
      throw new Error('Sesion no disponible para iniciar el partido.');
    }

    const latest = await firstValueFrom(this.matchesApiService.getById(backendMatchId));
    const status = latest.estado as BackendMatchStatus;

    if (status === 'INICIADO' || status === 'FINALIZADO') {
      return;
    }

    if (status === 'INVALIDO') {
      throw new Error('El partido esta marcado como invalido y no puede cerrarse.');
    }

    await firstValueFrom(this.matchesApiService.updateMatchStatus(backendMatchId, 'INICIADO', actorUuid));
  }

  trackByPlayerId(_index: number, item: ClosePlayerOption): string {
    return item.userId;
  }

  private async load(): Promise<void> {
    const routeMatchId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!routeMatchId) {
      return;
    }

    this.routeMatchId.set(routeMatchId);
    this.loading.set(true);
    this.error.set(null);

    try {
      const state = await this.matchStore.refresh(routeMatchId, true);
      if (!state?.backendMatchId) {
        throw new Error('No se pudo resolver el partido en backend.');
      }

      this.localMatchId.set(state.localMatchId);
      this.homeColor.set(state.match.homeKitColor || 'Azul');
      this.awayColor.set(state.match.awayKitColor || 'Rojo');
      const currentUser = this.authSessionService.currentSession?.user?.atletaUuid ?? '';
      this.isCreator.set(!!currentUser && state.match.creatorUuid === currentUser);

      const response = await firstValueFrom(this.matchesApiService.getById(state.backendMatchId));
      if (!response) {
        throw new Error('No se pudo cargar detalle de cierre.');
      }

      this.matchResponse.set(response);
      const localTeam = response.matchTeams?.find((t) => t.esLocal);
      const awayTeam = response.matchTeams?.find((t) => !t.esLocal);
      const baseTeamName = localTeam?.team?.nombre ?? awayTeam?.team?.nombre ?? state.match.team.name ?? 'Club';
      if (localTeam && awayTeam) {
        this.homeName.set(localTeam.team?.nombre ?? `${baseTeamName} Local`);
        this.awayName.set(awayTeam.team?.nombre ?? `${baseTeamName} Visita`);
      } else {
        this.homeName.set(`${baseTeamName} Local`);
        this.awayName.set(`${baseTeamName} Visita`);
      }

      const playerOptions = this.buildPlayers(response.players ?? [], state);
      this.players.set(playerOptions);

      const initialGoalCounts = this.buildInitialGoalCounts(response);
      this.goalCounts.set(initialGoalCounts);
      this.baselineGoalCounts.set({ ...initialGoalCounts });
      this.closePreview.set(null);

      const scoreLocal = Number(response.finalScoreLocal ?? localTeam?.goles ?? 0);
      const scoreAway = Number(response.finalScoreAway ?? awayTeam?.goles ?? 0);
      this.homeScore.set(Math.max(scoreLocal, this.calculateTeamGoals(playerOptions, initialGoalCounts, 'LOCAL')));
      this.awayScore.set(Math.max(scoreAway, this.calculateTeamGoals(playerOptions, initialGoalCounts, 'VISITA')));
    } catch (error) {
      this.error.set(this.errorMapper.toUserMessage(error, 'matches'));
    } finally {
      this.loading.set(false);
    }
  }

  private buildPlayers(players: MatchPlayerSummary[], storeState: MatchState): ClosePlayerOption[] {
    const localTeamId = this.matchResponse()?.matchTeams?.find((item) => item.esLocal)?.team?.id;
    const awayTeamId = this.matchResponse()?.matchTeams?.find((item) => !item.esLocal)?.team?.id;
    const responsePlayersByUuid = new Map(
      (players ?? [])
        .filter((item) => !!item.player?.atletaUuid)
        .map((item) => [item.player!.atletaUuid, item] as const),
    );
    const seen = new Set<string>();

    const fromAssignedTeams = [
      ...storeState.match.homePlayers
        .map((player) => {
          const responsePlayer = responsePlayersByUuid.get(player.uuid);
          return {
            userId: player.uuid,
            name: responsePlayer?.player?.alias ?? player.name ?? 'Jugador',
            teamId: localTeamId ?? responsePlayer?.team?.id ?? player.teamId,
            teamLabel: 'LOCAL' as const,
            position: responsePlayer?.position?.nombre ?? player.position ?? 'Sin posicion',
          };
        }),
      ...storeState.match.awayPlayers
        .map((player) => {
          const responsePlayer = responsePlayersByUuid.get(player.uuid);
          return {
            userId: player.uuid,
            name: responsePlayer?.player?.alias ?? player.name ?? 'Jugador',
            teamId: awayTeamId ?? responsePlayer?.team?.id ?? player.teamId,
            teamLabel: 'VISITA' as const,
            position: responsePlayer?.position?.nombre ?? player.position ?? 'Sin posicion',
          };
        }),
    ].filter((item) => {
      if (seen.has(item.userId)) {
        return false;
      }
      seen.add(item.userId);
      return true;
    });

    if (fromAssignedTeams.length > 0) {
      return fromAssignedTeams;
    }

    const fallbackFromParticipants = storeState.confirmedParticipants.map((participant, index) => ({
      userId: participant.userId,
      name: participant.name || `Jugador ${index + 1}`,
      teamId: participant.teamSide === 'AWAY' ? awayTeamId : localTeamId,
      teamLabel:
        participant.teamSide === 'AWAY'
          ? ('VISITA' as const)
          : ('LOCAL' as const),
      position: participant.position ?? responsePlayersByUuid.get(participant.userId)?.position?.nombre ?? 'Sin posicion',
    }));

    const uniqueFallback = fallbackFromParticipants.filter((item) => {
      if (seen.has(item.userId)) {
        return false;
      }
      seen.add(item.userId);
      return true;
    });

    return uniqueFallback;
  }

  private buildInitialGoalCounts(response: MatchResponse): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const event of response.events ?? []) {
      if (event.eventType !== 'GOL') {
        continue;
      }
      const scorer = event.player?.atletaUuid;
      if (!scorer) {
        continue;
      }
      counts[scorer] = this.getCount(counts, scorer) + 1;
    }
    return counts;
  }

  private calculateTeamGoals(players: ClosePlayerOption[], goals: Record<string, number>, teamLabel: 'LOCAL' | 'VISITA'): number {
    return players
      .filter((player) => player.teamLabel === teamLabel)
      .reduce((acc, player) => acc + this.getCount(goals, player.userId), 0);
  }

  private getCount(source: Record<string, number>, userId: string): number {
    return source[userId] ?? 0;
  }

  private resultXpFor(teamLabel: 'LOCAL' | 'VISITA'): number {
    if (this.homeScore() === this.awayScore()) {
      return 0;
    }

    if ((teamLabel === 'LOCAL' && this.homeScore() > this.awayScore()) || (teamLabel === 'VISITA' && this.awayScore() > this.homeScore())) {
      return 10;
    }

    return 5;
  }

  private goalXpByPosition(position: string): number {
    const normalized = position.toUpperCase();
    if (normalized.includes('DEF')) {
      return 15;
    }
    if (normalized.includes('MED')) {
      return 12;
    }
    return 10;
  }

  private async loadClosePreview(): Promise<void> {
    const backendMatchId = this.matchResponse()?.id;
    if (!backendMatchId) {
      return;
    }

    const goalsByPlayer = this.players().reduce<Record<string, number>>((acc, player) => {
      acc[player.userId] = this.getCount(this.goalCounts(), player.userId);
      return acc;
    }, {});

    try {
      const preview = await firstValueFrom(
        this.matchesApiService.getClosePreview(backendMatchId, {
          goalsByPlayer,
          finalScoreLocal: this.homeScore(),
          finalScoreAway: this.awayScore(),
        }),
      );
      this.closePreview.set(preview);
    } catch {
      this.closePreview.set(null);
    }
  }
}

