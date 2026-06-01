/**
 * Task 0.1: CSS単位型のテスト
 *
 * UnitStyle, RelationShip, HlUnit 型の値検証と
 * hlUnitToCssString() 変換関数の出力検証を行う。
 *
 * TDD RED phase: 実装がまだ存在しないため、すべてのテストは失敗する。
 */
import { describe, it, expect } from 'vitest';
import type { UnitStyle, RelationShip, HlUnit } from '../../src/utils/unit-style.js';
import { hlUnitToCssString } from '../../src/utils/unit-style.js';

describe('UnitStyle 型', () => {
  it('px を受け付ける', () => {
    const unit: UnitStyle = 'px';
    expect(unit).toBe('px');
  });

  it('em を受け付ける', () => {
    const unit: UnitStyle = 'em';
    expect(unit).toBe('em');
  });

  it('rem を受け付ける', () => {
    const unit: UnitStyle = 'rem';
    expect(unit).toBe('rem');
  });

  it('% を受け付ける', () => {
    const unit: UnitStyle = '%';
    expect(unit).toBe('%');
  });

  it('vw を受け付ける', () => {
    const unit: UnitStyle = 'vw';
    expect(unit).toBe('vw');
  });

  it('vh を受け付ける', () => {
    const unit: UnitStyle = 'vh';
    expect(unit).toBe('vh');
  });

  it('fr を受け付ける', () => {
    const unit: UnitStyle = 'fr';
    expect(unit).toBe('fr');
  });

  it('none を受け付ける', () => {
    const unit: UnitStyle = 'none';
    expect(unit).toBe('none');
  });
});

describe('RelationShip 型', () => {
  it('relative を受け付ける', () => {
    const rel: RelationShip = 'relative';
    expect(rel).toBe('relative');
  });

  it('absolute を受け付ける', () => {
    const rel: RelationShip = 'absolute';
    expect(rel).toBe('absolute');
  });

  it('static を受け付ける', () => {
    const rel: RelationShip = 'static';
    expect(rel).toBe('static');
  });

  it('fixed を受け付ける', () => {
    const rel: RelationShip = 'fixed';
    expect(rel).toBe('fixed');
  });

  it('sticky を受け付ける', () => {
    const rel: RelationShip = 'sticky';
    expect(rel).toBe('sticky');
  });
});

describe('HlUnit インターフェース', () => {
  it('px 単位の HlUnit を作成できる', () => {
    const hlUnit: HlUnit = { value: 16, unit: 'px' };
    expect(hlUnit.value).toBe(16);
    expect(hlUnit.unit).toBe('px');
  });

  it('em 単位の HlUnit を作成できる', () => {
    const hlUnit: HlUnit = { value: 1.5, unit: 'em' };
    expect(hlUnit.value).toBe(1.5);
    expect(hlUnit.unit).toBe('em');
  });

  it('none 単位の HlUnit を作成できる', () => {
    const hlUnit: HlUnit = { value: 0, unit: 'none' };
    expect(hlUnit.value).toBe(0);
    expect(hlUnit.unit).toBe('none');
  });
});

describe('hlUnitToCssString()', () => {
  it('px: { value: 16, unit: "px" } を "16px" に変換する', () => {
    const result = hlUnitToCssString({ value: 16, unit: 'px' });
    expect(result).toBe('16px');
  });

  it('em: { value: 1.5, unit: "em" } を "1.5em" に変換する', () => {
    const result = hlUnitToCssString({ value: 1.5, unit: 'em' });
    expect(result).toBe('1.5em');
  });

  it('rem: { value: 1, unit: "rem" } を "1rem" に変換する', () => {
    const result = hlUnitToCssString({ value: 1, unit: 'rem' });
    expect(result).toBe('1rem');
  });

  it('%: { value: 50, unit: "%" } を "50%" に変換する', () => {
    const result = hlUnitToCssString({ value: 50, unit: '%' });
    expect(result).toBe('50%');
  });

  it('vw: { value: 100, unit: "vw" } を "100vw" に変換する', () => {
    const result = hlUnitToCssString({ value: 100, unit: 'vw' });
    expect(result).toBe('100vw');
  });

  it('vh: { value: 100, unit: "vh" } を "100vh" に変換する', () => {
    const result = hlUnitToCssString({ value: 100, unit: 'vh' });
    expect(result).toBe('100vh');
  });

  it('fr: { value: 1, unit: "fr" } を "1fr" に変換する', () => {
    const result = hlUnitToCssString({ value: 1, unit: 'fr' });
    expect(result).toBe('1fr');
  });

  it('none: { value: 0, unit: "none" } を "0" に変換する（単位なし）', () => {
    const result = hlUnitToCssString({ value: 0, unit: 'none' });
    expect(result).toBe('0');
  });

  it('px で value が 0 の場合: { value: 0, unit: "px" } を "0px" に変換する', () => {
    const result = hlUnitToCssString({ value: 0, unit: 'px' });
    expect(result).toBe('0px');
  });

  it('none で value が 0 以外の場合: { value: 42, unit: "none" } を "42" に変換する', () => {
    const result = hlUnitToCssString({ value: 42, unit: 'none' });
    expect(result).toBe('42');
  });

  it('小数値: { value: 0.5, unit: "rem" } を "0.5rem" に変換する', () => {
    const result = hlUnitToCssString({ value: 0.5, unit: 'rem' });
    expect(result).toBe('0.5rem');
  });

  it('負の値: { value: -10, unit: "px" } を "-10px" に変換する', () => {
    const result = hlUnitToCssString({ value: -10, unit: 'px' });
    expect(result).toBe('-10px');
  });
});
