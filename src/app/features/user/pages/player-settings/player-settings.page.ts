import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AppToastService } from 'src/app/core/services/app-toast.service';
import { AuthSessionService } from 'src/app/core/services/auth-session.service';
import { ErrorMapperService } from 'src/app/core/services/error-mapper.service';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { MetallicCardComponent } from 'src/app/shared/ui/metallic-card/metallic-card.component';
import { MetallicFormSectionComponent } from 'src/app/shared/ui/metallic-form-section/metallic-form-section.component';
import { UserApiService } from '../../services/user-api.service';

@Component({
  selector: 'app-player-settings',
  standalone: true,
  templateUrl: './player-settings.page.html',
  styleUrls: ['./player-settings.page.scss'],
  imports: [CommonModule, FormsModule, IonicModule, MetallicCardComponent, MetallicFormSectionComponent],
})
export class PlayerSettingsPage {
  private readonly authSessionService = inject(AuthSessionService);
  private readonly userApiService = inject(UserApiService);
  private readonly appToastService = inject(AppToastService);
  private readonly errorMapper = inject(ErrorMapperService);
  private readonly navigationService = inject(NavigationService);

  readonly iconBase = 'assets/icons/atleta-raster-v1';
  readonly settingsTitleIconAsset = `${this.iconBase}/ic_auth_security_96.png`;
  readonly securitySectionIconAsset = `${this.iconBase}/ic_auth_security_96.png`;

  currentPassword = '';
  newPassword = '';
  confirmNewPassword = '';
  passwordChangeLoading = false;
  passwordChangeMessage: string | null = null;
  passwordChangeError: string | null = null;

  goBack(): void {
    void this.navigationService.goBackOrProfile();
  }

  async onChangePassword(): Promise<void> {
    if (this.passwordChangeLoading) {
      return;
    }

    const atletaUuid = this.authSessionService.currentSession?.user?.atletaUuid;
    this.passwordChangeMessage = null;
    this.passwordChangeError = null;

    if (!atletaUuid) {
      this.passwordChangeError = 'No se encontro una sesion valida.';
      return;
    }
    if (this.currentPassword.length < 8 || this.newPassword.length < 8) {
      this.passwordChangeError = 'La contrasena actual y la nueva deben tener al menos 8 caracteres.';
      return;
    }
    if (this.newPassword.length > 100) {
      this.passwordChangeError = 'La nueva contrasena no puede superar 100 caracteres.';
      return;
    }
    if (this.newPassword !== this.confirmNewPassword) {
      this.passwordChangeError = 'La confirmacion no coincide con la nueva contrasena.';
      return;
    }
    if (this.currentPassword === this.newPassword) {
      this.passwordChangeError = 'La nueva contrasena debe ser distinta a la actual.';
      return;
    }

    this.passwordChangeLoading = true;
    try {
      await firstValueFrom(
        this.userApiService.changePassword(atletaUuid, {
          currentPassword: this.currentPassword,
          newPassword: this.newPassword,
        }),
      );
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmNewPassword = '';
      this.passwordChangeMessage = 'Contrasena actualizada correctamente.';
      await this.appToastService.success(this.passwordChangeMessage);
    } catch (error) {
      this.passwordChangeError = this.errorMapper.toUserMessage(error, 'default');
    } finally {
      this.passwordChangeLoading = false;
    }
  }
}
