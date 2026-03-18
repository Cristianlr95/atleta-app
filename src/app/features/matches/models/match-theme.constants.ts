import { MatchTheme } from './progressive-match.models';

export const MATCH_THEMES: MatchTheme[] = [
  { id: 'classic', localAccent: '#4f86ff', awayAccent: '#ff7b6b' },
  { id: 'neon', localAccent: '#2dd4bf', awayAccent: '#f59e0b' },
  { id: 'storm', localAccent: '#93c5fd', awayAccent: '#f472b6' },
  { id: 'night', localAccent: '#22d3ee', awayAccent: '#a3e635' },
];

export const DEFAULT_MATCH_THEME_ID = MATCH_THEMES[0].id;
