/**
 * App barrel の型チェックと APPX-1 スモークテスト
 *
 * Requirements: 2.2, 3.1, 3.2, 3.3, 5.1, 5.2, 5.3
 * Boundary: tests/app/
 *
 * テスト内容:
 * - App barrel (`src/app/index`) から app, AppDocument, State<T>, Computed<T> が import できる
 * - counter パターン（app().state(0) + .set() / .update() / .map()）がコンパイルエラーなしに動作する
 * - ルート barrel（src/index）経由でも app と AppDocument が import できる
 * - page / Button / ReadableState などは App barrel から export されていない
 * - **1.0.0 以降**: `AppContext` は公開 barrel から除去済み（利用者は `AppDocument` を使う）
 */

import { describe, it, expect } from 'vitest';

// ────────────────────────────────────────────────────────────
// Req 2.2, 3.1, 3.2: App barrel からの import
// ────────────────────────────────────────────────────────────

// 値エクスポート
import { app, AppDocument } from '../../src/app/index';

// 型エクスポート（TypeScript コンパイルが通ることを確認）
import type { State, Computed } from '../../src/app/index';

// ────────────────────────────────────────────────────────────
// Req 5.1, 5.2: ルート barrel からの import
// ────────────────────────────────────────────────────────────

import { app as appFromRoot } from '../../src/index';

// ────────────────────────────────────────────────────────────
// namespace import（禁止エクスポートの確認用）
// ────────────────────────────────────────────────────────────

import * as appBarrel from '../../src/app/index';
import * as rootBarrel from '../../src/index';

// ────────────────────────────────────────────────────────────
// Req 2.2: App barrel の値エクスポート確認
// ────────────────────────────────────────────────────────────

describe('App barrel — 値エクスポートの確認 (Req 2.2)', () => {
  it('app が関数としてエクスポートされている', () => {
    expect(typeof app).toBe('function');
  });

  it('appFromRoot（ルート barrel 経由）も関数としてエクスポートされている', () => {
    expect(typeof appFromRoot).toBe('function');
  });
});

// ────────────────────────────────────────────────────────────
// Req 3.1, 3.2: State<T> / Computed<T> の型チェック（コンパイル確認）
// ────────────────────────────────────────────────────────────

describe('App barrel — 型エクスポートの確認 (Req 3.1, 3.2)', () => {
  it('State<T> 型は type-only であり new State() は呼べない（コンパイル通過確認）', () => {
    // State<T> はインターフェース型のみ。new State() を試みると TS エラーになる。
    // ここではランタイムとして appBarrel に State コンストラクタが含まれないことを確認する。
    // (コンパイルが通ること自体が型チェックの証明)
    const keys = Object.keys(appBarrel);
    expect(keys).not.toContain('State');
  });

  it('Computed<T> 型は type-only であり appBarrel に値エクスポートされていない', () => {
    const keys = Object.keys(appBarrel);
    expect(keys).not.toContain('Computed');
  });

  it('AppContext 型は appBarrel から値・型ともに除去されている (1.0.0)', () => {
    const keys = Object.keys(appBarrel);
    expect(keys).not.toContain('AppContext');
    // 型 export も除去確認: runtime keys には現れないため、これで型 export の不在の代替確認
    // TypeScript レベルでは import type { AppContext } from '../../src/app/index' が compile-fail することで担保される
  });

  it('AppContext 型はルート barrel (src/index) からも除去されている (1.0.0)', () => {
    const keys = Object.keys(rootBarrel);
    expect(keys).not.toContain('AppContext');
  });
});

// ────────────────────────────────────────────────────────────
// Req 3.3, 5.3: APPX-1 — counter スモークテスト
// ────────────────────────────────────────────────────────────

describe('APPX-1 — counter パターンのスモークテスト (Req 3.3, 5.3)', () => {
  it('app().state(0) が State<number> を返す', () => {
    const ctx: AppDocument = app();
    const counter: State<number> = ctx.state(0);
    expect(counter).toBeDefined();
    expect(typeof counter.get).toBe('function');
    expect(typeof counter.set).toBe('function');
    expect(typeof counter.update).toBe('function');
    expect(typeof counter.map).toBe('function');
  });

  it('.set() が例外を投げない', () => {
    const ctx: AppDocument = app();
    const counter: State<number> = ctx.state(0);
    expect(() => counter.set(1)).not.toThrow();
  });

  it('.update() が例外を投げない', () => {
    const ctx: AppDocument = app();
    const counter: State<number> = ctx.state(0);
    const expr = counter.get(); // JsExpr を更新式として使用
    expect(() => counter.update(expr)).not.toThrow();
  });

  it('.map() が Computed<T> を返し例外を投げない', () => {
    const ctx: AppDocument = app();
    const counter: State<number> = ctx.state(0);
    let computed: Computed<string>;
    expect(() => {
      computed = counter.map((n: number) => String(n));
    }).not.toThrow();
    expect(computed!).toBeDefined();
    expect(typeof computed!.get).toBe('function');
  });

  it('counter パターン全体がコンパイルエラーなしに動作する', () => {
    // フルパターン: app() → state → set / update / map の連鎖
    const ctx: AppDocument = app();
    const counter: State<number> = ctx.state(0);
    const doubled: Computed<number> = counter.map((n: number) => n * 2);

    expect(counter).toBeDefined();
    expect(doubled).toBeDefined();

    // get() は JsExpr オブジェクトを返す
    const expr = counter.get();
    expect(expr.__jsExpr).toBe(true);

    const doubledExpr = doubled.get();
    expect(doubledExpr.__jsExpr).toBe(true);
  });

  it('ルート barrel 経由の appFromRoot でも同じパターンが動作する', () => {
    const ctx: AppDocument = appFromRoot();
    const counter = ctx.state(0);
    expect(counter).toBeDefined();
    expect(typeof counter.get).toBe('function');
    expect(typeof counter.set).toBe('function');
    expect(typeof counter.update).toBe('function');
    expect(typeof counter.map).toBe('function');
  });
});

// ────────────────────────────────────────────────────────────
// Req 5.1, 5.2: App barrel は view/page/Button 等を export しない
// ────────────────────────────────────────────────────────────

describe('App barrel — 禁止エクスポートの確認 (Req 5.1, 5.2)', () => {
  it('App barrel は "page" をエクスポートしない', () => {
    expect('page' in appBarrel).toBe(false);
  });

  it('App barrel は "Button" をエクスポートしない', () => {
    expect('Button' in appBarrel).toBe(false);
  });

  it('App barrel は "ReadableState" をエクスポートしない', () => {
    expect('ReadableState' in appBarrel).toBe(false);
  });

  it('App barrel がエクスポートする値は app と AppDocument のみ（値エクスポート）', () => {
    const keys = Object.keys(appBarrel).sort();
    // 値エクスポートは app と AppDocument のみ（State / Computed / AppContext / AppOptions / AppView は type-only）
    expect(keys).toEqual(['AppDocument', 'app']);
  });
});
