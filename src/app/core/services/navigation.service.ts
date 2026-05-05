import { Location } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private lockedUntil = 0;
  private readonly lockMs = 450;

  async safeNavigate(commands: readonly string[], extras?: NavigationExtras): Promise<boolean> {
    if (!this.canNavigate()) {
      return false;
    }

    this.lock();
    try {
      return await this.router.navigate([...commands], extras);
    } catch {
      return false;
    }
  }

  async safeNavigateByUrl(url: string): Promise<boolean> {
    if (!this.canNavigate()) {
      return false;
    }

    if (this.router.url === url) {
      return true;
    }

    this.lock();
    try {
      return await this.router.navigateByUrl(url);
    } catch {
      return false;
    }
  }

  async goToProfile(): Promise<boolean> {
    return this.safeNavigate(['/player/profile']);
  }

  async goBackOrProfile(): Promise<boolean> {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
      return true;
    }
    return this.goToProfile();
  }

  private canNavigate(): boolean {
    return Date.now() > this.lockedUntil;
  }

  private lock(): void {
    this.lockedUntil = Date.now() + this.lockMs;
  }
}
