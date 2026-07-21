import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { onboardingCompletedGuard, onboardingPendingGuard } from './core/guards/onboarding.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'password-reset',
    loadComponent: () =>
      import('./features/auth/pages/password-reset/password-reset.page').then((m) => m.PasswordResetPage),
  },
  {
    path: 'home',
    canActivate: [authGuard, onboardingCompletedGuard],
    loadComponent: () =>
      import('./features/dashboard/pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'player/profile',
    canActivate: [authGuard, onboardingCompletedGuard],
    loadComponent: () =>
      import('./features/user/pages/player-profile/player-profile.page').then(
        (m) => m.PlayerProfilePage,
      ),
  },
  {
    path: 'players/:uuid',
    canActivate: [authGuard, onboardingCompletedGuard],
    loadComponent: () =>
      import('./features/user/pages/public-player-detail/public-player-detail.page').then(
        (m) => m.PublicPlayerDetailPage,
      ),
  },
  {
    path: 'teams/:id',
    canActivate: [authGuard, onboardingCompletedGuard],
    loadComponent: () =>
      import('./features/teams/pages/team-detail/team-detail.page').then(
        (m) => m.TeamDetailPage,
      ),
  },
  {
    path: 'player/onboarding',
    canActivate: [authGuard, onboardingPendingGuard],
    loadComponent: () =>
      import('./features/user/pages/player-onboarding/player-onboarding.page').then(
        (m) => m.PlayerOnboardingPage,
      ),
  },
  {
    path: 'player/onboarding-status',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/user/pages/onboarding-recovery/onboarding-recovery.page').then(
        (m) => m.OnboardingRecoveryPage,
      ),
  },
  {
    path: 'sessions/create',
    canActivate: [authGuard, onboardingCompletedGuard],
    loadComponent: () =>
      import('./features/sessions/pages/create-session/create-session.page').then(
        (m) => m.CreateSessionPage,
      ),
  },
  {
    path: 'matches/history',
    canActivate: [authGuard, onboardingCompletedGuard],
    data: { defaultMatchesTab: 'history' },
    loadComponent: () =>
      import('./features/matches/pages/matches-hub/matches-hub.page').then(
        (m) => m.MatchesHubPage,
      ),
  },
  {
    path: 'matches',
    canActivate: [authGuard, onboardingCompletedGuard],
    loadComponent: () =>
      import('./features/matches/pages/matches-hub/matches-hub.page').then(
        (m) => m.MatchesHubPage,
      ),
  },
  {
    path: 'matches/create',
    canActivate: [authGuard, onboardingCompletedGuard],
    loadComponent: () =>
      import('./features/matches/pages/matches-create/matches-create.page').then(
        (m) => m.MatchesCreatePage,
      ),
  },
  {
    path: 'matches/venues/new',
    canActivate: [authGuard, onboardingCompletedGuard],
    loadComponent: () =>
      import('./features/matches/pages/venue-create/venue-create.page').then(
        (m) => m.VenueCreatePage,
      ),
  },
  {
    path: 'matches/:id/mvp-vote',
    canActivate: [authGuard, onboardingCompletedGuard],
    loadComponent: () =>
      import('./features/matches/pages/match-mvp-vote/match-mvp-vote.page').then(
        (m) => m.MatchMvpVotePage,
      ),
  },
  {
    path: 'matches/:id/close',
    canActivate: [authGuard, onboardingCompletedGuard],
    loadComponent: () =>
      import('./features/matches/pages/match-close/match-close.page').then(
        (m) => m.MatchClosePage,
      ),
  },
  {
    path: 'matches/:id',
    canActivate: [authGuard, onboardingCompletedGuard],
    loadComponent: () =>
      import('./features/matches/pages/match-detail/match-detail.page').then(
        (m) => m.MatchDetailPage,
      ),
  },
  {
    path: 'invitations',
    canActivate: [authGuard, onboardingCompletedGuard],
    data: { defaultSocialTab: 'matches' },
    loadComponent: () =>
      import('./features/social/pages/social.page').then(
        (m) => m.SocialPage,
      ),
  },
  {
    path: 'leaderboard',
    canActivate: [authGuard, onboardingCompletedGuard],
    loadComponent: () =>
      import('./features/ratings/pages/leaderboard/leaderboard.page').then(
        (m) => m.LeaderboardPage,
      ),
  },
  {
    path: 'ranking',
    redirectTo: 'leaderboard',
    pathMatch: 'full',
  },
  {
    path: 'stats',
    canActivate: [authGuard, onboardingCompletedGuard],
    loadComponent: () =>
      import('./features/social/pages/stats/stats.page').then(
        (m) => m.StatsPage,
      ),
  },
  {
    path: 'social',
    canActivate: [authGuard, onboardingCompletedGuard],
    loadComponent: () =>
      import('./features/social/pages/social.page').then(
        (m) => m.SocialPage,
      ),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];
