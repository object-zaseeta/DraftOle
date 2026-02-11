/**
 * CSS単位型の定義と変換関数
 *
 * CSS値に使用する単位の型安全な表現と、
 * HlUnit から CSS 文字列への変換を提供する。
 */

/**
 * CSS values unit types.
 *
 * Represents the allowed unit types for CSS dimensional values.
 * The 'none' value is used for unitless numbers (e.g., line-height, opacity).
 *
 * @example
 * ```typescript
 * const pixelUnit: UnitStyle = 'px';
 * const percentUnit: UnitStyle = '%';
 * const unitless: UnitStyle = 'none';
 * ```
 */
export type UnitStyle = 'px' | 'em' | 'rem' | '%' | 'vw' | 'vh' | 'fr' | 'none';

/**
 * CSS position property values.
 *
 * Represents the allowed values for the CSS `position` property,
 * defining how an element is positioned in the document.
 *
 * @example
 * ```typescript
 * const position: RelationShip = 'absolute';
 * const stickyHeader: RelationShip = 'sticky';
 * ```
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/position | MDN position}
 */
export type RelationShip = 'relative' | 'absolute' | 'static' | 'fixed' | 'sticky';

/**
 * Represents a numeric value with its associated CSS unit.
 *
 * This interface provides type-safe representation of CSS dimensional values
 * by pairing a numeric value with its unit type.
 *
 * @example
 * ```typescript
 * const width: HlUnit = { value: 100, unit: 'px' };
 * const height: HlUnit = { value: 50, unit: '%' };
 * const opacity: HlUnit = { value: 0.5, unit: 'none' };
 * ```
 */
export interface HlUnit {
  /**
   * The numeric value.
   */
  value: number;

  /**
   * The unit type for the value.
   */
  unit: UnitStyle;
}

/**
 * Converts an HlUnit to a CSS-compatible string.
 *
 * This function transforms a structured unit value into its string representation
 * for use in CSS. When the unit is 'none', only the numeric value is returned.
 *
 * @param hlUnit - The HlUnit to convert
 * @returns A CSS-compatible string representation
 *
 * @example
 * ```typescript
 * hlUnitToCssString({ value: 16, unit: 'px' })   // '16px'
 * hlUnitToCssString({ value: 50, unit: '%' })    // '50%'
 * hlUnitToCssString({ value: 1.5, unit: 'rem' }) // '1.5rem'
 * hlUnitToCssString({ value: 0, unit: 'none' })  // '0'
 * hlUnitToCssString({ value: 2, unit: 'none' })  // '2' (for unitless values like line-height)
 * ```
 */
export function hlUnitToCssString(hlUnit: HlUnit): string {
  if (hlUnit.unit === 'none') {
    return String(hlUnit.value);
  }
  return `${hlUnit.value}${hlUnit.unit}`;
}
