/**
 * Task 1.3: CSS モジュール内部インターフェースの型整合性テスト
 *
 * 各インターフェースの型定義が正しく存在し、
 * 期待される構造を持つことをコンパイルレベルで検証する。
 */
import { describe, it, expect } from 'vitest';

import type { CssStyleManagerType, HtmlStyleType } from '../../../src/css/style/css-style-manager-type.js';
import type { CssPositionMakerType } from '../../../src/css/layout/position-maker/css-position-maker-type.js';
import type { LayoutRegisteredItem, LazyLayoutRegister } from '../../../src/css/layout/lazy-layout/registered-item.js';
import type { CssPlaceDescription } from '../../../src/css/layout/css-place-description.js';
import type { Positioning } from '../../../src/css/layout/positioning.js';
import type { CssLayoutBuilder } from '../../../src/css/layout/css-layout-builder.js';
import type { Renderable } from '../../../src/utils/renderable.js';
import type { HlUnit, UnitStyle, RelationShip } from '../../../src/utils/unit-style.js';

// ====================================================================
// ヘルパー: 型の構造的互換性を検証するユーティリティ型
// ====================================================================

/**
 * T が U に代入可能であることをコンパイル時に検証する。
 * 代入不可能な場合はコンパイルエラーになる。
 */
type AssertAssignable<T, U> = T extends U ? true : never;

/**
 * T と U が厳密に同じ型であることを検証する。
 */
type AssertExact<T, U> = [T] extends [U] ? ([U] extends [T] ? true : never) : never;

// ====================================================================
// 1. CssStyleManagerType
// ====================================================================
describe('CssStyleManagerType', () => {
  it('Renderable を拡張している', () => {
    const _check: AssertAssignable<CssStyleManagerType, Renderable> = true;
    expect(_check).toBe(true);
  });

  it('style プロパティが HtmlStyleType 型である', () => {
    // readonly style: HtmlStyleType の存在を検証
    type StyleProp = CssStyleManagerType['style'];
    const _check: AssertAssignable<StyleProp, HtmlStyleType> = true;
    expect(_check).toBe(true);
  });

  it('getFontSizeUnit() が HlUnit | undefined を返す', () => {
    type ReturnType = CssStyleManagerType extends { getFontSizeUnit(): infer R } ? R : never;
    const _check: AssertExact<ReturnType, HlUnit | undefined> = true;
    expect(_check).toBe(true);
  });
});

// ====================================================================
// 2. HtmlStyleType
// ====================================================================
describe('HtmlStyleType', () => {
  it('Renderable を拡張している', () => {
    const _check: AssertAssignable<HtmlStyleType, Renderable> = true;
    expect(_check).toBe(true);
  });
});

// ====================================================================
// 3. CssPositionMakerType
// ====================================================================
describe('CssPositionMakerType', () => {
  it('Renderable を拡張している', () => {
    const _check: AssertAssignable<CssPositionMakerType, Renderable> = true;
    expect(_check).toBe(true);
  });

  it('tagPath プロパティが string 型である', () => {
    type TagPathType = CssPositionMakerType['tagPath'];
    const _check: AssertExact<TagPathType, string> = true;
    expect(_check).toBe(true);
  });

  it('description プロパティが CssPlaceDescription 型である', () => {
    type DescType = CssPositionMakerType['description'];
    const _check: AssertAssignable<DescType, CssPlaceDescription> = true;
    expect(_check).toBe(true);
  });

  it('updateLLRegister メソッドが存在する', () => {
    type Method = CssPositionMakerType['updateLLRegister'];
    const _check: AssertAssignable<Method, (register: LazyLayoutRegister | undefined) => void> = true;
    expect(_check).toBe(true);
  });

  it('getLLRegister メソッドが存在する', () => {
    type Method = CssPositionMakerType['getLLRegister'];
    const _check: AssertAssignable<Method, () => LazyLayoutRegister | undefined> = true;
    expect(_check).toBe(true);
  });

  it('placeAbsoluteWith メソッドが存在する', () => {
    type Method = CssPositionMakerType['placeAbsoluteWith'];
    const _check: AssertAssignable<Method, (closure: (builder: CssLayoutBuilder) => void) => void> = true;
    expect(_check).toBe(true);
  });

  it('placeRelativeWith メソッドが存在する', () => {
    type Method = CssPositionMakerType['placeRelativeWith'];
    const _check: AssertAssignable<Method, (closure: (builder: CssLayoutBuilder) => void) => void> = true;
    expect(_check).toBe(true);
  });

  it('placeStaticWith メソッドが存在する', () => {
    type Method = CssPositionMakerType['placeStaticWith'];
    const _check: AssertAssignable<Method, (closure: (builder: CssLayoutBuilder) => void) => void> = true;
    expect(_check).toBe(true);
  });

  it('placeFixedWith メソッドが存在する', () => {
    type Method = CssPositionMakerType['placeFixedWith'];
    const _check: AssertAssignable<Method, (closure: (builder: CssLayoutBuilder) => void) => void> = true;
    expect(_check).toBe(true);
  });
});

// ====================================================================
// 4. LayoutRegisteredItem
// ====================================================================
describe('LayoutRegisteredItem', () => {
  it('relationShip フィールドが RelationShip 型である', () => {
    type FieldType = LayoutRegisteredItem['relationShip'];
    const _check: AssertExact<FieldType, RelationShip> = true;
    expect(_check).toBe(true);
  });

  it('baseTagPath フィールドが string 型である', () => {
    type FieldType = LayoutRegisteredItem['baseTagPath'];
    const _check: AssertExact<FieldType, string> = true;
    expect(_check).toBe(true);
  });

  it('basePosition フィールドが Positioning 型である', () => {
    type FieldType = LayoutRegisteredItem['basePosition'];
    const _check: AssertExact<FieldType, Positioning> = true;
    expect(_check).toBe(true);
  });

  it('targetTagPath フィールドがオプショナルで string 型である', () => {
    // targetTagPath は optional なので string | undefined
    type FieldType = LayoutRegisteredItem['targetTagPath'];
    const _check: AssertExact<FieldType, string | undefined> = true;
    expect(_check).toBe(true);
  });

  it('targetPosition フィールドが Positioning 型である', () => {
    type FieldType = LayoutRegisteredItem['targetPosition'];
    const _check: AssertExact<FieldType, Positioning> = true;
    expect(_check).toBe(true);
  });

  it('value フィールドがオプショナルで HlUnit 型である', () => {
    type FieldType = LayoutRegisteredItem['value'];
    const _check: AssertExact<FieldType, HlUnit | undefined> = true;
    expect(_check).toBe(true);
  });
});

// ====================================================================
// 5. LazyLayoutRegister
// ====================================================================
describe('LazyLayoutRegister', () => {
  it('registerItem メソッドが存在する', () => {
    type Method = LazyLayoutRegister['registerItem'];
    const _check: AssertAssignable<Method, (item: LayoutRegisteredItem) => void> = true;
    expect(_check).toBe(true);
  });

  it('getRelationShip メソッドが存在する', () => {
    type Method = LazyLayoutRegister['getRelationShip'];
    const _check: AssertAssignable<Method, (tagPath: string) => RelationShip | undefined> = true;
    expect(_check).toBe(true);
  });

  it('renderItemsBy メソッドが存在する', () => {
    type Method = LazyLayoutRegister['renderItemsBy'];
    const _check: AssertAssignable<Method, (tagPath: string) => string> = true;
    expect(_check).toBe(true);
  });

  it('renderAllItems メソッドが存在する', () => {
    type Method = LazyLayoutRegister['renderAllItems'];
    const _check: AssertAssignable<Method, () => string> = true;
    expect(_check).toBe(true);
  });

  it('resolveAllLayout メソッドが存在する', () => {
    type Method = LazyLayoutRegister['resolveAllLayout'];
    const _check: AssertAssignable<Method, () => void> = true;
    expect(_check).toBe(true);
  });
});

// ====================================================================
// 6. CssPlaceDescription
// ====================================================================
describe('CssPlaceDescription', () => {
  it('top フィールドがオプショナルで HlUnit 型である', () => {
    type FieldType = CssPlaceDescription['top'];
    const _check: AssertExact<FieldType, HlUnit | undefined> = true;
    expect(_check).toBe(true);
  });

  it('left フィールドがオプショナルで HlUnit 型である', () => {
    type FieldType = CssPlaceDescription['left'];
    const _check: AssertExact<FieldType, HlUnit | undefined> = true;
    expect(_check).toBe(true);
  });

  it('width フィールドがオプショナルで HlUnit 型である', () => {
    type FieldType = CssPlaceDescription['width'];
    const _check: AssertExact<FieldType, HlUnit | undefined> = true;
    expect(_check).toBe(true);
  });

  it('height フィールドがオプショナルで HlUnit 型である', () => {
    type FieldType = CssPlaceDescription['height'];
    const _check: AssertExact<FieldType, HlUnit | undefined> = true;
    expect(_check).toBe(true);
  });
});

// ====================================================================
// 7. Positioning
// ====================================================================
describe('Positioning', () => {
  it('5つの文字列リテラルユニオン型である', () => {
    // Positioning が正確に 'top' | 'bottom' | 'left' | 'right' | 'none' であることを検証
    type Expected = 'top' | 'bottom' | 'left' | 'right' | 'none';
    const _check: AssertExact<Positioning, Expected> = true;
    expect(_check).toBe(true);
  });

  it('各リテラル値が Positioning に代入可能である', () => {
    const top: Positioning = 'top';
    const bottom: Positioning = 'bottom';
    const left: Positioning = 'left';
    const right: Positioning = 'right';
    const none: Positioning = 'none';

    expect(top).toBe('top');
    expect(bottom).toBe('bottom');
    expect(left).toBe('left');
    expect(right).toBe('right');
    expect(none).toBe('none');
  });
});

// ====================================================================
// 8. CssLayoutBuilder
// ====================================================================
describe('CssLayoutBuilder', () => {
  it('top メソッドが CssLayoutBuilder を返す(チェーン可能)', () => {
    type ReturnType = CssLayoutBuilder extends { top(value: number, unit: UnitStyle): infer R } ? R : never;
    const _check: AssertAssignable<ReturnType, CssLayoutBuilder> = true;
    expect(_check).toBe(true);
  });

  it('left メソッドが CssLayoutBuilder を返す(チェーン可能)', () => {
    type ReturnType = CssLayoutBuilder extends { left(value: number, unit: UnitStyle): infer R } ? R : never;
    const _check: AssertAssignable<ReturnType, CssLayoutBuilder> = true;
    expect(_check).toBe(true);
  });

  it('width メソッドが CssLayoutBuilder を返す(チェーン可能)', () => {
    type ReturnType = CssLayoutBuilder extends { width(value: number, unit: UnitStyle): infer R } ? R : never;
    const _check: AssertAssignable<ReturnType, CssLayoutBuilder> = true;
    expect(_check).toBe(true);
  });

  it('height メソッドが CssLayoutBuilder を返す(チェーン可能)', () => {
    type ReturnType = CssLayoutBuilder extends { height(value: number, unit: UnitStyle): infer R } ? R : never;
    const _check: AssertAssignable<ReturnType, CssLayoutBuilder> = true;
    expect(_check).toBe(true);
  });

  it('bottom メソッドが CssLayoutBuilder を返す(チェーン可能)', () => {
    type ReturnType = CssLayoutBuilder extends { bottom(value: number, unit: UnitStyle): infer R } ? R : never;
    const _check: AssertAssignable<ReturnType, CssLayoutBuilder> = true;
    expect(_check).toBe(true);
  });

  it('right メソッドが CssLayoutBuilder を返す(チェーン可能)', () => {
    type ReturnType = CssLayoutBuilder extends { right(value: number, unit: UnitStyle): infer R } ? R : never;
    const _check: AssertAssignable<ReturnType, CssLayoutBuilder> = true;
    expect(_check).toBe(true);
  });
});
