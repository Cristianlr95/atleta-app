import { Routes } from '@angular/router';
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
    path: 'home',
    canActivate: [onboardingCompletedGuard],
    loadComponent: () =>
      import('./features/dashboard/pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'player/profile',
    canActivate: [onboardingCompletedGuard],
    loadComponent: () =>
      import('./features/user/pages/player-profile/player-profile.page').then(
        (m) => m.PlayerProfilePage,
      ),
  },
  {
    path: 'player/onboarding',
    canActivate: [onboardingPendingGuard],
    loadComponent: () =>
      import('./features/user/pages/player-onboarding/player-onboarding.page').then(
        (m) => m.PlayerOnboardingPage,
      ),
  },
  {
    path: 'sessions/create',
    loadComponent: () =>
      import('./features/sessions/pages/create-session/create-session.page').then(
        (m) => m.CreateSessionPage,
      ),
  },
  {
    path: 'matches/history',
    loadComponent: () =>
      import('./features/matches/pages/matches-history/matches-history.page').then(
        (m) => m.MatchesHistoryPage,
      ),
  },
  {
    path: 'matches',
    loadComponent: () =>
      import('./features/matches/pages/matches-hub/matches-hub.page').then(
        (m) => m.MatchesHubPage,
      ),
  },
  {
    path: 'matches/create',
    loadComponent: () =>
      import('./features/matches/pages/matches-create/matches-create.page').then(
        (m) => m.MatchesCreatePage,
      ),
  },
  {
    path: 'matches/venues/new',
    loadComponent: () =>
      import('./features/matches/pages/venue-create/venue-create.page').then(
        (m) => m.VenueCreatePage,
      ),
  },
  {
    path: 'matches/:id/mvp-vote',
    loadComponent: () =>
      import('./features/matches/pages/match-mvp-vote/match-mvp-vote.page').then(
        (m) => m.MatchMvpVotePage,
      ),
  },
  {
    path: 'matches/:id/close',
    loadComponent: () =>
      import('./features/matches/pages/match-close/match-close.page').then(
        (m) => m.MatchClosePage,
      ),
  },
  {
    path: 'matches/:id',
    loadComponent: () =>
      import('./features/matches/pages/match-detail/match-detail.page').then(
        (m) => m.MatchDetailPage,
      ),
  },
  {
    path: 'invitations',
    redirectTo: 'matches',
    pathMatch: 'full',
  },
  {
    path: 'leaderboard',
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
    loadComponent: () =>
      import('./features/social/pages/stats/stats.page').then(
        (m) => m.StatsPage,
      ),
  },
  {
    path: 'social',
    redirectTo: 'matches',
    pathMatch: 'full',
  },
];
