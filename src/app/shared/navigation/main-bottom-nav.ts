import { MetallicBottomNavItem } from '../ui/metallic-bottom-nav/metallic-bottom-nav.component';

export type MainBottomSection = 'home' | 'matches' | 'ranking' | 'profile';

const ICON_BASE = 'assets/icons/atleta';

export function buildMainBottomNav(
  active: MainBottomSection,
  matchesBadgeCount = 0,
): ReadonlyArray<MetallicBottomNavItem> {
  return [
    {
      id: 'home',
      label: 'Inicio',
      iconAsset: `${ICON_BASE}/ic_nav_home_24.svg`,
      active: active === 'home',
    },
    {
      id: 'matches',
      label: 'Partidos',
      iconAsset: `${ICON_BASE}/ic_nav_matches_24.svg`,
      active: active === 'matches',
      badgeCount: matchesBadgeCount,
    },
    {
      id: 'ranking',
      label: 'Ranking',
      iconAsset: `${ICON_BASE}/ic_nav_ranking_24.svg`,
      active: active === 'ranking',
    },
    {
      id: 'profile',
      label: 'Perfil',
      iconAsset: `${ICON_BASE}/ic_nav_profile_24.svg`,
      active: active === 'profile',
    },
  ];
}
