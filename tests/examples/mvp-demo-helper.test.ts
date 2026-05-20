// @vitest-environment jsdom
/**
 * Task 5.1: mvp-demo-helper の addButton click → todos 追加 を jsdom 環境で検証する
 *
 * 検証観点:
 *   - jsdom 環境上で `tests/examples/fixtures/mvp-demo-helper.ts` の build 成果物
 *     (`.out/runs/mvp_demo_helper/{index.html,script.js}`) をロードし、
 *     `__draftole__` runtime / addButton click handler が期待通りに動作することを確認する。
 *   - draft state に文字列を投入した状態で addButton の click event を dispatch すると、
 *     todos state (s0) に新規 entry が追加される。
 *
 * Requirements: 3.1, 3.3
 * Design: tests > tests/examples/mvp-demo-helper.test.ts (新規) / Decision: jsdom を本 test に限定導入
 * Spec: .kiro/specs/handler-transformer-dx/
 *
 * NOTE: `execFileSync` の使用は既存 `tests/examples/build-examples.test.ts` と同様、
 * 固定パス引数のみを渡す安全用途（shell 不経由・引数は const）であり、command injection
 * のリスクは無い。テスト環境のみで実行され、ユーザー入力は介在しない。
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

// -----------------------------------------------------------------------
// パス解決
// -----------------------------------------------------------------------

const ROOT_DIR = join(import.meta.dirname, '../..');
const BUILD_SCRIPT = join(ROOT_DIR, 'scripts/build-examples.ts');
const FIXTURE = join(ROOT_DIR, 'tests/examples/fixtures/mvp-demo-helper.ts');
const RUN_DIR = join(ROOT_DIR, '.out/runs/mvp_demo_helper');
const INDEX_HTML = join(RUN_DIR, 'index.html');
const SCRIPT_JS = join(RUN_DIR, 'script.js');

// -----------------------------------------------------------------------
// 型定義（prelude が公開する runtime 形状）
// -----------------------------------------------------------------------

interface RuntimeState<T> {
  get(): T;
  set(v: T): void;
  subscribe(fn: (v: T) => void): () => void;
}

interface DraftoleRuntime {
  initState<T>(id: string, initial: T): void;
  state<T>(id: string): RuntimeState<T>;
}

type Todo = { text: string; done: boolean };

type WindowWithRuntime = typeof globalThis & {
  __draftole__?: DraftoleRuntime;
};

// -----------------------------------------------------------------------
// テストヘルパー
// -----------------------------------------------------------------------

/** microtask flush（prelude は queueMicrotask で通知を batch する） */
function flushMicrotasks(): Promise<void> {
  return new Promise<void>((resolve) => {
    queueMicrotask(() => queueMicrotask(() => resolve()));
  });
}

/** index.html の <body> 内 HTML を抽出して document.body に注入する */
function injectBodyFromIndexHtml(html: string): void {
  const match = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html);
  if (match === null) {
    throw new Error('index.html: <body> セクションが見つかりません');
  }
  // body 内の <script defer src="script.js"></script> はテストで eval するため除外
  const bodyInner = match[1]!.replace(
    /<script\b[^>]*src=["']script\.js["'][^>]*><\/script>/i,
    '',
  );
  document.body.innerHTML = bodyInner;
}

/** script.js の中身を jsdom 環境上で実行する（prelude IIFE + binding 出力） */
function evaluateScript(scriptSource: string): void {
  // script.js は IIFE 内で window.__draftole__ を設定し、続けて initState / bind* を呼び出す。
  // jsdom 環境では globalThis === window のため、そのまま eval すれば runtime が登録される。
  new Function(scriptSource)();
}

// -----------------------------------------------------------------------
// セットアップ：fixture を build して .out/runs/mvp_demo_helper/ を確保
// -----------------------------------------------------------------------

beforeAll(() => {
  // build-examples.ts --run で .out/examples/mvp-demo-helper.js と
  // .out/runs/mvp_demo_helper/{index.html,script.js} を生成する。
  // 既に最新版が存在する場合でも、fixture / transformer 変更後の追従を担保するため毎回再生成する。
  execFileSync('node', ['--experimental-strip-types', BUILD_SCRIPT, FIXTURE, '--run'], {
    cwd: ROOT_DIR,
    encoding: 'utf-8',
    timeout: 60_000,
  });

  if (!existsSync(INDEX_HTML)) {
    throw new Error(`build artifact が生成されませんでした: ${INDEX_HTML}`);
  }
  if (!existsSync(SCRIPT_JS)) {
    throw new Error(`build artifact が生成されませんでした: ${SCRIPT_JS}`);
  }
});

// -----------------------------------------------------------------------
// テスト本体
// -----------------------------------------------------------------------

describe('mvp-demo-helper (jsdom): addButton click → todos 追加', () => {
  it('draft 入力後に addButton を click すると todos state に entry が追加される', async () => {
    // 1. build 成果物をロード
    const html = readFileSync(INDEX_HTML, 'utf-8');
    const scriptSource = readFileSync(SCRIPT_JS, 'utf-8');

    // 2. body を inject してから script を eval（prelude IIFE が runtime を登録）
    injectBodyFromIndexHtml(html);
    evaluateScript(scriptSource);

    const win = window as WindowWithRuntime;
    const rt = win.__draftole__;
    expect(rt, '__draftole__ runtime が window に公開されていること').toBeDefined();
    if (rt === undefined) return;

    // 3. 初期状態：todos (s0) は空配列
    const todosState = rt.state<Todo[]>('s0');
    expect(todosState.get()).toEqual([]);

    // 4. draft state (s1) に文字列を投入
    //    （実 UI 上は draftField の input event 経由だが、helper click が参照するのは
    //      draft state の値のみのため、ここでは state を直接 set する）
    const draftState = rt.state<string>('s1');
    draftState.set('buy milk');
    await flushMicrotasks();
    expect(draftState.get()).toBe('buy milk');

    // 5. addButton を取得して click event を dispatch
    //    fixture 内の「追加」ボタンは textContent === '追加' で一意に特定可能。
    const buttons = Array.from(document.querySelectorAll('button'));
    const addButton = buttons.find((b) => b.textContent?.trim() === '追加');
    expect(addButton, '「追加」ボタンが DOM に存在すること').toBeDefined();
    if (addButton === undefined) return;

    addButton.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await flushMicrotasks();

    // 6. todos state に新規 entry が追加され、draft state はクリアされる
    const todos = todosState.get();
    expect(todos).toHaveLength(1);
    expect(todos[0]).toEqual({ text: 'buy milk', done: false });
    expect(draftState.get()).toBe('');
  });
});

// -----------------------------------------------------------------------
// Task 5.2: clearDoneButton click → completed entries 除去
// -----------------------------------------------------------------------
//
// 検証観点:
//   - helper 関数 `clearDoneButton` 内の `.on('click', ...)` handler が
//     transformer によって正しく書き出され、jsdom 上で click event を発火すると
//     todos state から done: true な entry のみが除去される。
//
// Requirements: 3.2, 3.3
// Design: tests > tests/examples/mvp-demo-helper.test.ts / clearDoneButton 検証
// -----------------------------------------------------------------------

describe('mvp-demo-helper (jsdom): clearDoneButton click → completed entries 除去', () => {
  it('done: true な entry のみを todos state から除去し、未完了 entry は保持される', async () => {
    // 1. build 成果物をロード（beforeAll で生成済）
    const html = readFileSync(INDEX_HTML, 'utf-8');
    const scriptSource = readFileSync(SCRIPT_JS, 'utf-8');

    // 2. body を inject してから script を eval
    injectBodyFromIndexHtml(html);
    evaluateScript(scriptSource);

    const win = window as WindowWithRuntime;
    const rt = win.__draftole__;
    expect(rt, '__draftole__ runtime が window に公開されていること').toBeDefined();
    if (rt === undefined) return;

    // 3. 事前条件: todos に done: true と done: false が混在する状態をセット
    //    （checkbox 経由ではなく state.set で直接遷移させる — clearDoneButton の handler
    //    は state を読むだけのため、UI 操作経路に依存せず検証可能）
    const todosState = rt.state<Todo[]>('s0');
    todosState.set([
      { text: 'done-1', done: true },
      { text: 'active-1', done: false },
      { text: 'done-2', done: true },
      { text: 'active-2', done: false },
    ]);
    await flushMicrotasks();
    expect(todosState.get()).toHaveLength(4);

    // 4. clearDoneButton を取得して click event を dispatch
    //    fixture 内の「完了をクリア」ボタンは textContent === '完了をクリア' で一意。
    const buttons = Array.from(document.querySelectorAll('button'));
    const clearDoneButton = buttons.find((b) => b.textContent?.trim() === '完了をクリア');
    expect(clearDoneButton, '「完了をクリア」ボタンが DOM に存在すること').toBeDefined();
    if (clearDoneButton === undefined) return;

    clearDoneButton.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await flushMicrotasks();

    // 5. todos state から done: true な entry のみが除去され、
    //    未完了 entry は順序保持で残る
    const remaining = todosState.get();
    expect(remaining).toHaveLength(2);
    expect(remaining).toEqual([
      { text: 'active-1', done: false },
      { text: 'active-2', done: false },
    ]);
    // done: true な entry は一切残らない
    expect(remaining.every((t) => t.done === false)).toBe(true);
  });
});
