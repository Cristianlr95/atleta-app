import { CommonModule } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subscription, interval, startWith } from 'rxjs';
import { AppToastService } from 'src/app/core/services/app-toast.service';
import { ErrorMapperService } from 'src/app/core/services/error-mapper.service';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { buildMainBottomNav } from 'src/app/shared/navigation/main-bottom-nav';
import { MetallicButtonComponent } from 'src/app/shared/ui/metallic-button/metallic-button.component';
import {
  MetallicBottomNavComponent,
  MetallicBottomNavItem,
} from 'src/app/shared/ui/metallic-bottom-nav/metallic-bottom-nav.component';
import { MetallicCardComponent } from 'src/app/shared/ui/metallic-card/metallic-card.component';
import { MetallicFormSectionComponent } from 'src/app/shared/ui/metallic-form-section/metallic-form-section.component';
import { MvpCountdownComponent } from '../../components/mvp-countdown/mvp-countdown.component';
import { PlayerVoteCardComponent } from '../../components/player-vote-card/player-vote-card.component';
import { NotificationBadgeService } from '../../services/notification-badge.service';
import { MvpVoteStore } from '../../stores/mvp-vote.store';

@Component({
  selector: 'app-match-mvp-vote-page',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    MetallicBottomNavComponent,
    MetallicCardComponent,
    MetallicFormSectionComponent,
    MetallicButtonComponent,
    MvpCountdownComponent,
    PlayerVoteCardComponent,
  ],
  templateUrl: './match-mvp-vote.page.html',
  styleUrls: ['./match-mvp-vote.page.scss'],
})
export class MatchMvpVotePage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly mvpVoteStore = inject(MvpVoteStore);
  private readonly appToastService = inject(AppToastService);
  private readonly errorMapper = inject(ErrorMapperService);
  private readonly navigationService = inject(NavigationService);
  private readonly notificationBadgeService = inject(NotificationBadgeService);

  private countdownSub?: Subscription;
  private readonly routeMatchId = signal('');

  readonly remainingLabel = signal('00:00:00');
  readonly votingProcessing = signal<string | null>(null);

  readonly resource = computed(() => this.mvpVoteStore.getStateSnapshot(this.routeMatchId()));
  readonly loading = computed(() => this.resource().loading);
  readonly loadError = computed(() => this.resource().error);
  readonly state = computed(() => this.resource().data);
  readonly candidates = computed(() => this.state()?.candidates ?? []);
  readonly tally = computed(() => this.state()?.tally ?? []);
  readonly isOpen = computed(() => this.state()?.isOpen ?? false);
  readonly myVote = computed(() => this.state()?.myVote ?? null);
  readonly winnerAlias = computed(() => this.state()?.winnerAlias ?? null);
  readonly totalEligibleVotes = computed(() => this.candidates().length);
  readonly totalRecordedVotes = computed(() =>
    this.tally().reduce((acc, item) => acc + (Number(item.votes) || 0), 0),
  );
  readonly votesProgressLabel = computed(() => `${this.totalRecordedVotes()}/${this.totalEligibleVotes()} votos`);
  readonly voteCards = computed(() =>
    this.candidates().map((candidate, index) => ({
      userId: candidate.userId,
      name: candidate.alias || candidate.userId,
      teamLabel: index % 2 === 0 ? 'Equipo Local' : 'Equipo Visita',
      accent: index % 2 === 0 ? '#4a88d6' : '#d66e4a',
    })),
  );

  readonly voteHint = computed(() =>
    this.winnerAlias()
      ? 'La votacion se cerro automaticamente y el MVP ya fue definido.'
      : this.isOpen()
        ? 'Tu voto puede cambiarse durante 3 horas o hasta que voten todos los jugadores confirmados.'
        : 'La votacion termino. Ya no se puede modificar el voto.',
  );
  readonly voteProgressHint = computed(() => {
    const eligible = this.totalEligibleVotes();
    const recorded = this.totalRecordedVotes();

    if (eligible <= 0) {
      return '';
    }

    if (this.winnerAlias()) {
      return `Votacion cerrada con ${recorded}/${eligible} votos registrados.`;
    }

    if (this.isOpen()) {
      return `Votos registrados: ${recorded}/${eligible}. Cuando se complete el ${eligible}/${eligible}, la votacion se cierra automaticamente.`;
    }

    return `La votacion cerro con ${recorded}/${eligible} votos registrados.`;
  });

  get bottomNavItems(): ReadonlyArray<MetallicBottomNavItem> {
    return buildMainBottomNav('matches', this.notificationBadgeService.totalPending());
  }

  ionViewWillEnter(): void {
    void this.notificationBadgeService.refresh();
    void this.load(true);
  }

  ionViewWillLeave(): void {
    this.stopCountdown();
  }

  ngOnDestroy(): void {
    this.stopCountdown();
  }

  async onVote(candidateUserId: string): Promise<void> {
    if (!this.isOpen() || this.votingProcessing()) {
      return;
    }

    this.votingProcessing.set(candidateUserId);
    try {
      const next = await this.mvpVoteStore.vote(this.routeMatchId(), candidateUserId);
      this.startCountdown(next?.closesAt ?? null);
      await this.appToastService.success('Tu voto MVP fue registrado.');
    } catch (error) {
      await this.appToastService.error(this.errorMapper.toUserMessage(error, 'matches'));
      await this.mvpVoteStore.refresh(this.routeMatchId(), true);
    } finally {
      this.votingProcessing.set(null);
    }
  }

  onRetry(): void {
    void this.load(true);
  }

  onBackToMatch(): void {
    const routeMatchId = this.routeMatchId();
    void this.navigationService.safeNavigate(['/matches', routeMatchId]);
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

  private async load(force: boolean): Promise<void> {
    const routeMatchId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!routeMatchId) {
      return;
    }

    this.routeMatchId.set(routeMatchId);
    const loaded = force
      ? await this.mvpVoteStore.refresh(routeMatchId, true)
      : await this.mvpVoteStore.load(routeMatchId);

    this.startCountdown(loaded?.closesAt ?? null);
  }

  private startCountdown(closesAt: string | null): void {
    this.stopCountdown();
    if (!closesAt) {
      this.remainingLabel.set('00:00:00');
      return;
    }

    this.countdownSub = interval(1000)
      .pipe(startWith(0))
      .subscribe(() => {
        const ms = new Date(closesAt).getTime() - Date.now();
        if (ms <= 0) {
          this.remainingLabel.set('00:00:00');
          this.stopCountdown();
          void this.mvpVoteStore.refresh(this.routeMatchId(), true);
          return;
        }

        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        this.remainingLabel.set(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
            .toString()
            .padStart(2, '0')}`,
        );
      });
  }

  private stopCountdown(): void {
    this.countdownSub?.unsubscribe();
    this.countdownSub = undefined;
  }
}
