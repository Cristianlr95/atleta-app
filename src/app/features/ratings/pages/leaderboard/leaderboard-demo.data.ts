import { LeaderboardDisplayRow } from 'src/app/shared/ui/metallic-leaderboard/metallic-leaderboard.component';
import { TeamExternalRecord, TeamSummary } from 'src/app/features/teams/models/team.models';

export const RANKING_DEMO_TEAM_ID = 9001;

export const RANKING_DEMO_ROWS: ReadonlyArray<LeaderboardDisplayRow> = [
  { rank: 1, alias: 'Matías Rojas', scoreText: '84.6 OVR', roleText: 'Ataque', matchesPlayed: 18, metaText: '18 partidos', goalsScored: 16, mvpCount: 5, recentResults: ['G', 'G', 'E', 'P', 'G'] },
  { rank: 2, alias: 'Camila Soto', scoreText: '82.9 OVR', roleText: 'Mediocampo', matchesPlayed: 21, metaText: '21 partidos', goalsScored: 8, mvpCount: 4, recentResults: ['E', 'G', 'G', 'G', 'G'] },
  { rank: 3, alias: 'Benjamín Silva', scoreText: '81.7 OVR', roleText: 'Defensa', matchesPlayed: 19, metaText: '19 partidos', goalsScored: 3, mvpCount: 3, recentResults: ['P', 'G', 'E', 'G', 'E'] },
  { rank: 4, alias: 'Francisca León', scoreText: '80.8 OVR', roleText: 'Carrilero', matchesPlayed: 16, metaText: '16 partidos', goalsScored: 6, mvpCount: 2, recentResults: ['G', 'P', 'G', 'E', 'G'] },
  { rank: 5, alias: 'Lucas Vera', scoreText: '79.4 OVR', roleText: 'Arquero', matchesPlayed: 22, metaText: '22 partidos', goalsScored: 0, mvpCount: 4, recentResults: ['G', 'E', 'P', 'G', 'G'] },
  { rank: 6, alias: 'Antonia Díaz', scoreText: '78.2 OVR', roleText: 'Ataque', matchesPlayed: 14, metaText: '14 partidos', goalsScored: 11, mvpCount: 3, recentResults: ['P', 'G', 'G', 'P', 'G'] },
  { rank: 7, alias: 'Joaquín Pérez', scoreText: '77.5 OVR', roleText: 'Mediocampo', matchesPlayed: 17, metaText: '17 partidos', goalsScored: 5, mvpCount: 1, recentResults: ['E', 'P', 'G', 'G', 'E'] },
  { rank: 8, alias: 'Valentina Cruz', scoreText: '76.9 OVR', roleText: 'Defensa', matchesPlayed: 13, metaText: '13 partidos', goalsScored: 2, mvpCount: 1, recentResults: ['G', 'P', 'E', 'P', 'G'] },
];

export const RANKING_DEMO_TEAM: TeamSummary = {
  id: RANKING_DEMO_TEAM_ID,
  nombre: 'Atleta Dev FC',
};

export const RANKING_DEMO_RECORD: TeamExternalRecord = {
  teamId: RANKING_DEMO_TEAM_ID,
  teamName: 'Atleta Dev FC',
  matchesPlayed: 12,
  wins: 7,
  draws: 2,
  losses: 3,
  points: 23,
};
