import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AppToastService } from 'src/app/core/services/app-toast.service';
import { ErrorMapperService } from 'src/app/core/services/error-mapper.service';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { TeamSummary } from 'src/app/features/teams/models/team.models';
import { TeamApiService } from 'src/app/features/teams/services/team-api.service';
import { MetallicButtonComponent } from 'src/app/shared/ui/metallic-button/metallic-button.component';
import { MetallicCardComponent } from 'src/app/shared/ui/metallic-card/metallic-card.component';
import { MetallicFormSectionComponent } from 'src/app/shared/ui/metallic-form-section/metallic-form-section.component';
import { MetallicProgressComponent } from 'src/app/shared/ui/metallic-progress/metallic-progress.component';
import { MetallicSelectComponent, MetallicSelectOption } from 'src/app/shared/ui/metallic-select/metallic-select.component';
import { PageNavComponent } from 'src/app/shared/ui/page-nav/page-nav.component';
import { MatchGenderCategory, MatchSize, MatchType, Player } from '../../models/progressive-match.models';
import { MatchService } from '../../services/match.service';
import { MatchScheduleFormComponent, MatchScheduleValue } from '../../components/match-schedule-form/match-schedule-form.component';
import { MatchTypeSelectorComponent } from '../../components/match-type-selector/match-type-selector.component';
import { PlayerSelectListComponent } from '../../components/player-select-list/player-select-list.component';
import { RatingsApiService } from 'src/app/features/ratings/services/ratings-api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-matches-create-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MetallicCardComponent,
    MetallicFormSectionComponent,
    MetallicProgressComponent,
    PageNavComponent,
    MetallicButtonComponent,
    MatchTypeSelectorComponent,
    MatchScheduleFormComponent,
    PlayerSelectListComponent,
    MetallicSelectComponent,
  ],
  templateUrl: './matches-create.page.html',
  styleUrls: ['./matches-create.page.scss'],
})
export class MatchesCreatePage {
  private readonly authSessionService = inject(AuthSessionService);
  private readonly teamApiService = inject(TeamApiService);
  private readonly ratingsApiService = inject(RatingsApiService);
  readonly matchService = inject(MatchService);
  private readonly navigationService = inject(NavigationService);
  private readonly appToastService = inject(AppToastService);
  private readonly errorMapper = inject(ErrorMapperService);
  private readonly router = inject(Router);

  readonly step = signal(1);
  readonly totalSteps = 4;

  readonly iconBase = 'assets/icons/atleta';
  readonly titleIconAsset = `${this.iconBase}/ic_match_create_24.svg`;
  readonly typeIconAsset = `${this.iconBase}/ic_match_format_24.svg`;
  readonly scheduleIconAsset = `${this.iconBase}/ic_match_calendar_24.svg`;
  readonly playersIconAsset = `${this.iconBase}/ic_match_invite_24.svg`;
  readonly confirmIconAsset = `${this.iconBase}/ic_action_accept_24.svg`;

  readonly teams = signal<TeamSummary[]>([]);
  readonly loadingTeams = signal(false);
  readonly loadingPlayers = signal(false);
  readonly loadTeamsError = signal<string | null>(null);
  readonly loadPlayersError = signal<string | null>(null);
  private loadTeamsInFlight: Promise<void> | null = null;

  readonly selectedMatchType = signal<MatchType | null>(null);
  readonly schedule = signal<MatchScheduleValue>({
    teamId: null,
    modality: MatchSize.FIVE_VS_FIVE,
    genderCategory: MatchGenderCategory.MIXED,
    scheduledAt: '',
    location: '',
    venue: null,
    minRequired: 10,
    maxPlayers: 12,
  });

  readonly teamPlayers = signal<Player[]>([]);
  readonly selectedPlayerIds = signal<string[]>([]);
  readonly isSending = signal(false);
  readonly kitColors = signal({
    home: 'Azul',
    away: 'Rojo',
  });

  readonly kitColorOptions: MetallicSelectOption[] = [
    { label: 'Azul', value: 'Azul' },
    { label: 'Rojo', value: 'Rojo' },
    { label: 'Blanco', value: 'Blanco' },
    { label: 'Negro', value: 'Negro' },
    { label: 'Verde', value: 'Verde' },
    { label: 'Amarillo', value: 'Amarillo' },
    { label: 'Naranjo', value: 'Naranjo' },
    { label: 'Morado', value: 'Morado' },
  ];

  readonly teamOptions = computed<MetallicSelectOption[]>(() =>
    this.teams().map((team) => ({ label: team.nombre, value: String(team.id) })),
  );

  readonly canContinue = computed(() => {
    if (this.step() === 1) {
      return this.selectedMatchType() !== null;
    }

    if (this.step() === 2) {
      const value = this.schedule();
      return (
        !!value.teamId &&
        !!value.location &&
        !!value.venue &&
        !!value.scheduledAt &&
        new Date(value.scheduledAt).getTime() > Date.now()
      );
    }

    if (this.step() === 3) {
      return (
        this.totalInvitedWithCreator() >= this.schedule().minRequired &&
        !!this.kitColors().home &&
        !!this.kitColors().away &&
        this.kitColors().home !== this.kitColors().away
      );
    }

    return true;
  });

  readonly totalInvitedWithCreator = computed(() => this.selectedPlayerIds().length + 1);

  readonly viabilityLabel = computed(() => {
    const total = this.totalInvitedWithCreator();
    const minRequired = this.schedule().minRequired;
    if (total >= minRequired) {
      return `${total}/${minRequired} convocados. Partido viable si todos confirman.`;
    }

    return `${total}/${minRequired} convocados. Faltan ${minRequired - total} para armar partido.`;
  });

  ionViewWillEnter(): void {
    void this.loadTeams();
  }

  onPrevious(): void {
    this.step.update((current) => Math.max(1, current - 1));
  }

  async onContinue(): Promise<void> {
    if (!this.canContinue()) {
      return;
    }

    if (this.step() === 2) {
      await this.loadTeamPlayers();
      if (this.loadPlayersError()) {
        return;
      }
    }

    this.step.update((current) => Math.min(this.totalSteps, current + 1));
  }

  onScheduleChange(value: MatchScheduleValue): void {
    const previousTeamId = this.schedule().teamId;
    this.schedule.set(value);

    if (previousTeamId !== value.teamId) {
      this.selectedPlayerIds.set([]);
      this.teamPlayers.set([]);
    }
  }

  onSelectionChange(playerIds: string[]): void {
    this.selectedPlayerIds.set(playerIds);
  }

  onKitColorChange(team: 'home' | 'away', color: string): void {
    const next = { ...this.kitColors(), [team]: color };
    if (next.home === next.away) {
      next.away = this.kitColorOptions.find((item) => item.value !== next.home)?.value ?? 'Blanco';
    }
    this.kitColors.set(next);
  }

  get matchTypeLabel(): string {
    const type = this.selectedMatchType();
    if (type === MatchType.INTERNAL) {
      return 'Partido con tu equipo';
    }
    if (type === MatchType.FRIENDLY) {
      return 'Partido amistoso';
    }
    if (type === MatchType.POINTS) {
      return 'Partido por los puntos';
    }
    return 'No definido';
  }

  get modalityLabel(): string {
    const modality = this.schedule().modality;
    if (modality === MatchSize.FIVE_VS_FIVE) {
      return 'Fútbol 5 (5 vs 5)';
    }
    if (modality === MatchSize.SIX_VS_SIX) {
      return 'Fútbol 6 (6 vs 6)';
    }
    if (modality === MatchSize.SEVEN_VS_SEVEN) {
      return 'Fútbol 7 (7 vs 7)';
    }
    return 'Modalidad no definida';
  }

  get genderCategoryLabel(): string {
    const category = this.schedule().genderCategory;
    if (category === MatchGenderCategory.WOMEN_ONLY) {
      return 'Solo mujeres';
    }
    if (category === MatchGenderCategory.MEN_ONLY) {
      return 'Solo hombres';
    }
    return 'Mixto';
  }

  async onSendInvitations(): Promise<void> {
    if (this.isSending()) {
      return;
    }

    const type = this.selectedMatchType();
    const value = this.schedule();
    const team = this.teams().find((item) => item.id === value.teamId);

    if (!type || !team) {
      return;
    }

    const selectedPlayers = this.teamPlayers().filter((player) => this.selectedPlayerIds().includes(player.uuid));
    const draft = this.matchService.createDraft({
      type,
      modality: value.modality,
      genderCategory: value.genderCategory,
      team: { id: team.id, name: team.nombre },
      location: value.location,
      venue: value.venue,
      scheduledAt: value.scheduledAt,
      minRequired: value.minRequired,
      maxPlayers: value.maxPlayers,
      homeKitColor: this.kitColors().home,
      awayKitColor: this.kitColors().away,
    });

    this.isSending.set(true);
    let sendingReleased = false;
    let flowCompleted = false;
    const releaseSending = (): void => {
      if (sendingReleased) {
        return;
      }
      sendingReleased = true;
      this.isSending.set(false);
    };

    const rescueTimer = setTimeout(() => {
      if (flowCompleted) {
        return;
      }

      const matchFromStore = this.matchService.getMatchById(draft.id);
      const backendMatchId = matchFromStore?.backendMatchId;
      if (!backendMatchId) {
        return;
      }

      flowCompleted = true;
      releaseSending();
      void this.appToastService.info('Partido creado. Te llevamos al estado del partido mientras termina el envío.');
      void this.navigateToMatchStatus(String(backendMatchId));
    }, 8000);

    const forceReleaseTimer = setTimeout(() => {
      if (!this.isSending()) {
        return;
      }

      flowCompleted = true;
      releaseSending();
      void this.appToastService.error('El envío está tardando demasiado. Te llevamos al estado de partidos.');
      void this.navigateToMatchHistory();
    }, 30000);

    try {
      const created = await this.withTimeout(this.matchService.sendInvitations(draft.id, selectedPlayers), 20000);
      flowCompleted = true;
      const targetMatchId = created?.backendMatchId
        ? String(created.backendMatchId)
        : (created?.id ?? draft.id);
      releaseSending();

      if (created) {
        const invitedCount = selectedPlayers.length;
        const footballMessage = invitedCount <= 1
          ? 'Partido creado correctamente. Convocatoria enviada.'
          : `Partido creado correctamente. Invitaciones enviadas a ${invitedCount} jugadores.`;
        void this.appToastService.success(footballMessage);
      } else {
        void this.appToastService.info('El envío demoró más de lo esperado. Te llevamos al estado del partido igualmente.');
      }

      const navigated = await this.navigateToMatchStatus(targetMatchId);
      if (!navigated) {
        const fallbackToHistory = await this.navigateToMatchHistory();
        if (!fallbackToHistory) {
          void this.appToastService.error('No se pudo abrir el estado del partido. Intenta nuevamente.');
        }
      }
    } catch (error) {
      flowCompleted = true;
      releaseSending();
      await this.appToastService.error(this.errorMapper.toUserMessage(error, 'matches'));
    } finally {
      clearTimeout(rescueTimer);
      clearTimeout(forceReleaseTimer);
      releaseSending();
    }
  }

  onRetryLoadTeams(): void {
    void this.loadTeams(true);
  }

  onRetryLoadPlayers(): void {
    void this.loadTeamPlayers();
  }

  onCancelSending(): void {
    if (!this.isSending()) {
      return;
    }

    this.isSending.set(false);
    void this.appToastService.info('Envio cancelado en pantalla. Revisa el estado del partido en el historial.');
    void this.navigateToMatchHistory();
  }

  private async loadTeams(force = false): Promise<void> {
    const session = this.authSessionService.currentSession;
    if (!session) {
      return;
    }

    if (this.loadTeamsInFlight && !force) {
      await this.loadTeamsInFlight;
      return;
    }

    this.loadingTeams.set(true);
    this.loadTeamsError.set(null);

    this.loadTeamsInFlight = (async () => {
      try {
        const teams = await firstValueFrom(this.teamApiService.getByPlayer(session.user.atletaUuid));
        this.teams.set(teams);
        if (teams.length === 1) {
          this.schedule.update((current) => ({ ...current, teamId: teams[0].id }));
        }
    } catch (error) {
      this.loadTeamsError.set(this.errorMapper.toUserMessage(error, 'matches'));
      } finally {
        this.loadingTeams.set(false);
      }
    })();

    try {
      await this.loadTeamsInFlight;
    } finally {
      this.loadTeamsInFlight = null;
    }
  }

  private async loadTeamPlayers(): Promise<void> {
    const teamId = this.schedule().teamId;
    if (!teamId) {
      return;
    }

    this.loadingPlayers.set(true);
    this.loadPlayersError.set(null);
    try {
      const members = await firstValueFrom(this.teamApiService.getActiveMembers(teamId));
      const players = await Promise.all(
        members.map(async (member) => {
          const ovr = await this.resolvePlayerOvr(member.playerUuid);
          return {
            uuid: member.playerUuid,
            name: member.alias,
            position: member.primaryPositionName ?? 'Sin posición',
            role: member.rol,
            ovr,
          } as Player;
        }),
      );
      this.teamPlayers.set(players);
    } catch (error) {
      this.loadPlayersError.set(this.errorMapper.toUserMessage(error, 'matches'));
    } finally {
      this.loadingPlayers.set(false);
    }
  }

  private async resolvePlayerOvr(playerUuid: string): Promise<number> {
    try {
      const overall = await firstValueFrom(this.ratingsApiService.getOverall(playerUuid));
      const raw = Number(overall?.hybridOVR);
      if (!Number.isFinite(raw)) {
        return 65;
      }
      return Math.round(raw);
    } catch {
      return 65;
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<null>((resolve) => {
          timer = setTimeout(() => resolve(null), timeoutMs);
        }),
      ]);
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  private async navigateToMatchStatus(matchId: string): Promise<boolean> {
    const primary = this.withTimeout(this.router.navigate(['/matches', matchId]), 6000);
    const navigated = await primary;
    if (navigated) {
      return true;
    }

    const fallback = this.withTimeout(this.navigationService.safeNavigate(['/matches', matchId]), 6000);
    return (await fallback) ?? false;
  }

  private async navigateToMatchHistory(): Promise<boolean> {
    const primary = this.withTimeout(this.router.navigate(['/matches/history']), 6000);
    const navigated = await primary;
    if (navigated) {
      return true;
    }

    const fallback = this.withTimeout(this.navigationService.safeNavigate(['/matches/history']), 6000);
    return (await fallback) ?? false;
  }
}


