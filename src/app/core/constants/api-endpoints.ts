export const API_ENDPOINTS = {
  auth: {
    login: '/athletes/login',
    registerAthlete: '/athletes/register',
    createPlayerProfile: '/player-profiles',
  },
  matches: {
    base: '/matches',
    byPlayer: '/matches/by-player',
    byPlayerOrCreator: '/matches/by-player-or-creator',
    join: '/matches/join',
    events: '/matches/events',
  },
  ratings: {
    base: '/ratings',
    leaderboard: '/ratings/leaderboard',
    initializeBase: '/ratings/player',
  },
  users: {
    athletes: '/athletes',
    playerProfiles: '/player-profiles',
    playerProfilePositions: '/player-profiles/positions',
    positions: '/positions',
  },
  teams: {
    base: '/teams',
    byCreator: '/teams/by-creator',
    byPlayer: '/teams/by-player',
    uploadLogo: '/teams/logo',
  },
  fields: {
    base: '/fields',
  },
  social: {
    base: '/social',
    friendships: '/social/friendships',
    friendshipRequests: '/social/friendships/requests',
    teamInvites: '/social/team-invites',
    matchInvites: '/social/match-invites',
    matchInvitesBatch: '/social/match-invites/batch',
    matchInvitesByMatch: '/social/match-invites/by-match',
    notifications: '/social/notifications',
    notificationUnreadCount: '/social/notifications/unread-count',
    pushTokens: '/social/notifications/push-tokens',
    reminders: '/social/notifications/reminders/forms',
    searchPlayers: '/social/players/search',
  },
} as const;
