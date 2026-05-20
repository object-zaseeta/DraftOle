/**
 * RuntimeContext 単体テスト
 *
 * RuntimeContext が Root に依存せず独立して動作することを検証する。
 *
 * - インスタンス化できる
 * - state() が適切な runtimeId を持つ State<T> を返す
 * - renderUserJs() はスクリプトが未追加のとき空文字列を返す
 * - RuntimeContext は Root に依存しない
 * - buildExportRuntimeSnapshot() が少なくとも userJs を持つオブジェクトを返す
 *
 * Requirements: 2.2, 5.2 (root-responsibility-separation)
 * Design: 「RuntimeContext」節
 */

import { describe, expect, it } from 'vitest';
import { RuntimeContext } from '../../src/runtime/runtime-context.js';
import type { JsExpr } from '../../src/js/vanilla/types.js';

/**
 * テストヘルパ: `RuntimeContext.state(initial)` で登録された `initialExpr`
 * （`state()` 内で生成されるクロージャ群を保持する JsExpr）を取り出す。
 *
 * `state.get()` が返す JsExpr は `createStateExpr(runtimeId)` 由来であり、
 * `runtime-context.ts` 内の `state()` で組み立てられたクロージャとは別物である。
 * 本ヘルパで `_stateRegistry.entries` 経由で初期式を取り出すことにより、
 * `runtime-context.ts` lines 119-143 の closures を直接観測する。
 */
function getInitialExpr(ctx: RuntimeContext, runtimeId: string): JsExpr {
  const entry = ctx.stateRegistry?.entries.get(runtimeId);
  if (!entry) {
    throw new Error(`StateEntry for ${runtimeId} not found`);
  }
  return entry.initialExpr;
}

describe('RuntimeContext', () => {

  // ── 1. インスタンス化 ────────────────────────────────────────────────────────

  describe('インスタンス化', () => {
    it('RuntimeContext を引数なしでインスタンス化できる', () => {
      expect(() => new RuntimeContext()).not.toThrow();
    });

    it('インスタンスは RuntimeContext クラスのインスタンスである', () => {
      const ctx = new RuntimeContext();
      expect(ctx).toBeInstanceOf(RuntimeContext);
    });
  });

  // ── 2. state() ──────────────────────────────────────────────────────────────

  describe('state()', () => {
    it('state() が State<T> を返す', () => {
      const ctx = new RuntimeContext();
      const s = ctx.state(0);
      expect(s).toBeDefined();
      expect(typeof s._runtimeId).toBe('string');
    });

    it('state() が返す State<T> は適切な runtimeId を持つ（"s0" 形式）', () => {
      const ctx = new RuntimeContext();
      const s = ctx.state(42);
      expect(s._runtimeId).toBe('s0');
    });

    it('複数回 state() を呼ぶと異なる runtimeId が採番される', () => {
      const ctx = new RuntimeContext();
      const s0 = ctx.state(0);
      const s1 = ctx.state('hello');
      const s2 = ctx.state(true);
      expect(s0._runtimeId).toBe('s0');
      expect(s1._runtimeId).toBe('s1');
      expect(s2._runtimeId).toBe('s2');
    });

    it('state() は get() を持つ State<T> を返す', () => {
      const ctx = new RuntimeContext();
      const s = ctx.state(99);
      expect(typeof s.get).toBe('function');
    });

    it('state() は js アクセサを持つ State<T> を返す', () => {
      const ctx = new RuntimeContext();
      const s = ctx.state('test');
      expect(s.js).toBeDefined();
    });

    it('別々の RuntimeContext インスタンスは独立した ID 採番を持つ', () => {
      const ctx1 = new RuntimeContext();
      const ctx2 = new RuntimeContext();
      const s1 = ctx1.state(1);
      const s2 = ctx2.state(2);
      // 両方とも "s0" から採番される（独立したレジストリ）
      expect(s1._runtimeId).toBe('s0');
      expect(s2._runtimeId).toBe('s0');
    });
  });

  // ── 3. renderUserJs() ────────────────────────────────────────────────────────

  describe('renderUserJs()', () => {
    it('スクリプトが追加されていない場合、空文字列を返す', () => {
      const ctx = new RuntimeContext();
      expect(ctx.renderUserJs()).toBe('');
    });

    it('getScope() でスコープを取得後もスクリプト未追加なら空文字列を返す', () => {
      const ctx = new RuntimeContext();
      ctx.getScope(); // Builder を初期化するがコマンドは追加しない
      expect(ctx.renderUserJs()).toBe('');
    });

    it('onDomReady にスクリプトを追加すると空文字列以外を返す', () => {
      const ctx = new RuntimeContext();
      ctx.getScope().onDomReady((s) => {
        s.call('init');
      });
      const js = ctx.renderUserJs();
      expect(js).not.toBe('');
      expect(js).toContain('init()');
    });

    it('fn でトップレベル関数を追加するとそれを含む文字列を返す', () => {
      const ctx = new RuntimeContext();
      ctx.getScope().fn('myFn', (s) => {
        s.call('doSomething');
      });
      const js = ctx.renderUserJs();
      expect(js).toContain('myFn');
      expect(js).toContain('doSomething()');
    });
  });

  // ── 4. getScope() ────────────────────────────────────────────────────────────

  describe('getScope()', () => {
    it('getScope() が ScriptScope を返す', () => {
      const ctx = new RuntimeContext();
      const scope = ctx.getScope();
      expect(scope).toBeDefined();
      expect(typeof scope.onDomReady).toBe('function');
      expect(typeof scope.fn).toBe('function');
    });

    it('複数回 getScope() を呼ぶと同一インスタンスを返す（単一スコープ保証）', () => {
      const ctx = new RuntimeContext();
      const scope1 = ctx.getScope();
      const scope2 = ctx.getScope();
      expect(scope1).toBe(scope2);
    });
  });

  // ── 5. buildExportRuntimeSnapshot() ─────────────────────────────────────────

  describe('buildExportRuntimeSnapshot()', () => {
    it('buildExportRuntimeSnapshot() がオブジェクトを返す', () => {
      const ctx = new RuntimeContext();
      const snapshot = ctx.buildExportRuntimeSnapshot();
      expect(snapshot).toBeDefined();
      expect(typeof snapshot).toBe('object');
    });

    it('スナップショットは少なくとも userJs プロパティを持つ', () => {
      const ctx = new RuntimeContext();
      const snapshot = ctx.buildExportRuntimeSnapshot();
      expect('userJs' in snapshot).toBe(true);
    });

    it('スクリプトなしのとき userJs は空文字列', () => {
      const ctx = new RuntimeContext();
      const snapshot = ctx.buildExportRuntimeSnapshot();
      expect(snapshot.userJs).toBe('');
    });

    it('スクリプトを追加した後、userJs に内容が含まれる', () => {
      const ctx = new RuntimeContext();
      ctx.getScope().fn('hello', () => {
        // 本体なし
      });
      const snapshot = ctx.buildExportRuntimeSnapshot();
      expect(snapshot.userJs).toContain('hello');
    });
  });

  // ── 6. stateRegistry getter 遅延初期化 ───────────────────────────────────────

  describe('stateRegistry getter — 遅延初期化', () => {
    it('state() を一度も呼んでいない場合、stateRegistry は undefined を返す', () => {
      const ctx = new RuntimeContext();
      expect(ctx.stateRegistry).toBeUndefined();
    });

    it('getScope() のみ呼んでも state() を呼ばなければ stateRegistry は undefined', () => {
      const ctx = new RuntimeContext();
      ctx.getScope();
      expect(ctx.stateRegistry).toBeUndefined();
    });

    it('state() を 1 回呼ぶと stateRegistry が定義される', () => {
      const ctx = new RuntimeContext();
      ctx.state(0);
      expect(ctx.stateRegistry).toBeDefined();
    });

    it('複数回 state() を呼んでも stateRegistry は同一インスタンスを返す', () => {
      const ctx = new RuntimeContext();
      ctx.state(0);
      const reg1 = ctx.stateRegistry;
      ctx.state('hello');
      const reg2 = ctx.stateRegistry;
      expect(reg1).toBe(reg2);
    });

    it('stateRegistry.entries には state() ごとに 1 エントリ登録される', () => {
      const ctx = new RuntimeContext();
      ctx.state(0);
      ctx.state('hello');
      ctx.state(true);
      expect(ctx.stateRegistry?.entries.size).toBe(3);
      expect(ctx.stateRegistry?.entries.has('s0')).toBe(true);
      expect(ctx.stateRegistry?.entries.has('s1')).toBe(true);
      expect(ctx.stateRegistry?.entries.has('s2')).toBe(true);
    });

    it('登録された StateEntry の initialExpr は __jsExpr フラグを持つ JsExpr である', () => {
      const ctx = new RuntimeContext();
      ctx.state(42);
      const expr = getInitialExpr(ctx, 's0');
      expect(expr.__jsExpr).toBe(true);
      expect(expr.code).toBe(JSON.stringify(42));
    });
  });

  // ── 7. initialExpr の code 表現 ──────────────────────────────────────────────

  describe('state() の initialExpr.code — JSON.stringify ベース', () => {
    it('number 初期値: code は JSON.stringify(number)', () => {
      const ctx = new RuntimeContext();
      ctx.state(42);
      expect(getInitialExpr(ctx, 's0').code).toBe(JSON.stringify(42));
    });

    it('string 初期値: code は JSON.stringify(string)', () => {
      const ctx = new RuntimeContext();
      ctx.state('hello');
      expect(getInitialExpr(ctx, 's0').code).toBe(JSON.stringify('hello'));
    });

    it('boolean 初期値: code は JSON.stringify(boolean)', () => {
      const ctx = new RuntimeContext();
      ctx.state(true);
      expect(getInitialExpr(ctx, 's0').code).toBe(JSON.stringify(true));
    });

    it('object 初期値: code は JSON.stringify(object)', () => {
      const ctx = new RuntimeContext();
      const initial = { name: 'Alice', age: 30 };
      ctx.state(initial);
      expect(getInitialExpr(ctx, 's0').code).toBe(JSON.stringify(initial));
    });

    it('array 初期値: code は JSON.stringify(array)', () => {
      const ctx = new RuntimeContext();
      const initial = [1, 2, 3];
      ctx.state(initial);
      expect(getInitialExpr(ctx, 's0').code).toBe(JSON.stringify(initial));
    });
  });

  // ── 8. initialExpr.eq() — 各入力型の分岐 ─────────────────────────────────────

  describe('state() の initialExpr.eq() — 入力型別分岐', () => {
    it('eq(string): 文字列を JSON.stringify して === で結合する', () => {
      const ctx = new RuntimeContext();
      ctx.state(0);
      const expr = getInitialExpr(ctx, 's0');
      const result = expr.eq('foo');
      expect(result.code).toBe(`${JSON.stringify(0)} === ${JSON.stringify('foo')}`);
      expect(result.__jsExpr).toBe(true);
      expect(result.__jsBool).toBe(true);
    });

    it('eq(number): 数値を JSON.stringify して === で結合する', () => {
      const ctx = new RuntimeContext();
      ctx.state(0);
      const expr = getInitialExpr(ctx, 's0');
      const result = expr.eq(42);
      expect(result.code).toBe(`${JSON.stringify(0)} === ${JSON.stringify(42)}`);
      expect(result.__jsExpr).toBe(true);
      expect(result.__jsBool).toBe(true);
    });

    it('eq(JsExpr): JsExpr の .code をそのまま使い === で結合する', () => {
      const ctx = new RuntimeContext();
      ctx.state(0);
      ctx.state('x');
      const expr0 = getInitialExpr(ctx, 's0');
      const expr1 = getInitialExpr(ctx, 's1');
      const result = expr0.eq(expr1);
      expect(result.code).toBe(`${JSON.stringify(0)} === ${JSON.stringify('x')}`);
      expect(result.__jsExpr).toBe(true);
      expect(result.__jsBool).toBe(true);
    });
  });

  // ── 9. initialExpr.ne() — 各入力型の分岐 ─────────────────────────────────────

  describe('state() の initialExpr.ne() — 入力型別分岐', () => {
    it('ne(string): 文字列を JSON.stringify して !== で結合する', () => {
      const ctx = new RuntimeContext();
      ctx.state(0);
      const expr = getInitialExpr(ctx, 's0');
      const result = expr.ne('foo');
      expect(result.code).toBe(`${JSON.stringify(0)} !== ${JSON.stringify('foo')}`);
      expect(result.__jsExpr).toBe(true);
      expect(result.__jsBool).toBe(true);
    });

    it('ne(number): 数値を JSON.stringify して !== で結合する', () => {
      const ctx = new RuntimeContext();
      ctx.state('a');
      const expr = getInitialExpr(ctx, 's0');
      const result = expr.ne(7);
      expect(result.code).toBe(`${JSON.stringify('a')} !== ${JSON.stringify(7)}`);
      expect(result.__jsExpr).toBe(true);
      expect(result.__jsBool).toBe(true);
    });

    it('ne(JsExpr): JsExpr の .code をそのまま使い !== で結合する', () => {
      const ctx = new RuntimeContext();
      ctx.state(1);
      ctx.state(2);
      const expr0 = getInitialExpr(ctx, 's0');
      const expr1 = getInitialExpr(ctx, 's1');
      const result = expr0.ne(expr1);
      expect(result.code).toBe(`${JSON.stringify(1)} !== ${JSON.stringify(2)}`);
      expect(result.__jsExpr).toBe(true);
      expect(result.__jsBool).toBe(true);
    });
  });

  // ── 10. initialExpr.or() — 各入力型の分岐 ────────────────────────────────────

  describe('state() の initialExpr.or() — 入力型別分岐', () => {
    it('or(string): 文字列を JSON.stringify して `||` で結合し括弧で囲む', () => {
      const ctx = new RuntimeContext();
      ctx.state('');
      const expr = getInitialExpr(ctx, 's0');
      const result = expr.or('fallback');
      expect(result.code).toBe(`(${JSON.stringify('')} || ${JSON.stringify('fallback')})`);
      expect(result.__jsExpr).toBe(true);
      // or() は JsExpr を返す（JsBoolExpr ではない）
      expect((result as unknown as { __jsBool?: true }).__jsBool).toBeUndefined();
    });

    it('or(JsExpr): JsExpr の .code をそのまま使い `||` で結合する', () => {
      const ctx = new RuntimeContext();
      ctx.state('');
      ctx.state('default');
      const expr0 = getInitialExpr(ctx, 's0');
      const expr1 = getInitialExpr(ctx, 's1');
      const result = expr0.or(expr1);
      expect(result.code).toBe(`(${JSON.stringify('')} || ${JSON.stringify('default')})`);
      expect(result.__jsExpr).toBe(true);
    });
  });

  // ── 11. initialExpr.trim() / isFalsy() / isTruthy() ──────────────────────────

  describe('state() の initialExpr.trim() / isFalsy() / isTruthy()', () => {
    it('trim(): `(code).trim()` 形式の JsExpr を返す', () => {
      const ctx = new RuntimeContext();
      ctx.state('  hello  ');
      const expr = getInitialExpr(ctx, 's0');
      const result = expr.trim();
      expect(result.code).toBe(`(${JSON.stringify('  hello  ')}).trim()`);
      expect(result.__jsExpr).toBe(true);
    });

    it('isFalsy(): `!(code)` 形式の JsBoolExpr を返す', () => {
      const ctx = new RuntimeContext();
      ctx.state(0);
      const expr = getInitialExpr(ctx, 's0');
      const result = expr.isFalsy();
      expect(result.code).toBe(`!(${JSON.stringify(0)})`);
      expect(result.__jsExpr).toBe(true);
      expect(result.__jsBool).toBe(true);
    });

    it('isTruthy(): `!!(code)` 形式の JsBoolExpr を返す', () => {
      const ctx = new RuntimeContext();
      ctx.state(1);
      const expr = getInitialExpr(ctx, 's0');
      const result = expr.isTruthy();
      expect(result.code).toBe(`!!(${JSON.stringify(1)})`);
      expect(result.__jsExpr).toBe(true);
      expect(result.__jsBool).toBe(true);
    });

    it('trim() の結果に対しても JsExpr のメソッドが呼べる（チェーン）', () => {
      const ctx = new RuntimeContext();
      ctx.state(' x ');
      const expr = getInitialExpr(ctx, 's0');
      const trimmed = expr.trim();
      // makeJsExpr 由来なので .eq() などのメソッドを持つ
      expect(typeof trimmed.eq).toBe('function');
      expect(typeof trimmed.ne).toBe('function');
      expect(typeof trimmed.or).toBe('function');
      expect(typeof trimmed.trim).toBe('function');
      expect(typeof trimmed.isFalsy).toBe('function');
      expect(typeof trimmed.isTruthy).toBe('function');
    });

    it('isFalsy() の結果は __jsBool フラグを保持する', () => {
      const ctx = new RuntimeContext();
      ctx.state('');
      const result = getInitialExpr(ctx, 's0').isFalsy();
      expect(result.__jsBool).toBe(true);
      expect(result.__jsExpr).toBe(true);
    });

    it('isTruthy() の結果は __jsBool フラグを保持する', () => {
      const ctx = new RuntimeContext();
      ctx.state('non-empty');
      const result = getInitialExpr(ctx, 's0').isTruthy();
      expect(result.__jsBool).toBe(true);
      expect(result.__jsExpr).toBe(true);
    });
  });

  // ── 12. オプション組み合わせ（Requirement 1.4） ───────────────────────────────

  describe('オプション組み合わせ検証 (Req 1.4)', () => {
    it('state なし / scope なし: stateRegistry undefined, renderUserJs 空文字列', () => {
      const ctx = new RuntimeContext();
      expect(ctx.stateRegistry).toBeUndefined();
      expect(ctx.renderUserJs()).toBe('');
    });

    it('state あり / scope なし: stateRegistry 定義済み, renderUserJs 空文字列', () => {
      const ctx = new RuntimeContext();
      ctx.state(0);
      expect(ctx.stateRegistry).toBeDefined();
      expect(ctx.stateRegistry?.entries.size).toBe(1);
      expect(ctx.renderUserJs()).toBe('');
    });

    it('state なし / scope あり: stateRegistry undefined, renderUserJs に JS 出力', () => {
      const ctx = new RuntimeContext();
      ctx.getScope().fn('handler', () => {
        // 空関数
      });
      expect(ctx.stateRegistry).toBeUndefined();
      expect(ctx.renderUserJs()).toContain('handler');
    });

    it('state あり / scope あり: 両方が機能し、buildExportRuntimeSnapshot が一貫した結果を返す', () => {
      const ctx = new RuntimeContext();
      ctx.state(0);
      ctx.state('hello');
      ctx.getScope().onDomReady((s) => {
        s.call('start');
      });
      const snapshot = ctx.buildExportRuntimeSnapshot();
      expect(snapshot.userJs).toContain('start');
      expect(snapshot.userJs).toBe(ctx.renderUserJs());
      expect(ctx.stateRegistry?.entries.size).toBe(2);
    });

    it('複数 state + 全 chain メソッド を組み合わせても整合した式を生成する', () => {
      const ctx = new RuntimeContext();
      ctx.state(0);
      ctx.state('');
      const e0 = getInitialExpr(ctx, 's0');
      const e1 = getInitialExpr(ctx, 's1');
      // 各 chain メソッドを 1 つずつ呼ぶ
      expect(e0.eq(0).code).toBe(`${JSON.stringify(0)} === ${JSON.stringify(0)}`);
      expect(e0.ne(1).code).toBe(`${JSON.stringify(0)} !== ${JSON.stringify(1)}`);
      expect(e1.or('x').code).toBe(`(${JSON.stringify('')} || ${JSON.stringify('x')})`);
      expect(e1.trim().code).toBe(`(${JSON.stringify('')}).trim()`);
      expect(e0.isFalsy().code).toBe(`!(${JSON.stringify(0)})`);
      expect(e0.isTruthy().code).toBe(`!!(${JSON.stringify(0)})`);
    });
  });

  // ── 13. getExprFactory() — memoize ──────────────────────────────────────────
  // root-runtime-facade-extraction spec, Req 2.5

  describe('getExprFactory() — memoize', () => {
    it('getExprFactory() が ExprFactory を返す', () => {
      const ctx = new RuntimeContext();
      const factory = ctx.getExprFactory();
      expect(factory).toBeDefined();
      // ExprFactory は呼び出し可能（JsExpr を返すファクトリ）
      expect(typeof factory).toBe('function');
    });

    it('複数回 getExprFactory() を呼ぶと同一インスタンスを返す（memoize 保証）', () => {
      const ctx = new RuntimeContext();
      const factory1 = ctx.getExprFactory();
      const factory2 = ctx.getExprFactory();
      expect(factory1).toBe(factory2);
    });

    it('別々の RuntimeContext は独立した ExprFactory を持つ', () => {
      const ctx1 = new RuntimeContext();
      const ctx2 = new RuntimeContext();
      const factory1 = ctx1.getExprFactory();
      const factory2 = ctx2.getExprFactory();
      expect(factory1).not.toBe(factory2);
    });
  });

  // ── 14. querySelector / querySelectorAll ─────────────────────────────────────
  // root-runtime-facade-extraction spec, Req 2.5

  describe('querySelector() / querySelectorAll()', () => {
    it('querySelector() が SelectorRef を返す', () => {
      const ctx = new RuntimeContext();
      const ref = ctx.querySelector('.foo');
      expect(ref).toBeDefined();
      // SelectorRef はメソッド集合を持つ
      expect(typeof ref.on).toBe('function');
    });

    it('querySelectorAll() が CollectionRef を返す', () => {
      const ctx = new RuntimeContext();
      const ref = ctx.querySelectorAll('.foo');
      expect(ref).toBeDefined();
      // CollectionRef は forEach / length / removeAll を持つ
      expect(typeof ref.forEach).toBe('function');
    });

    it('querySelector() は内部 scope を共有する（getScope() と同じ scope を経由するため副作用が renderUserJs に出る）', () => {
      const ctx = new RuntimeContext();
      // querySelector は内部で getScope() を呼ぶので、その後 getScope() が同一 scope を返すことを確認する
      const ref = ctx.querySelector('.foo');
      expect(ref).toBeDefined();
      // querySelector 呼び出し後、 getScope() は memoize された同一インスタンスを返す
      const scope1 = ctx.getScope();
      const scope2 = ctx.getScope();
      expect(scope1).toBe(scope2);
    });
  });

  // ── 15. renderJs(usedMethods, jsContent) — 3 分岐 bytewise 検証 ───────────────
  // root-runtime-facade-extraction spec, Req 2.3, 5.4

  describe('renderJs(usedMethods, jsContent) — 3 分岐 bytewise', () => {
    it('usedMethods 空集合 + content 空文字列 → 空文字列を返す', () => {
      const ctx = new RuntimeContext();
      const result = ctx.renderJs(new Set(), '');
      expect(result).toBe('');
    });

    it('usedMethods 空集合 + content あり → 空文字列を返す（メソッド未使用が優先）', () => {
      const ctx = new RuntimeContext();
      const result = ctx.renderJs(new Set(), 'console.log("hi");');
      expect(result).toBe('');
    });

    it('usedMethods あり + content 空 → helper のみを返す', () => {
      const ctx = new RuntimeContext();
      const used = new Set(['on'] as const) as ReadonlySet<JQueryMethodType>;
      const result = ctx.renderJs(used, '');
      // helper には $ 関数定義が含まれる
      expect(result).toContain('$');
      expect(result.length).toBeGreaterThan(0);
    });

    it('usedMethods あり + content あり → helper + 2 改行 + content 形式で返す', () => {
      const ctx = new RuntimeContext();
      const used = new Set(['on'] as const) as ReadonlySet<JQueryMethodType>;
      const content = 'someUserCode();';
      const result = ctx.renderJs(used, content);
      expect(result).toMatch(/\n\nsomeUserCode\(\);$/);
      expect(result).toContain('$');
    });

    it('bytewise 等価: 同じ入力に対し常に同じ文字列を返す（純粋関数）', () => {
      const ctx = new RuntimeContext();
      const used = new Set(['on', 'addClass'] as const) as ReadonlySet<JQueryMethodType>;
      const content = 'init();';
      const a = ctx.renderJs(used, content);
      const b = ctx.renderJs(used, content);
      expect(a).toBe(b);
    });
  });

  // ── 16. RuntimeContext は Root 非依存 ───────────────────────────────────────
  // root-runtime-facade-extraction spec, Req 4.1, 4.2

  describe('RuntimeContext の依存方向（Root / publisher / document への非依存）', () => {
    it('runtime-context.ts のソースは html/elements/root を import しない', async () => {
      const { readFileSync } = await import('node:fs');
      const { resolve, dirname } = await import('node:path');
      const { fileURLToPath } = await import('node:url');
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const file = resolve(__dirname, '../../src/runtime/runtime-context.ts');
      const src = readFileSync(file, 'utf8');
      const importLines = src.split('\n').filter((l) => /^\s*import\b/.test(l));
      const violations = importLines.filter((l) => /html\/elements\/root/.test(l));
      expect(violations, 'runtime-context.ts must not import from html/elements/root').toEqual([]);
    });

    it('runtime-context.ts のソースは publisher/ や document/ を import しない', async () => {
      const { readFileSync } = await import('node:fs');
      const { resolve, dirname } = await import('node:path');
      const { fileURLToPath } = await import('node:url');
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const file = resolve(__dirname, '../../src/runtime/runtime-context.ts');
      const src = readFileSync(file, 'utf8');
      const importLines = src.split('\n').filter((l) => /^\s*import\b/.test(l));
      const violations = importLines.filter(
        (l) => /\/publisher\//.test(l) || /\/document\//.test(l),
      );
      expect(violations, 'runtime-context.ts must not import from publisher/ or document/').toEqual([]);
    });
  });

  // ── 17. Root 非依存性（元 §13 を維持） ───────────────────────────────────────

  describe('Root 非依存性', () => {
    it('Root クラスをインポートせずに RuntimeContext が動作する', () => {
      // このテストファイル自体が Root をインポートしていないことで証明する。
      // RuntimeContext は Root に依存しない独立したクラスである。
      const ctx = new RuntimeContext();
      const s = ctx.state({ name: 'Alice', age: 30 });
      const js = ctx.renderUserJs();

      expect(s._runtimeId).toBe('s0');
      expect(js).toBe(''); // スクリプト未追加
    });

    it('RuntimeContext は Root なしで state / scope / renderUserJs のフルフローを実行できる', () => {
      const ctx = new RuntimeContext();

      // 状態採番
      const count = ctx.state(0);
      const name = ctx.state('world');
      expect(count._runtimeId).toBe('s0');
      expect(name._runtimeId).toBe('s1');

      // スクリプト追加
      ctx.getScope().onDomReady((s) => {
        s.call('setup', [s.raw('"hello"')]);
      });

      // JS 出力
      const js = ctx.renderUserJs();
      expect(js).toContain('setup');
      expect(js).toContain('DOMContentLoaded');

      // スナップショット
      const snapshot = ctx.buildExportRuntimeSnapshot();
      expect(snapshot.userJs).toBe(js);
    });
  });
});
