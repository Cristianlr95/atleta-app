import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { MetallicButtonComponent } from '../metallic-button/metallic-button.component';

@Component({
  selector: 'app-page-nav',
  standalone: true,
  imports: [CommonModule, MetallicButtonComponent],
  templateUrl: './page-nav.component.html',
  styleUrls: ['./page-nav.component.scss'],
})
export class PageNavComponent {
  private readonly navigationService = inject(NavigationService);

  @Input() showBack = true;
  @Input() showProfile = true;

  onBack(): void {
    void this.navigationService.goBackOrProfile();
  }

  onProfile(): void {
    void this.navigationService.goToProfile();
  }
}
