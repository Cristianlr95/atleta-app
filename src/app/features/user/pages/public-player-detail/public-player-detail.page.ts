import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { MetallicCardComponent } from 'src/app/shared/ui/metallic-card/metallic-card.component';
import { PageNavComponent } from 'src/app/shared/ui/page-nav/page-nav.component';
import { PlayerProfile } from '../../models/user.models';
import { UserApiService } from '../../services/user-api.service';

@Component({
  selector: 'app-public-player-detail-page',
  standalone: true,
  imports: [CommonModule, IonicModule, MetallicCardComponent, PageNavComponent],
  templateUrl: './public-player-detail.page.html',
  styleUrls: ['./public-player-detail.page.scss'],
})
export class PublicPlayerDetailPage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly userApiService = inject(UserApiService);
  private readonly navigationService = inject(NavigationService);
  private readonly destroy$ = new Subject<void>();

  readonly titleIconAsset = 'assets/icons/atleta/ic_nav_profile_24.svg';
  profile: PlayerProfile | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  notFound = false;

  ionViewWillEnter(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRetry(): void {
    this.loadProfile();
  }

  onBackToSocial(): void {
    void this.navigationService.safeNavigate(['/social']);
  }

  genderLabel(gender: PlayerProfile['genero']): string {
    const labels = { MASCULINO: 'Masculino', FEMENINO: 'Femenino', OTRO: 'Otro' };
    return gender ? labels[gender] : 'Sin especificar';
  }

  private loadProfile(): void {
    const uuid = this.route.snapshot.paramMap.get('uuid');
    if (!uuid) {
      this.showError('El jugador solicitado no es valido.', true);
      return;
    }

    this.isLoading = true;
    this.profile = null;
    this.errorMessage = null;
    this.notFound = false;
    this.userApiService
      .getPublicPlayerProfile(uuid)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false)),
      )
      .subscribe({
        next: (profile) => (this.profile = profile),
        error: (error: HttpErrorResponse) =>
          this.showError(
            error.status === 404
              ? 'Este perfil ya no esta disponible.'
              : 'No pudimos cargar el perfil. Intenta nuevamente.',
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
