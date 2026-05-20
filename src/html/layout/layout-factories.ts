/**
 * layout-factories.ts
 *
 * SwiftUI ライクなレイアウトコンテナファクトリ関数。
 * hstack / vstack / zstack / spacer / divider を提供する。
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4,
 *               4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4
 */
import { PairType } from '../elements/pair-type.js';
import { TextType } from '../elements/text-type.js';
import type { StackOptions, ZStackOptions, SpacerOptions, LayoutChild } from './layout-types.js';
import { ZStackAlignment } from '../../css/constants/alignment.js';

// ---------------------------------------------------------------------------
// 内部ヘルパー
// ---------------------------------------------------------------------------

/**
 * `LayoutChild` が `StackOptions` かどうかを判定するランタイム型ガード。
 *
 * `StackOptions` はプレーンオブジェクトで、`PairType`（HtmlTag サブクラス）
 * でも string でもないものを StackOptions とみなす。
 *
 * @internal
 */
function isStackOptions(
  value: StackOptions | LayoutChild | undefined,
): value is StackOptions {
  if (value === undefined) return false;
  if (typeof value === 'string') return false;
  // LayoutChild の HtmlTag サブクラスかどうかは constructor.name や instanceof で判定する。
  // PairType は HtmlTag → Object の継承チェーンを持つため、
  // 'tagType' プロパティの有無でタグ要素と判別する。
  if (typeof value === 'object' && 'tagType' in value) return false;
  return true;
}

/**
 * 子要素リストを PairType に追加するユーティリティ。
 *
 * - string → TextType (escape: true) に変換して追加
 * - HtmlTag → そのまま追加
 *
 * @internal
 */
function addChildren(tag: PairType, children: LayoutChild[]): void {
  for (const child of children) {
    if (typeof child === 'string') {
      tag.addChild(new TextType(child, { escape: true }));
    } else {
      tag.addChild(child);
    }
  }
}

/**
 * flex スタックコンテナの基礎 PairType を作成し、
 * オプションに基づいて flex CSS プロパティを設定する。
 *
 * @param direction - 'row' (hstack) または 'column' (vstack)
 * @param options - StackOptions
 * @returns 設定済み PairType
 *
 * @internal
 */
function makeStack(direction: 'row' | 'column', options: StackOptions): PairType {
  const tag = new PairType('div');

  // display: flex + flex-direction
  tag.style.flex.setFlex({ direction });

  // spacing → gap
  if (options.spacing !== undefined) {
    tag.style.flex.setGap(`${options.spacing}px`);
  }

  // alignment → align-items
  if (options.alignment !== undefined) {
    tag.style.flex.setAlignItems(options.alignment);
  }

  // wrap → flex-wrap: wrap
  if (options.wrap === true) {
    tag.style.flex.setFlexWrap('wrap');
  }

  return tag;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * 水平スタックコンテナ（display: flex; flex-direction: row）を生成するファクトリ。
 *
 * **呼び出しパターン:**
 * ```typescript
 * hstack()                                // 空コンテナ
 * hstack(child1, child2)                  // 子要素のみ
 * hstack({ spacing: 12 })                 // オプションのみ
 * hstack({ spacing: 8, alignment: 'center' }, child1, child2) // オプション + 子要素
 * ```
 *
 * **生成 CSS:**
 * - `display: flex; flex-direction: row`
 * - `spacing` → `gap: {n}px`
 * - `alignment` → `align-items: {value}`
 * - `wrap: true` → `flex-wrap: wrap`
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 *
 * @param optionsOrChild - StackOptions または最初の子要素（省略可）
 * @param children - 追加の子要素
 * @returns display:flex; flex-direction:row が設定された PairType
 */
export function hstack(
  optionsOrChild?: StackOptions | LayoutChild,
  ...children: LayoutChild[]
): PairType {
  if (isStackOptions(optionsOrChild)) {
    const tag = makeStack('row', optionsOrChild);
    addChildren(tag, children);
    return tag;
  }

  // optionsOrChild は LayoutChild または undefined
  const tag = makeStack('row', {});
  if (optionsOrChild !== undefined) {
    addChildren(tag, [optionsOrChild, ...children]);
  } else {
    addChildren(tag, children);
  }
  return tag;
}

/**
 * 垂直スタックコンテナ（display: flex; flex-direction: column）を生成するファクトリ。
 *
 * **呼び出しパターン:**
 * ```typescript
 * vstack()                                // 空コンテナ
 * vstack(child1, child2)                  // 子要素のみ
 * vstack({ spacing: 14 })                 // オプションのみ
 * vstack({ spacing: 8, alignment: 'center' }, child1, child2) // オプション + 子要素
 * ```
 *
 * **生成 CSS:**
 * - `display: flex; flex-direction: column`
 * - `spacing` → `gap: {n}px`
 * - `alignment` → `align-items: {value}`
 * - `wrap: true` → `flex-wrap: wrap`
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4
 *
 * @param optionsOrChild - StackOptions または最初の子要素（省略可）
 * @param children - 追加の子要素
 * @returns display:flex; flex-direction:column が設定された PairType
 */
export function vstack(
  optionsOrChild?: StackOptions | LayoutChild,
  ...children: LayoutChild[]
): PairType {
  if (isStackOptions(optionsOrChild)) {
    const tag = makeStack('column', optionsOrChild);
    addChildren(tag, children);
    return tag;
  }

  // optionsOrChild は LayoutChild または undefined
  const tag = makeStack('column', {});
  if (optionsOrChild !== undefined) {
    addChildren(tag, [optionsOrChild, ...children]);
  } else {
    addChildren(tag, children);
  }
  return tag;
}

// ---------------------------------------------------------------------------
// ZStack 内部ヘルパー
// ---------------------------------------------------------------------------

/**
 * `ZStackOptions | LayoutChild | undefined` が `ZStackOptions` かどうかを判定するランタイム型ガード。
 *
 * @internal
 */
function isZStackOptions(
  value: ZStackOptions | LayoutChild | undefined,
): value is ZStackOptions {
  if (value === undefined) return false;
  if (typeof value === 'string') return false;
  // HtmlTag サブクラスは 'tagType' プロパティを持つ
  if (typeof value === 'object' && 'tagType' in value) return false;
  return true;
}

/**
 * ZStack グリッドコンテナの PairType を作成し、
 * CSS Grid overlap 方式のプロパティを設定する。
 *
 * CSS: `display:grid; grid-template-areas:"stack"; grid-template-rows:1fr; grid-template-columns:1fr`
 * デフォルト alignment: ZStackAlignment.center（align-items:center; justify-content:center）
 *
 * @param options - ZStackOptions
 * @returns 設定済み PairType
 *
 * @internal
 */
function makeZStack(options: ZStackOptions): PairType {
  const tag = new PairType('div');

  // display:grid + grid-template-areas + rows/columns（CSS Grid overlap 方式）
  tag.style.grid.setGrid({ areas: '"stack"', rows: '1fr', columns: '1fr' });

  // alignment → align-items / justify-content
  // ZStackOptions.alignment が未指定の場合はデフォルト 'center' を使用する
  const alignKey = options.alignment ?? 'center';
  const { alignItems, justifyContent } = ZStackAlignment[alignKey];
  tag.style.flex.setAlignItems(alignItems);
  tag.style.flex.setJustifyContent(justifyContent);

  return tag;
}

// ---------------------------------------------------------------------------
// Public API: zstack
// ---------------------------------------------------------------------------

/**
 * 重ね合わせスタックコンテナ（CSS Grid overlap 方式）を生成するファクトリ。
 *
 * **呼び出しパターン:**
 * ```typescript
 * zstack()                                    // 空コンテナ（デフォルト: center/center）
 * zstack(child1, child2)                      // 子要素のみ
 * zstack({ alignment: 'topLeading' })         // オプションのみ
 * zstack({ alignment: 'center' }, child1)     // オプション + 子要素
 * ```
 *
 * **生成 CSS:**
 * - `display: grid`
 * - `grid-template-areas: "stack"`
 * - `grid-template-rows: 1fr`
 * - `grid-template-columns: 1fr`
 * - `align-items: center`（デフォルト）
 * - `justify-content: center`（デフォルト）
 *
 * **注意:** 子要素への `grid-area: stack` の自動適用は行わない。
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4
 *
 * @param optionsOrChild - ZStackOptions または最初の子要素（省略可）
 * @param children - 追加の子要素
 * @returns CSS Grid overlap が設定された PairType
 */
export function zstack(
  optionsOrChild?: ZStackOptions | LayoutChild,
  ...children: LayoutChild[]
): PairType {
  if (isZStackOptions(optionsOrChild)) {
    const tag = makeZStack(optionsOrChild);
    addChildren(tag, children);
    return tag;
  }

  // optionsOrChild は LayoutChild または undefined
  const tag = makeZStack({});
  if (optionsOrChild !== undefined) {
    addChildren(tag, [optionsOrChild, ...children]);
  }
  return tag;
}

// ---------------------------------------------------------------------------
// Public API: spacer
// ---------------------------------------------------------------------------

/**
 * フレキシブルスペーサー（flex:1 1 auto）を生成するファクトリ。
 *
 * **呼び出しパターン:**
 * ```typescript
 * spacer()                    // flex:1 1 auto のみ
 * spacer({ minLength: 8 })    // flex:1 1 auto; min-width:8px
 * ```
 *
 * **生成 CSS:**
 * - `flex: 1 1 auto`
 * - `minLength` → `min-width: {n}px`
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4
 *
 * @param options - SpacerOptions（省略可）
 * @returns flex:1 1 auto が設定された PairType
 */
export function spacer(options?: SpacerOptions): PairType {
  const tag = new PairType('div');

  // flex: 1 1 auto（スペーサーの基本動作）
  tag.style.flex.setFlexValue('1 1 auto');

  // minLength → min-width:{n}px
  if (options?.minLength !== undefined) {
    tag.minWidth(`${options.minLength}px`);
  }

  return tag;
}

// ---------------------------------------------------------------------------
// Public API: divider
// ---------------------------------------------------------------------------

/**
 * 区切り線（水平または垂直）を生成するファクトリ。
 *
 * **呼び出しパターン:**
 * ```typescript
 * divider()               // 水平区切り線（デフォルト）
 * divider('horizontal')   // 水平区切り線
 * divider('vertical')     // 垂直区切り線
 * ```
 *
 * **生成 CSS:**
 * - 水平: `height:1px; background:currentColor; opacity:0.15; width:100%`
 * - 垂直: `width:1px; background:currentColor; opacity:0.15; align-self:stretch`
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4
 *
 * @param direction - 'horizontal'（デフォルト）または 'vertical'
 * @returns 区切り線 CSS が設定された PairType
 */
export function divider(direction: 'horizontal' | 'vertical' = 'horizontal'): PairType {
  const tag = new PairType('div');

  // 共通スタイル
  tag.background('currentColor');
  tag.opacity('0.15');

  if (direction === 'vertical') {
    // 垂直区切り線
    tag.width('1px');
    tag.style.flex.setAlignSelf('stretch');
  } else {
    // 水平区切り線（デフォルト）
    tag.height('1px');
    tag.width('100%');
  }

  return tag;
}
