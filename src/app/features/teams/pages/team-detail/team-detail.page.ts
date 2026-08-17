import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subject, forkJoin } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { MetallicCardComponent } from 'src/app/shared/ui/metallic-card/metallic-card.component';
import { PageNavComponent } from 'src/app/shared/ui/page-nav/page-nav.component';
import { TeamActiveMember, TeamSummary } from '../../models/team.models';
import { TeamApiService } from '../../services/team-api.service';

@Component({
  selector: 'app-team-detail-page',
  standalone: true,
  imports: [CommonModule, IonicModule, MetallicCardComponent, PageNavComponent],
  templateUrl: './team-detail.page.html',
  styleUrls: ['./team-detail.page.scss'],
})
export class TeamDetailPage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly teamApiService = inject(TeamApiService);
  private readonly navigationService = inject(NavigationService);
  private readonly destroy$ = new Subject<void>();

  readonly titleIconAsset = 'assets/icons/atleta/ic_match_lineup_24.svg';
  team: TeamSummary | null = null;
  members: TeamActiveMember[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  notFound = false;

  ionViewWillEnter(): void { this.loadTeam(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
  onRetry(): void { this.loadTeam(); }
  onBackToSocial(): void { void this.navigationService.safeNavigate(['/social'], { queryParams: { tab: 'teams' } }); }
  onOpenPlayer(playerUuid: string): void { void this.navigationService.safeNavigate(['/players', playerUuid]); }

  private loadTeam(): void {
    const teamId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isSafeInteger(teamId) || teamId <= 0) {
      this.showError('El equipo solicitado no es valido.', true);
      return;
    }
    this.isLoading = true;
    this.team = null;
    this.members = [];
    this.errorMessage = null;
    this.notFound = false;
    forkJoin({ team: this.teamApiService.getById(teamId), members: this.teamApiService.getActiveMembers(teamId) })
      .pipe(takeUntil(this.destroy$), finalize(() => (this.isLoading = false)))
      .subscribe({
        next: ({ team, members }) => { this.team = team; this.members = members; },
        error: (error: HttpErrorResponse) => this.showError(
          error.status === 404 ? 'Este equipo ya no esta disponible.' : 'No pudimos cargar el equipo. Intenta nuevamente.',
          error.status === 404,
        ),
      });
  }

  private showError(message: string, notFound: boolean): void {
    this.errorMessage = message;
    this.notFound = notFound;
    this.isLoading = false;
  }
}
