import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { NotificationBadgeService } from 'src/app/features/matches/services/notification-badge.service';
import { TeamCreatorComponent } from 'src/app/features/teams/components/team-creator/team-creator.component';
import { buildMainBottomNav } from 'src/app/shared/navigation/main-bottom-nav';
import {
  MetallicBottomNavComponent,
  MetallicBottomNavItem,
} from 'src/app/shared/ui/metallic-bottom-nav/metallic-bottom-nav.component';
import { MetallicButtonComponent } from 'src/app/shared/ui/metallic-button/metallic-button.component';
import { MetallicCardComponent } from 'src/app/shared/ui/metallic-card/metallic-card.component';
import { PageNavComponent } from 'src/app/shared/ui/page-nav/page-nav.component';
import { AssociatedTeamRosterComponent } from '../../components/associated-team-roster/associated-team-roster.component';

type PlayMode = 'none' | 'team';

@Component({
  selector: 'app-create-session-page',
  standalone: true,
  templateUrl: './create-session.page.html',
  styleUrls: ['./create-session.page.scss'],
  imports: [
    CommonModule,
    IonicModule,
    MetallicCardComponent,
    MetallicButtonComponent,
    MetallicBottomNavComponent,
    PageNavComponent,
    TeamCreatorComponent,
    AssociatedTeamRosterComponent,
  ],
})
export class CreateSessionPage {
  private readonly navigationService = inject(NavigationService);
  private readonly notificationBadgeService = inject(NotificationBadgeService);

  playMode: PlayMode = 'none';
  readonly iconBase = 'assets/icons/atleta';
  readonly sessionTitleIconAsset = `${this.iconBase}/ic_match_create_24.svg`;
  readonly createTeamIconAsset = `${this.iconBase}/ic_match_teams_24.svg`;

  get bottomNavItems(): ReadonlyArray<MetallicBottomNavItem> {
    return buildMainBottomNav('matches', this.notificationBadgeService.totalPending());
  }

  ionViewWillEnter(): void {
    void this.notificationBadgeService.refresh();
  }

  onStartCreateMatchFlow(): void {
    void this.navigationService.safeNavigate(['/matches/create']);
  }

  onStartCreateTeamFlow(): void {
    this.playMode = 'team';
  }

  onTeamCreated(): void {
    this.playMode = 'none';
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
}
