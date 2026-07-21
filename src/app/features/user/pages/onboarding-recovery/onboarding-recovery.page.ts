import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { AuthService } from 'src/app/features/auth/services/auth.service';
import { MetallicButtonComponent } from 'src/app/shared/ui/metallic-button/metallic-button.component';
import { MetallicCardComponent } from 'src/app/shared/ui/metallic-card/metallic-card.component';

type RecoveryReason = 'offline' | 'server';

@Component({
  selector: 'app-onboarding-recovery',
  standalone: true,
  templateUrl: './onboarding-recovery.page.html',
  styleUrls: ['./onboarding-recovery.page.scss'],
  imports: [CommonModule, IonicModule, MetallicButtonComponent, MetallicCardComponent],
})
export class OnboardingRecoveryPage {
  private readonly route = inject(ActivatedRoute);
  private readonly navigationService = inject(NavigationService);
  private readonly authService = inject(AuthService);

  readonly reason = this.resolveReason(this.route.snapshot.queryParamMap.get('reason'));
  readonly nextUrl = this.resolveNextUrl(this.route.snapshot.queryParamMap.get('next'));
  retrying = false;
  logoutLoading = false;

  get message(): string {
    return this.reason === 'offline'
      ? 'No hay conexion. Revisa tu red y vuelve a intentarlo para validar tu perfil.'
      : 'El servidor no pudo validar tu perfil. Tus datos siguen protegidos y puedes reintentar.';
  }

  async onRetry(): Promise<void> {
    if (this.retrying) {
      return;
    }
    this.retrying = true;
    try {
      await this.navigationService.safeNavigateByUrl(this.nextUrl);
    } finally {
      this.retrying = false;
    }
  }

  async onLogout(): Promise<void> {
    if (this.logoutLoading) {
      return;
    }
    this.logoutLoading = true;
    try {
      await this.authService.logout();
    } finally {
      await this.navigationService.goToLoginAfterLogout();
      this.logoutLoading = false;
    }
  }

  private resolveReason(value: string | null): RecoveryReason {
    return value === 'offline' ? 'offline' : 'server';
  }

  private resolveNextUrl(value: string | null): string {
    return value?.startsWith('/') && !value.startsWith('//')
      ? value
      : '/player/profile';
  }
}
