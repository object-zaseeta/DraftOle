export type UnitStyle = 'px' | 'em' | 'rem' | '%' | 'vw' | 'vh' | 'fr' | 'none';

export type RelationShip = 'relative' | 'absolute' | 'static' | 'fixed';

export interface HlUnit {
  value: number;
  unit: UnitStyle;
}

export function hlUnit(value: number, unit: UnitStyle): HlUnit {
  return { value, unit };
}

export function hlUnitToCssString(u: HlUnit): string {
  if (u.unit === 'none') return '';
  const num = Number.isInteger(u.value) ? String(u.value) : String(u.value);
  return `${num}${u.unit}`;
}
