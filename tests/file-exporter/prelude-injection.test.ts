/**
 * Task 5.1: FileExporter プレリュード注入テスト
 *
 * Req 5.1: FileExporter は出力 script.js の先頭に購読ランタイムプレリュードを出力する
 * Req 5.4: Root に状態が 1 つも宣言されていない場合、プレリュードを出力しない
 * Req 5.5: プレリュード含有判定は Root の状態レジストリが非空であることを唯一のトリガとする
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { Root } from '../../src/html/elements/root.js';
import { FileExporter } from '../../src/publisher/file-exporter.js';
import { RUNTIME_PRELUDE } from '../../src/js/vanilla/internal/runtime-prelude.gen.js';
import { renderCommand } from '../../src/js/vanilla/commands.js';

const testOutputDir = join(process.cwd(), 'tmp-test-prelude-injection');

beforeEach(() => {
  if (existsSync(testOutputDir)) {
    rmSync(testOutputDir, { recursive: true, force: true });
  }
});

afterEach(() => {
  if (existsSync(testOutputDir)) {
    rmSync(testOutputDir, { recursive: true, force: true });
  }
});

/**
 * Root に実際に JS コマンドを追加するヘルパー。
 * VanillaScope.raw() は式式を返すだけで append しないため、
 * _append を使って raw コマンドを直接追加する。
 */
function addRawScript(root: Root, code: string): void {
  root.script._append({ type: 'raw', code });
}

describe('FileExporter プレリュード注入', () => {
  describe('Req 5.4: 状態ゼロの Root はプレリュードを出力しない', () => {
    it('状態なし Root からの exportFromRoot は script.js にプレリュードを含めない', () => {
      const root = new Root();
      root.setDoctype(true);
      addRawScript(root, 'console.log("hello");');
      const exporter = new FileExporter();

      exporter.exportFromRoot(root, testOutputDir);

      const jsOutput = readFileSync(join(testOutputDir, 'script.js'), 'utf-8');
      expect(jsOutput).not.toContain('__draftole__');
      expect(jsOutput).not.toContain(RUNTIME_PRELUDE.slice(0, 50));
    });

    it('状態なし Root の出力は従来の renderVanillaScript() 出力と完全一致する', () => {
      const root = new Root();
      addRawScript(root, 'console.log("hello");');

      // renderVanillaScript() を exportFromRoot より前に呼ぶと内部状態が変わるため、
      // 先に exportFromRoot して、その後 renderVanillaScript() の結果と比較する。
      // ただし render() は冪等なので順序は関係ない。
      const exporter = new FileExporter();
      exporter.exportFromRoot(root, testOutputDir);

      const jsOutput = readFileSync(join(testOutputDir, 'script.js'), 'utf-8');
      const expected = root.renderVanillaScript();
      expect(jsOutput).toBe(expected);
    });

    it('状態なし Root で _stateRegistry が undefined の場合もプレリュードなし', () => {
      const root = new Root();
      // root.state() を一度も呼ばない → _stateRegistry は undefined
      expect(root._stateRegistry).toBeUndefined();

      addRawScript(root, 'var x = 1;');
      const exporter = new FileExporter();
      exporter.exportFromRoot(root, testOutputDir);

      const jsOutput = readFileSync(join(testOutputDir, 'script.js'), 'utf-8');
      expect(jsOutput).not.toContain('__draftole__');
    });
  });

  describe('Req 5.1, 5.5: 状態あり Root はプレリュードを script.js 先頭に挿入する', () => {
    it('root.state() を呼んだ場合、script.js の先頭に RUNTIME_PRELUDE が挿入される', () => {
      const root = new Root();
      root.state(0); // 状態を 1 つ宣言

      const exporter = new FileExporter();
      exporter.exportFromRoot(root, testOutputDir);

      const jsOutput = readFileSync(join(testOutputDir, 'script.js'), 'utf-8');
      expect(jsOutput.startsWith(RUNTIME_PRELUDE)).toBe(true);
    });

    it('プレリュード直後に state-init コマンド列が出力される', () => {
      const root = new Root();
      root.state(42); // s0 = 42

      const exporter = new FileExporter();
      exporter.exportFromRoot(root, testOutputDir);

      const jsOutput = readFileSync(join(testOutputDir, 'script.js'), 'utf-8');

      // state-init コマンドが含まれることを確認
      const initLine = renderCommand({
        type: 'state-init',
        id: 's0',
        initial: { __jsExpr: true as const, code: '42' },
      });
      expect(jsOutput).toContain(initLine);

      // state-init はプレリュードの直後に来ること（プレリュード終端の後）
      const preludeEnd = jsOutput.indexOf(RUNTIME_PRELUDE) + RUNTIME_PRELUDE.length;
      const initPos = jsOutput.indexOf(initLine);
      expect(initPos).toBeGreaterThan(preludeEnd);
    });

    it('複数状態の state-init コマンドが全て含まれる', () => {
      const root = new Root();
      root.state(0);       // s0
      root.state('hello'); // s1

      const exporter = new FileExporter();
      exporter.exportFromRoot(root, testOutputDir);

      const jsOutput = readFileSync(join(testOutputDir, 'script.js'), 'utf-8');

      expect(jsOutput).toContain('__draftole__.initState("s0", 0)');
      expect(jsOutput).toContain('__draftole__.initState("s1", "hello")');
    });

    it('state-init はユーザコマンド（renderVanillaScript）より前に出力される', () => {
      const root = new Root();
      root.state(5);
      addRawScript(root, 'console.log("user code");');

      const exporter = new FileExporter();
      exporter.exportFromRoot(root, testOutputDir);

      const jsOutput = readFileSync(join(testOutputDir, 'script.js'), 'utf-8');

      const initPos = jsOutput.indexOf('__draftole__.initState');
      const userCodePos = jsOutput.indexOf('console.log("user code")');
      expect(initPos).toBeGreaterThanOrEqual(0);
      expect(userCodePos).toBeGreaterThanOrEqual(0);
      expect(initPos).toBeLessThan(userCodePos);
    });
  });

  describe('script.js フォーマット: [prelude] + [state-init] + [user script]', () => {
    it('出力順序: RUNTIME_PRELUDE → state-init 列 → ユーザスクリプト', () => {
      const root = new Root();
      root.state(99);
      addRawScript(root, 'var userCode = true;');

      const exporter = new FileExporter();
      exporter.exportFromRoot(root, testOutputDir);

      const jsOutput = readFileSync(join(testOutputDir, 'script.js'), 'utf-8');

      const preludePos = jsOutput.indexOf(RUNTIME_PRELUDE);
      const initPos = jsOutput.indexOf('__draftole__.initState');
      const userPos = jsOutput.indexOf('var userCode = true;');

      expect(preludePos).toBe(0); // 先頭
      expect(preludePos).toBeLessThan(initPos);
      expect(initPos).toBeLessThan(userPos);
    });

    it('状態ありでユーザコードなしの場合: RUNTIME_PRELUDE + state-init のみ', () => {
      const root = new Root();
      root.state(0);

      const exporter = new FileExporter();
      exporter.exportFromRoot(root, testOutputDir);

      const jsOutput = readFileSync(join(testOutputDir, 'script.js'), 'utf-8');
      expect(jsOutput.startsWith(RUNTIME_PRELUDE)).toBe(true);
      expect(jsOutput).toContain('__draftole__.initState("s0", 0)');
    });
  });

  describe('Req 5.4: 空経路の byte-identical 保証', () => {
    it('状態なし Root の script.js は renderVanillaScript() と byte 一致（改行変化なし）', () => {
      const root = new Root();
      addRawScript(root, 'line1;');
      addRawScript(root, 'line2;');

      const expected = root.renderVanillaScript(); // 先に取得（冪等なので問題なし）

      const exporter = new FileExporter();
      exporter.exportFromRoot(root, testOutputDir);

      const jsOutput = readFileSync(join(testOutputDir, 'script.js'), 'utf-8');
      expect(jsOutput).toBe(expected);
    });

    it('状態なし Root の JS が空の場合、script.js ファイルは生成されない', () => {
      const root = new Root();
      // script に何も追加しない

      const exporter = new FileExporter();
      exporter.exportFromRoot(root, testOutputDir);

      // JS が空なのでファイルは生成されないはず
      expect(existsSync(join(testOutputDir, 'script.js'))).toBe(false);
    });
  });

  describe('HTML と CSS の出力は Root から正しく収集される', () => {
    it('exportFromRoot は HTML ファイルを生成する', () => {
      const root = new Root();
      root.setDoctype(true);

      const exporter = new FileExporter();
      exporter.exportFromRoot(root, testOutputDir);

      expect(existsSync(join(testOutputDir, 'index.html'))).toBe(true);
    });
  });
});
