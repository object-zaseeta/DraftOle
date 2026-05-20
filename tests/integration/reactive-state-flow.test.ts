/**
 * Task 8.1: 統合テスト（Root → Element → FileExporter 全経路）
 *
 * シナリオ:
 *   1. root.state() 宣言
 *   2. .text(state.map(...)) でバインディング
 *   3. root.addChild() でツリー構築
 *   4. FileExporter.exportFromRoot() でファイル出力
 *   5. 出力 script.js に prelude + state-init + bind-text が含まれる
 *
 * Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 5.1, 5.4, 5.5
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { Root } from '../../src/html/elements/root.js';
import { FileExporter } from '../../src/publisher/file-exporter.js';
import { html, body, span, div } from '../../src/html/tags/factories.js';

// ─── テスト用一時ディレクトリ ─────────────────────────────────────────────────

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'draftole-reactive-state-'));
});

afterEach(() => {
  if (existsSync(tmpDir)) {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

// ─── シナリオ全経路テスト ─────────────────────────────────────────────────────

describe('統合テスト: Root → Element → FileExporter 全経路（Task 8.1）', () => {
  /**
   * メインシナリオ:
   *   root.state(0) → count.map(n => `${n} items`) → span.text(computed)
   *   → html(body(span)) → root.addChild(page) → exportFromRoot
   *   → script.js に prelude + state-init + bindText が含まれる
   *
   * Req 1.1: root.state<T>(initial) が State<T> を返す
   * Req 4.1: .text(state) が bind-text コマンドを生成する
   * Req 5.1: FileExporter が script.js 先頭にプレリュードを出力する
   * Req 5.5: 状態レジストリ非空のみでプレリュードを注入する
   */
  it('Req 5.1 / 5.5: state 宣言 → .text(map) → addChild → exportFromRoot で script.js にプレリュードが含まれる', () => {
    // Arrange: root と状態の宣言
    const root = new Root();
    const count = root.state(0);

    // state.map() で Computed<string> を生成し、span に bind-text としてバインド
    const display = span({ id: 'count-display' });
    display.text(count.map((n) => `${n} items`));

    // HTML ツリーを構築して addChild でフラッシュ
    const page = html({}, body({}, display));
    root.addChild(page);

    // Act: FileExporter でファイル出力
    const exporter = new FileExporter();
    exporter.exportFromRoot(root, tmpDir);

    // Assert: script.js が存在する
    const scriptPath = join(tmpDir, 'script.js');
    expect(existsSync(scriptPath)).toBe(true);

    const scriptJs = readFileSync(scriptPath, 'utf-8');

    // Req 5.1, 5.3: プレリュードのグローバル名前空間オブジェクトが含まれる
    expect(scriptJs).toContain('__draftole__');

    // Req 1.2: 状態初期化コード（initState）が含まれる
    expect(scriptJs).toContain('initState');
    expect(scriptJs).toContain('"s0"');
    expect(scriptJs).toContain('0'); // 初期値

    // Req 4.1: bind-text バインディングが含まれる
    expect(scriptJs).toContain('bindText');
  });

  /**
   * Req 5.1: プレリュードが script.js の先頭に出力される
   */
  it('Req 5.1: プレリュードが script.js の先頭に位置する', () => {
    const root = new Root();
    root.state('hello');

    const label = span({ id: 'label' });
    root.addChild(html({}, body({}, label)));

    const exporter = new FileExporter();
    exporter.exportFromRoot(root, tmpDir);

    const scriptJs = readFileSync(join(tmpDir, 'script.js'), 'utf-8');

    // プレリュードが先頭にあること:
    //   - プレリュード内の "initState" 関数定義 (index が小さい) が先に現れる
    //   - ユーザーレベルの "__draftole__.initState(...)" 呼び出しは後に来る
    const firstInitStateIdx = scriptJs.indexOf('initState');
    const userCallIdx = scriptJs.indexOf('__draftole__.initState');

    expect(firstInitStateIdx).toBeGreaterThanOrEqual(0);
    expect(userCallIdx).toBeGreaterThanOrEqual(0);

    // プレリュード内の initState 定義がユーザーレベル呼び出しより前に来る
    expect(firstInitStateIdx).toBeLessThan(userCallIdx);
  });

  /**
   * Req 1.2: initState("s0", 初期値) の形式で状態初期化コードが出力される
   */
  it('Req 1.2: initState("s0", 0) 形式の状態初期化コードが script.js に含まれる', () => {
    const root = new Root();
    root.state(0);

    root.addChild(html({}, body({})));

    const exporter = new FileExporter();
    exporter.exportFromRoot(root, tmpDir);

    const scriptJs = readFileSync(join(tmpDir, 'script.js'), 'utf-8');

    // initState("s0", 0) の形式
    expect(scriptJs).toContain('initState("s0", 0)');
  });

  /**
   * Req 1.3: 複数状態宣言で ID が一意
   */
  it('Req 1.3: 複数状態宣言時にそれぞれ異なる ID で initState が出力される', () => {
    const root = new Root();
    root.state(0);
    root.state('hello');

    root.addChild(html({}, body({})));

    const exporter = new FileExporter();
    exporter.exportFromRoot(root, tmpDir);

    const scriptJs = readFileSync(join(tmpDir, 'script.js'), 'utf-8');

    expect(scriptJs).toContain('initState("s0", 0)');
    expect(scriptJs).toContain('initState("s1", "hello")');
  });

  /**
   * Req 4.1: .text(state) を使ったバインディングが bindText として出力される
   */
  it('Req 4.1: .text(state) で bindText コマンドが script.js に出力される', () => {
    const root = new Root();
    const label = root.state('initial text');

    const el = span({ id: 'my-label' });
    el.text(label);

    root.addChild(html({}, body({}, el)));

    const exporter = new FileExporter();
    exporter.exportFromRoot(root, tmpDir);

    const scriptJs = readFileSync(join(tmpDir, 'script.js'), 'utf-8');

    expect(scriptJs).toContain('bindText');
    expect(scriptJs).toContain('"s0"');
  });

  /**
   * Req 4.1 + Req 1.x: .text(state.map(...)) — Computed を経由したバインディング
   */
  it('Req 4.1: .text(state.map(fn)) で変換付き bindText が script.js に出力される', () => {
    const root = new Root();
    const count = root.state(0);

    const counter = div({ id: 'counter' });
    counter.text(count.map((n) => `Count: ${n}`));

    root.addChild(html({}, body({}, counter)));

    const exporter = new FileExporter();
    exporter.exportFromRoot(root, tmpDir);

    const scriptJs = readFileSync(join(tmpDir, 'script.js'), 'utf-8');

    // プレリュード + state-init + bind-text の三要素
    expect(scriptJs).toContain('__draftole__');
    expect(scriptJs).toContain('initState("s0", 0)');
    expect(scriptJs).toContain('bindText');
  });

  /**
   * Req 5.4: 状態が宣言されていない Root ではプレリュードを出力しない
   */
  it('Req 5.4: 状態なしの Root では script.js にプレリュードが含まれない', () => {
    const root = new Root();

    // 状態を宣言せずに要素のみ追加
    root.addChild(html({}, body({}, span({}, 'static text'))));

    // JS コマンドをいくつか追加して script.js が生成されるようにする
    root.script._append({ type: 'raw', code: 'console.log("no state");' });

    const exporter = new FileExporter();
    exporter.exportFromRoot(root, tmpDir);

    const scriptPath = join(tmpDir, 'script.js');
    expect(existsSync(scriptPath)).toBe(true);

    const scriptJs = readFileSync(scriptPath, 'utf-8');
    expect(scriptJs).not.toContain('__draftole__');
    expect(scriptJs).not.toContain('initState');
  });

  /**
   * Req 5.5: プレリュード注入のトリガは状態レジストリが非空であること
   *          — 明示的なフラグは不要
   */
  it('Req 5.5: root.state() 呼び出しだけでプレリュード注入がトリガされる（フラグ不要）', () => {
    const root = new Root();
    // state を宣言するだけでプレリュードが注入される
    root.state(42);

    root.addChild(html({}, body({})));

    const exporter = new FileExporter();
    exporter.exportFromRoot(root, tmpDir);

    const scriptJs = readFileSync(join(tmpDir, 'script.js'), 'utf-8');

    // フラグを渡していないにもかかわらずプレリュードが含まれる
    expect(scriptJs).toContain('__draftole__');
    expect(scriptJs).toContain('initState("s0", 42)');
  });

  /**
   * エンドツーエンド: HTML/CSS/JS 3ファイル全出力確認
   */
  it('エンドツーエンド: index.html / script.js が生成され、script.js にはプレリュードが含まれる', () => {
    const root = new Root();
    root.setDoctype(true);

    const count = root.state(0);
    const display = span({ id: 'count-display' });
    display.text(count.map((n) => `${n} items`));

    const page = html({}, body({}, display));
    root.addChild(page);

    const exporter = new FileExporter();
    exporter.exportFromRoot(root, tmpDir);

    // index.html が存在する
    expect(existsSync(join(tmpDir, 'index.html'))).toBe(true);

    // script.js が存在する
    expect(existsSync(join(tmpDir, 'script.js'))).toBe(true);

    // index.html に script タグが含まれる
    const htmlContent = readFileSync(join(tmpDir, 'index.html'), 'utf-8');
    expect(htmlContent).toContain('script.js');
    expect(htmlContent).toContain('count-display');

    // script.js に三要素がすべて含まれる
    const scriptJs = readFileSync(join(tmpDir, 'script.js'), 'utf-8');
    expect(scriptJs).toContain('__draftole__');      // prelude
    expect(scriptJs).toContain('initState("s0", 0)'); // state-init
    expect(scriptJs).toContain('bindText');            // bind-text
  });
});
