import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, finalize, map, switchMap, takeUntil } from 'rxjs/operators';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { buildMainBottomNav } from 'src/app/shared/navigation/main-bottom-nav';
import { MetallicBottomNavComponent, MetallicBottomNavItem } from 'src/app/shared/ui/metallic-bottom-nav/metallic-bottom-nav.component';
import { MetallicCardComponent } from 'src/app/shared/ui/metallic-card/metallic-card.component';
import { HexagonRole, HexagonRoleStat, MetallicRoleHexagonComponent } from 'src/app/shared/ui/metallic-role-hexagon/metallic-role-hexagon.component';
import { NotificationBadgeService } from 'src/app/features/matches/services/notification-badge.service';
import { RatingsApiService } from 'src/app/features/ratings/services/ratings-api.service';
import { UserApiService } from 'src/app/features/user/services/user-api.service';
import { TeamActiveMember, TeamSummary } from '../../models/team.models';
import { TeamApiService } from '../../services/team-api.service';

interface TeamRosterMember extends TeamActiveMember {
  pictureUrl: string | null;
  ovr: number | null;
  roleStats: HexagonRoleStat[];
  ratingUnavailable: boolean;
  matchesPlayed: number | null;
}

@Component({
  selector: 'app-team-detail-page',
  standalone: true,
  imports: [CommonModule, IonicModule, MetallicCardComponent, MetallicBottomNavComponent, MetallicRoleHexagonComponent],
  templateUrl: './team-detail.page.html',
  styleUrls: ['./team-detail.page.scss'],
})
export class TeamDetailPage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly teamApiService = inject(TeamApiService);
  private readonly navigationService = inject(NavigationService);
  private readonly userApiService = inject(UserApiService);
  private readonly ratingsApiService = inject(RatingsApiService);
  private readonly notificationBadgeService = inject(NotificationBadgeService);
  private readonly destroy$ = new Subject<void>();

  team: TeamSummary | null = null;
  members: TeamRosterMember[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  notFound = false;
  selectedMember: TeamRosterMember | null = null;
  readonly roles: HexagonRole[] = ['ATAQUE', 'MEDIOCAMPO', 'CARRILERO', 'DEFENSA', 'ARQUERO', 'DT'];

  get ratedMembers(): TeamRosterMember[] {
    return this.members.filter(member => !member.ratingUnavailable && member.ovr !== null && Number.isFinite(member.ovr));
  }

  get teamOvr(): number | null {
    const rated = this.ratedMembers;
    return rated.length ? rated.reduce((sum, member) => sum + member.ovr!, 0) / rated.length : null;
  }

  get teamRoleStats(): HexagonRoleStat[] {
    return this.roles.reduce<HexagonRoleStat[]>((stats, role) => {
      const values = this.members.map(member => member.roleStats.find(stat => stat.role === role)?.rating)
        .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
      if (values.length) stats.push({ role, rating: values.reduce((sum, value) => sum + value, 0) / values.length });
      return stats;
    }, []);
  }

  ionViewWillEnter(): void { this.loadTeam(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
  onRetry(): void { this.loadTeam(); }
  onBackToSocial(): void { void this.navigationService.safeNavigate(['/social'], { queryParams: { tab: 'teams' } }); }
  openPlayer(member: TeamRosterMember): void { this.selectedMember = member; }
  playerRoleRating(member: TeamRosterMember, role: HexagonRole): number | null {
    return member.roleStats.find(stat => stat.role === role)?.rating ?? null;
  }
  ionViewWillLeave(): void { this.selectedMember = null; }
  onBack(): void { void this.navigationService.goBackOrProfile(); }
  onNavItemSelected(itemId: string): void { void this.navigationService.goToMainBottomSection(itemId); }

  get bottomNavItems(): ReadonlyArray<MetallicBottomNavItem> {
    return buildMainBottomNav('profile', this.notificationBadgeService.totalPending());
  }

  private loadTeam(): void {
    const teamId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isSafeInteger(teamId) || teamId <= 0) {
      this.showError('El equipo solicitado no es valido.', true);
      return;
    }
    this.isLoading = true;
    this.selectedMember = null;
    this.team = null;
    this.members = [];
    this.errorMessage = null;
    this.notFound = false;
    forkJoin({ team: this.teamApiService.getById(teamId), members: this.teamApiService.getActiveMembers(teamId) })
      .pipe(
        switchMap(({ team, members }) =>
          (members.length === 0 ? of([] as TeamRosterMember[]) : forkJoin(
            members.map((member) =>
              forkJoin({
                profile: this.userApiService.getPublicPlayerProfile(member.playerUuid).pipe(catchError(() => of(null))),
                overall: this.ratingsApiService.getOverall(member.playerUuid).pipe(
                  map(value => ({ value, unavailable: false })),
                  catchError(error => of({ value: null, unavailable: error.status !== 404 })),
                ),
              }).pipe(
                map(({ profile, overall }) => ({
                  ...member,
                  pictureUrl: profile?.pictureUrl ?? null,
                  ovr: overall.value?.hybridOVR ?? null,
                  ratingUnavailable: overall.unavailable,
                  matchesPlayed: typeof overall.value?.totalMatchesPlayed === 'number' && Number.isSafeInteger(overall.value.totalMatchesPlayed) && overall.value.totalMatchesPlayed >= 0 ? overall.value.totalMatchesPlayed : null,
                  roleStats: this.roles.reduce<HexagonRoleStat[]>((stats, role) => {
                    const value = overall.value?.roleBreakdown?.[role];
                    if (typeof value === 'number' && Number.isFinite(value)) stats.push({ role, rating: value });
                    return stats;
                  }, []),
                })),
              ),
            ),
          )).pipe(map(roster => ({ team, members: roster }))),
        ),
      )
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
