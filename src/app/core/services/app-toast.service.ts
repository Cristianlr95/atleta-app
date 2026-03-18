import { inject, Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

type ToastType = 'success' | 'error' | 'info';

@Injectable({ providedIn: 'root' })
export class AppToastService {
  private readonly toastController = inject(ToastController);

  async success(message: string): Promise<void> {
    await this.present(message, 'success');
  }

  async error(message: string): Promise<void> {
    await this.present(message, 'error');
  }

  async info(message: string): Promise<void> {
    await this.present(message, 'info');
  }

  private async present(message: string, type: ToastType): Promise<void> {
    const cssClass =
      type === 'success'
        ? 'toast-success'
        : type === 'error'
          ? 'toast-error'
          : 'toast-info';

    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      cssClass,
    });
    await toast.present();
  }
}
