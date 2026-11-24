import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, HostListener, OnDestroy, ViewChild, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController, IonicModule } from '@ionic/angular';
import { EMPTY, Subject, Subscription, TimeoutError, forkJoin, of } from 'rxjs';
import { catchError, finalize, map, switchMap, takeUntil, timeout } from 'rxjs/operators';
import { ApiError } from 'src/app/core/models/api-error.model';
import { NavigationService, SafeNavigationExtras } from 'src/app/core/services/navigation.service';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { buildMainBottomNav } from 'src/app/shared/navigation/main-bottom-nav';
import { MetallicBottomNavComponent, MetallicBottomNavItem } from 'src/app/shared/ui/metallic-bottom-nav/metallic-bottom-nav.component';
import { MetallicCardComponent } from 'src/app/shared/ui/metallic-card/metallic-card.component';
import { HexagonRole, HexagonRoleStat, MetallicRoleHexagonComponent } from 'src/app/shared/ui/metallic-role-hexagon/metallic-role-hexagon.component';
import { NotificationBadgeService } from 'src/app/features/matches/services/notification-badge.service';
import { RatingsApiService } from 'src/app/features/ratings/services/ratings-api.service';
import { UserApiService } from 'src/app/features/user/services/user-api.service';
import { TeamActiveMember, TeamSummary, teamMemberRoleLabel } from '../../models/team.models';
import { TeamApiService } from '../../services/team-api.service';
import { TeamInvitationAccessService } from '../../services/team-invitation-access.service';

const TEAM_NAME_LIMIT = 100;
const TEAM_NAME_SAVE_TIMEOUT_MS = 30_000;
const TEAM_ADMIN_FORBIDDEN = 'Ya no tienes permiso para administrar este equipo.';

function normalizeTeamName(name: string): string {
  // Use the same boundary whitespace as the backend's Character predicates.
  const whitespace = /[\p{Z}\t-\r\u001c-\u001f]/u;
  let start = 0;
  let end = name.length;
  while (start < end && whitespace.test(name[start])) start++;
  while (start < end && whitespace.test(name[end - 1])) end--;
  return name.slice(start, end);
}

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
  @ViewChild('captainFeedback') private captainFeedback?: ElementRef<HTMLElement>;
  @ViewChild('nameEditorInput') private set nameEditorInput(input: ElementRef<HTMLInputElement> | undefined) {
    this.nameInput = input?.nativeElement;
    if (this.viewActive) this.nameInput?.focus();
  }
  @ViewChild('archiveCancel') private set archiveCancel(button: ElementRef<HTMLButtonElement> | undefined) {
    if (this.viewActive) button?.nativeElement.focus();
  }
  @ViewChild('archiveError') private set archiveError(message: ElementRef<HTMLElement> | undefined) {
    if (this.viewActive) message?.nativeElement.focus();
  }
  private readonly authSessionService = inject(AuthSessionService);
  private readonly alertController = inject(AlertController);
  private readonly route = inject(ActivatedRoute);
  private readonly teamApiService = inject(TeamApiService);
  private readonly teamInvitationAccess = inject(TeamInvitationAccessService);
  private readonly navigationService = inject(NavigationService);
  private readonly userApiService = inject(UserApiService);
  private readonly ratingsApiService = inject(RatingsApiService);
  private readonly notificationBadgeService = inject(NotificationBadgeService);
  private readonly destroy$ = new Subject<void>();
  private teamLoad?: Subscription;
  private viewActive = false;
  private nameInput?: HTMLInputElement;
  private originalName = '';
  private draftConfirmation?: { source: 'navigation' | 'panel'; pending: Promise<boolean> };

  captainTarget = '';
  captainFeedbackText = '';
  isTransferringCaptain = false;
  private isChangingMembership = false;
  adminPanel: 'name' | 'archive' | null = null;
  adminError: { message: string; invalidName?: boolean } | null = null;
  adminPending = false;
  nameDraft = '';
  readonly teamNameLimit = TEAM_NAME_LIMIT;
  team: TeamSummary | null = null;
  members: TeamRosterMember[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  notFound = false;
  archivedTeamName: string | null = null;
  selectedMember: TeamRosterMember | null = null;
  readonly memberRoleLabel = teamMemberRoleLabel;
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

  get isActiveCaptain(): boolean {
    const uuid = this.authSessionService.currentSession?.user.atletaUuid;
    return !!this.team && !!uuid && this.members.some(member => member.playerUuid === uuid && member.rol === 'CAPITAN');
  }

  get captainCandidates(): TeamRosterMember[] {
    const uuid = this.authSessionService.currentSession?.user.atletaUuid;
    return this.members.filter(member => member.playerUuid !== uuid);
  }

  get rosterActionPending(): boolean {
    return this.isTransferringCaptain || this.isChangingMembership || this.adminPending;
  }

  get nameUnchanged(): boolean {
    return normalizeTeamName(this.nameDraft) === normalizeTeamName(this.originalName);
  }

  private get hasUnsavedName(): boolean {
    return this.adminPanel === 'name' && !this.nameUnchanged;
  }

  private get prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  canDeactivate(): boolean | Promise<boolean> {
    if (!this.hasUnsavedName || !this.authSessionService.currentSession) return true;
    if (this.adminPending || this.draftConfirmation?.source === 'panel') return false;
    return this.requestDraftDiscard('navigation');
  }

  @HostListener('window:beforeunload', ['$event'])
  protectDraftOnUnload(event: BeforeUnloadEvent): void {
    if (this.viewActive && this.hasUnsavedName) event.preventDefault();
  }

  openTeamAdmin(panel: 'name' | 'archive'): void {
    if (!this.team || !this.isActiveCaptain || this.rosterActionPending) return;
    this.afterDraftDiscard(() => {
      const team = this.team;
      if (!team || !this.isActiveCaptain || this.rosterActionPending) return;
      const nextPanel = this.adminPanel === panel ? null : panel;
      this.closeTeamAdmin();
      this.adminPanel = nextPanel;
      this.captainFeedbackText = '';
      if (nextPanel === 'name') this.nameDraft = this.originalName = team.nombre;
    });
  }

  cancelTeamAdmin(trigger: HTMLButtonElement): void {
    if (this.adminPending) return;
    this.afterDraftDiscard(() => {
      this.closeTeamAdmin();
      trigger.focus();
    });
  }

  private afterDraftDiscard(action: () => void): void {
    if (!this.hasUnsavedName) {
      action();
      return;
    }
    if (this.draftConfirmation) return;
    void this.requestDraftDiscard('panel').then(discard => {
      if (discard && this.viewActive && this.adminPanel === 'name' && !this.adminPending) action();
    });
  }

  private requestDraftDiscard(source: 'navigation' | 'panel'): Promise<boolean> {
    if (this.draftConfirmation) return this.draftConfirmation.pending;

    const pending = this.showDiscardDialog().finally(() => { this.draftConfirmation = undefined; });
    this.draftConfirmation = { source, pending };
    return pending;
  }

  private async showDiscardDialog(): Promise<boolean> {
    try {
      const alert = await this.alertController.create({
        header: '¿Descartar cambios?',
        message: 'El nombre que escribiste aún no se ha guardado.',
        animated: !this.prefersReducedMotion,
        buttons: [
          { text: 'Seguir editando', role: 'cancel', cssClass: 'keep-team-draft' },
          { text: 'Descartar cambios', role: 'destructive' },
        ],
      });
      await alert.present();
      alert.querySelector<HTMLButtonElement>('.keep-team-draft')?.focus();
      if ((await alert.onDidDismiss()).role === 'destructive') return true;
    } catch {
      // Preserve the draft if Ionic cannot present the confirmation.
    }
    if (this.viewActive && this.adminPanel === 'name') this.nameInput?.focus();
    return false;
  }

  saveTeamName(input: HTMLInputElement): void {
    const team = this.team;
    const actorUuid = this.authSessionService.currentSession?.user.atletaUuid;
    if (!team || !actorUuid || this.adminPanel !== 'name' || !this.isActiveCaptain
      || this.rosterActionPending || this.nameUnchanged || this.draftConfirmation) return;

    const name = normalizeTeamName(this.nameDraft);
    if (!name || name.length > TEAM_NAME_LIMIT || /[\p{Cc}\p{Cs}]/u.test(name)) {
      this.adminError = {
        message: `Escribe un nombre válido de 1 a ${TEAM_NAME_LIMIT} caracteres, sin caracteres de control.`,
        invalidName: true,
      };
      input.focus();
      return;
    }

    this.adminPending = true;
    this.adminError = null;
    this.captainFeedbackText = 'Guardando nombre…';
    this.teamApiService.getActiveMembers(team.id)
      .pipe(
        switchMap(members => {
          const sameActor = this.authSessionService.currentSession?.user.atletaUuid === actorUuid;
          if (sameActor && members.some(member => member.playerUuid === actorUuid && member.rol === 'CAPITAN')) {
            return this.teamApiService.updateTeamName(team.id, name);
          }
          this.teamInvitationAccess.invalidate(team.id);
          this.closeTeamAdmin();
          this.showCaptainFeedback(TEAM_ADMIN_FORBIDDEN);
          this.loadTeam(false, members);
          return EMPTY;
        }),
        timeout({ first: TEAM_NAME_SAVE_TIMEOUT_MS }),
        takeUntil(this.destroy$),
        finalize(() => (this.adminPending = false)),
      )
      .subscribe({
        next: updatedTeam => {
          if (this.team?.id === team.id) this.team = { ...this.team, ...updatedTeam };
          this.closeTeamAdmin();
          this.showCaptainFeedback('Nombre del equipo actualizado.');
        },
        error: (error: ApiError | TimeoutError) => {
          if (error instanceof TimeoutError) {
            this.captainFeedbackText = '';
            this.adminError = { message: 'No se pudo confirmar el guardado a tiempo. Puedes volver a intentarlo.' };
          } else {
            this.handleTeamAdminError(error, team.id, 'name');
          }
          if (this.viewActive && this.adminPanel === 'name') input.focus();
        },
      });
  }

  archiveTeam(): void {
    const team = this.team;
    const actorUuid = this.authSessionService.currentSession?.user.atletaUuid;
    if (!team || !actorUuid || this.adminPanel !== 'archive' || !this.isActiveCaptain || this.rosterActionPending) return;

    this.adminPending = true;
    this.adminError = null;
    this.captainFeedbackText = 'Archivando equipo…';
    this.teamApiService.deleteTeam(team.id, actorUuid)
      .pipe(takeUntil(this.destroy$), finalize(() => (this.adminPending = false)))
      .subscribe({
        next: () => {
          this.teamInvitationAccess.invalidate(team.id);
          this.closeTeamAdmin();
          this.teamLoad?.unsubscribe();
          this.team = null;
          this.members = [];
          this.archivedTeamName = team.nombre;
          this.showCaptainFeedback(`Equipo ${team.nombre} archivado.`);
          if (this.viewActive) {
            this.onBackToSocial();
          }
        },
        error: (error: ApiError) => this.handleTeamAdminError(error, team.id, 'archive'),
      });
  }

  private closeTeamAdmin(): void {
    this.adminPanel = null;
    this.adminError = null;
    this.nameDraft = '';
    this.originalName = '';
  }

  private handleTeamAdminError(error: ApiError, teamId: number, action: 'name' | 'archive'): void {
    if (error.status === 401 || error.status === 403 || error.status === 404) {
      this.teamInvitationAccess.invalidate(teamId);
      this.closeTeamAdmin();
      if (error.status === 403) {
        this.showCaptainFeedback(TEAM_ADMIN_FORBIDDEN);
        this.loadTeam();
      } else {
        this.teamLoad?.unsubscribe();
        this.team = null;
        this.members = [];
        this.showCaptainFeedback(error.status === 401
          ? 'Tu sesión ya no es válida. Vuelve a iniciar sesión.'
          : 'El equipo ya no está disponible.');
        this.showError(error.status === 401
          ? 'Vuelve a iniciar sesión para consultar el plantel.'
          : 'Vuelve a Social para consultar tus equipos activos.', error.status === 404);
      }
      return;
    }

    this.captainFeedbackText = '';
    if (action === 'archive') {
      this.adminError = { message: 'No se pudo archivar el equipo. Puedes volver a intentarlo.' };
    } else if (error.status === 409) {
      this.adminError = { message: 'Ese nombre ya está en uso. Prueba con otro.', invalidName: true };
    } else if (error.status === 400) {
      this.adminError = { message: 'El nombre no es válido. Revisa el texto e inténtalo de nuevo.', invalidName: true };
    } else {
      this.adminError = { message: 'No se pudo guardar el nombre. Puedes volver a intentarlo.' };
    }
  }

  get canLeaveTeam(): boolean {
    const uuid = this.authSessionService.currentSession?.user.atletaUuid;
    return !!this.team && !!uuid && !this.isActiveCaptain && this.members.some(member => member.playerUuid === uuid);
  }

  leaveTeam(): void {
    const team = this.team;
    if (!team || this.rosterActionPending || !this.canLeaveTeam) return;
    if (!window.confirm(`¿Abandonar el equipo ${team.nombre}?`)) return;

    this.isChangingMembership = true;
    this.captainFeedbackText = 'Abandonando el equipo…';
    this.teamApiService.leaveTeam(team.id)
      .pipe(takeUntil(this.destroy$), finalize(() => (this.isChangingMembership = false)))
      .subscribe({
        next: () => {
          this.showCaptainFeedback(`Abandonaste el equipo ${team.nombre}.`);
          this.loadTeam();
        },
        error: (error: ApiError) => {
          if (error.status === 409) {
            this.showCaptainFeedback('Transfiere la capitanía antes de abandonar el equipo.');
            this.loadTeam();
          } else if (error.status === 404) {
            this.showCaptainFeedback('Tu membresía o el equipo ya no están disponibles.');
            this.loadTeam();
          } else {
            this.showCaptainFeedback('No se pudo abandonar el equipo. Puedes volver a intentarlo.');
          }
        },
      });
  }

  canRemoveMember(member: TeamActiveMember): boolean {
    return this.isActiveCaptain && member.rol === 'JUGADOR' && !member.esDt
      && member.playerUuid !== this.authSessionService.currentSession?.user.atletaUuid;
  }

  removeMember(playerUuid: string): void {
    if (this.rosterActionPending || !this.team) return;
    const target = this.members.find(member => member.playerUuid === playerUuid);
    if (!target || !this.canRemoveMember(target)) return;
    if (!window.confirm(`¿Retirar a ${target.alias} del equipo?`)) return;

    this.isChangingMembership = true;
    this.captainFeedbackText = 'Retirando integrante…';
    this.teamApiService.removeMember(this.team.id, target.playerUuid)
      .pipe(takeUntil(this.destroy$), finalize(() => (this.isChangingMembership = false)))
      .subscribe({
        next: () => {
          this.showCaptainFeedback(`Retiraste a ${target.alias} del equipo.`);
          this.loadTeam();
        },
        error: (error: ApiError) => {
          if (error.status === 403) {
            this.showCaptainFeedback('Ya no tienes permiso para retirar integrantes.');
            this.loadTeam();
            return;
          }
          this.showCaptainFeedback('No se pudo retirar al integrante. Puedes volver a intentarlo.');
        },
      });
  }

  transferCaptain(): void {
    if (this.rosterActionPending || !this.team || !this.isActiveCaptain) return;
    const target = this.captainCandidates.find(member => member.playerUuid === this.captainTarget);
    if (!target) {
      this.showCaptainFeedback('Selecciona a otro integrante activo del equipo.');
      return;
    }
    if (!window.confirm(`¿Confirmas la transferencia de capitanía a ${target.alias}?`)) return;

    this.isTransferringCaptain = true;
    this.captainFeedbackText = 'Transfiriendo capitanía…';
    const teamId = this.team.id;
    this.teamApiService.transferCaptain(teamId, target.playerUuid)
      .pipe(takeUntil(this.destroy$), finalize(() => (this.isTransferringCaptain = false)))
      .subscribe({
        next: () => {
          this.teamInvitationAccess.invalidate(teamId);
          this.showCaptainFeedback('Capitanía transferida. Actualizando el plantel…');
          this.loadTeam(true);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 403 || error.status === 404) {
            this.teamInvitationAccess.invalidate(teamId);
            this.showCaptainFeedback(error.status === 403
              ? 'Ya no tienes permiso para transferir la capitanía.'
              : 'El equipo ya no está disponible.');
            this.loadTeam();
            return;
          }
          this.showCaptainFeedback(error.status === 400
            ? 'El destino ya no es válido. Actualiza el plantel antes de volver a intentarlo.'
            : 'No se pudo transferir la capitanía. Puedes volver a intentarlo.');
          if (error.status === 400) this.loadTeam();
        },
      });
  }

  private showCaptainFeedback(message: string): void {
    this.captainFeedbackText = message;
    if (this.viewActive) this.captainFeedback?.nativeElement.focus();
  }

  ionViewWillEnter(): void {
    this.viewActive = true;
    this.loadTeam();
  }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
  onRetry(): void {
    if (this.adminPending) return;
    this.captainFeedbackText = '';
    this.loadTeam();
  }
  onBackToSocial(): void {
    const extras: SafeNavigationExtras = { queryParams: { tab: 'teams' } };
    if (this.archivedTeamName !== null) {
      extras.replaceUrl = true;
      extras.state = { archivedTeamName: this.archivedTeamName };
      if (this.prefersReducedMotion) extras.animated = false;
    }
    void this.navigationService.safeNavigate(['/social'], extras);
  }
  openPlayer(member: TeamRosterMember): void { this.selectedMember = member; }
  playerRoleRating(member: TeamRosterMember, role: HexagonRole): number | null {
    return member.roleStats.find(stat => stat.role === role)?.rating ?? null;
  }
  ionViewWillLeave(): void {
    this.viewActive = false;
    this.closeTeamAdmin();
    this.selectedMember = null;
    this.captainFeedbackText = '';
  }
  onBack(): void { void this.navigationService.goBackOrProfile(); }
  onNavItemSelected(itemId: string): void { void this.navigationService.goToMainBottomSection(itemId); }

  get bottomNavItems(): ReadonlyArray<MetallicBottomNavItem> {
    return buildMainBottomNav('profile', this.notificationBadgeService.totalPending());
  }

  private loadTeam(afterTransfer = false, activeMembers?: TeamActiveMember[]): void {
    const teamId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isSafeInteger(teamId) || teamId <= 0) {
      this.showError('El equipo solicitado no es válido.', true);
      return;
    }
    this.teamLoad?.unsubscribe();
    if (afterTransfer || this.adminPanel !== 'name') this.closeTeamAdmin();
    this.isLoading = true;
    this.captainTarget = '';
    this.selectedMember = null;
    this.team = null;
    this.members = [];
    this.errorMessage = null;
    this.notFound = false;
    this.archivedTeamName = null;
    this.teamLoad = forkJoin({
      team: this.teamApiService.getById(teamId),
      members: activeMembers ? of(activeMembers) : this.teamApiService.getActiveMembers(teamId),
    })
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
        next: ({ team, members }) => {
          this.team = team;
          this.members = members;
          if (afterTransfer) this.captainFeedbackText = 'Capitanía transferida. Plantel actualizado.';
          if (this.adminPanel === 'name' && !this.isActiveCaptain) {
            this.teamInvitationAccess.invalidate(teamId);
            this.closeTeamAdmin();
            this.showCaptainFeedback(TEAM_ADMIN_FORBIDDEN);
          }
        },
        error: (error: HttpErrorResponse) => {
          if (afterTransfer) this.captainFeedbackText = 'Capitanía transferida. Queda pendiente actualizar el plantel.';
          if (this.adminPanel === 'name' && (error.status === 401 || error.status === 403 || error.status === 404)) {
            this.teamInvitationAccess.invalidate(teamId);
            this.closeTeamAdmin();
            if (error.status === 403) this.showCaptainFeedback(TEAM_ADMIN_FORBIDDEN);
          }
          this.showError(
            error.status === 404 ? 'Este equipo ya no está disponible.' : 'No pudimos cargar el equipo. Intenta nuevamente.',
            error.status === 404,
          );
        },
      });
  }

  private showError(message: string, notFound: boolean): void {
    this.errorMessage = message;
    this.notFound = notFound;
    this.isLoading = false;
  }
}
