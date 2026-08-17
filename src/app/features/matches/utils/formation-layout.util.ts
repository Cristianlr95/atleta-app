import { MatchSize, Player } from '../models/progressive-match.models';

export type FormationRole = 'POR' | 'DEF' | 'MED' | 'DEL';

export interface FormationSlot {
  id: string;
  role: FormationRole;
  x: number;
  y: number;
}

export interface FormationPreset {
  id: string;
  label: string;
  slots: FormationSlot[];
}

const row = (role: FormationRole, count: number, y: number): FormationSlot[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `${role}-${index + 1}`,
    role,
    x: ((index + 1) * 100) / (count + 1),
    y,
  }));

const preset = (id: string, label: string, def: number, med: number, del: number): FormationPreset => ({
  id,
  label,
  slots: [
    ...row('POR', 1, 12),
    ...row('DEF', def, 34),
    ...row('MED', med, 59),
    ...row('DEL', del, 82),
  ],
});

const FORMATIONS: Record<MatchSize, FormationPreset[]> = {
  [MatchSize.FIVE_VS_FIVE]: [preset('2-1-1', '2 · 1 · 1', 2, 1, 1), preset('1-2-1', '1 · 2 · 1', 1, 2, 1)],
  [MatchSize.SIX_VS_SIX]: [preset('2-2-1', '2 · 2 · 1', 2, 2, 1), preset('1-3-1', '1 · 3 · 1', 1, 3, 1)],
  [MatchSize.SEVEN_VS_SEVEN]: [preset('2-3-1', '2 · 3 · 1', 2, 3, 1), preset('3-2-1', '3 · 2 · 1', 3, 2, 1)],
};

export function getFormationPresets(modality: MatchSize): FormationPreset[] {
  return FORMATIONS[modality] ?? FORMATIONS[MatchSize.FIVE_VS_FIVE];
}

export function getPlayerRole(player: Player): FormationRole {
  const position = player.position.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  if (position.includes('ARQUERO') || position.includes('PORTERO')) return 'POR';
  if (position.includes('DEFEN') || position.includes('CENTRAL') || position.includes('LATERAL')) return 'DEF';
  if (position.includes('MEDIO') || position.includes('VOLANTE')) return 'MED';
  return 'DEL';
}

export function orderPlayersForFormation(players: Player[], formation: FormationPreset): Player[] {
  const remaining = [...players].sort((a, b) => (b.ovr ?? 65) - (a.ovr ?? 65));
  const ordered: Player[] = [];

  for (const slot of formation.slots) {
    const roleIndex = remaining.findIndex((player) => getPlayerRole(player) === slot.role);
    const index = roleIndex >= 0 ? roleIndex : 0;
    const [player] = remaining.splice(index, 1);
    if (player) ordered.push(player);
  }

  return [...ordered, ...remaining];
}
