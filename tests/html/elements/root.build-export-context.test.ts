/**
 * Task 4.2: Root.buildExportContext() テスト
 *
 * 検証:
 * - ExportContext の各フィールドが Root の各メソッド出力と一致すること
 * - 状態なし Root では runtimePrelude / runtimeInitJs が undefined であること
 * - 状態あり Root では runtimePrelude / runtimeInitJs が正しく設定されること
 *
 * Requirements: 3.1, 3.2, 5.2
 * Boundary: src/html/elements/root.ts
 */
import { describe, it, expect } from 'vitest';
import { Root } from '../../../src/html/elements/root.js';
import { RUNTIME_PRELUDE } from '../../../src/js/vanilla/internal/runtime-prelude.gen.js';
import { renderCommand } from '../../../src/js/vanilla/commands.js';
import { rule } from '../../../src/css/variables/global-dsl.js';

/**
 * Root に raw JS コマンドを直接追加するヘルパー。
 */
function addRawScript(root: Root, code: string): void {
  root.script._append({ type: 'raw', code });
}

describe('Root.buildExportContext()', () => {
  describe('基本フィールド（状態なし）', () => {
    it('html フィールドが render() と一致する', () => {
      const root = new Root();
      root.setDoctype(true);

      const ctx = root.buildExportContext();

      expect(ctx.html).toBe(root.render());
    });

    it('css フィールドが collectCssStyleString() と一致する', () => {
      const root = new Root({ css: [rule('body', { margin: '0' })] });

      const ctx = root.buildExportContext();

      expect(ctx.css).toBe(root.collectCssStyleString());
    });

    it('userJs フィールドが renderVanillaScript() と一致する', () => {
      const root = new Root();
      addRawScript(root, 'console.log("hello");');

      const ctx = root.buildExportContext();

      expect(ctx.userJs).toBe(root.renderVanillaScript());
    });

    it('状態なし Root では runtimePrelude が undefined', () => {
      const root = new Root();

      const ctx = root.buildExportContext();

      expect(ctx.runtimePrelude).toBeUndefined();
    });

    it('状態なし Root では runtimeInitJs が undefined', () => {
      const root = new Root();

      const ctx = root.buildExportContext();

      expect(ctx.runtimeInitJs).toBeUndefined();
    });

    it('state() を一度も呼ばない Root は全フィールドが正しい', () => {
      const root = new Root({ css: [rule('*', { boxSizing: 'border-box' })] });
      root.setDoctype(true);
      addRawScript(root, 'var x = 1;');

      const ctx = root.buildExportContext();

      expect(ctx.html).toBe(root.render());
      expect(ctx.css).toBe(root.collectCssStyleString());
      expect(ctx.userJs).toBe(root.renderVanillaScript());
      expect(ctx.runtimePrelude).toBeUndefined();
      expect(ctx.runtimeInitJs).toBeUndefined();
    });
  });

  describe('状態あり Root', () => {
    it('runtimePrelude が RUNTIME_PRELUDE と一致する', () => {
      const root = new Root();
      root.state(0);

      const ctx = root.buildExportContext();

      expect(ctx.runtimePrelude).toBe(RUNTIME_PRELUDE);
    });

    it('runtimeInitJs に state-init コマンドが含まれる', () => {
      const root = new Root();
      root.state(42); // s0 = 42

      const ctx = root.buildExportContext();

      const expectedInitLine = renderCommand({
        type: 'state-init',
        id: 's0',
        initial: { __jsExpr: true as const, code: '42' },
      });
      expect(ctx.runtimeInitJs).toContain(expectedInitLine);
    });

    it('複数状態の state-init コマンドが全て runtimeInitJs に含まれる', () => {
      const root = new Root();
      root.state(0);       // s0
      root.state('hello'); // s1

      const ctx = root.buildExportContext();

      expect(ctx.runtimeInitJs).toContain('__draftole__.initState("s0", 0)');
      expect(ctx.runtimeInitJs).toContain('__draftole__.initState("s1", "hello")');
    });

    it('userJs は state-init とは独立して保持される', () => {
      const root = new Root();
      root.state(5);
      addRawScript(root, 'console.log("user code");');

      const ctx = root.buildExportContext();

      // userJs には state-init は含まれない
      expect(ctx.userJs).not.toContain('__draftole__');
      expect(ctx.userJs).toContain('console.log("user code")');
      // runtimeInitJs には state-init が含まれる
      expect(ctx.runtimeInitJs).toContain('__draftole__.initState');
    });

    it('runtimePrelude と runtimeInitJs が両方設定される（状態あり）', () => {
      const root = new Root();
      root.state(99);

      const ctx = root.buildExportContext();

      expect(ctx.runtimePrelude).toBeDefined();
      expect(ctx.runtimeInitJs).toBeDefined();
    });

    it('ExportContext から手動でフル JS を組み立てると prelude-injection テストと同じ順序になる', () => {
      const root = new Root();
      root.state(7);
      addRawScript(root, 'var userCode = true;');

      const ctx = root.buildExportContext();

      // publisher が組み立てる想定の JS
      const fullJs = ctx.runtimePrelude !== undefined
        ? (ctx.userJs.length > 0
            ? `${ctx.runtimePrelude}\n${ctx.runtimeInitJs}\n${ctx.userJs}`
            : `${ctx.runtimePrelude}\n${ctx.runtimeInitJs}`)
        : ctx.userJs;

      const preludePos = fullJs.indexOf(RUNTIME_PRELUDE);
      const initPos = fullJs.indexOf('__draftole__.initState');
      const userPos = fullJs.indexOf('var userCode = true;');

      expect(preludePos).toBe(0);
      expect(preludePos).toBeLessThan(initPos);
      expect(initPos).toBeLessThan(userPos);
    });
  });

  describe('Req 3.1: FileExporter が _stateRegistry に直接アクセスしない（構造確認）', () => {
    it('buildExportContext() は _stateRegistry の情報を ExportContext に吸収する', () => {
      const root = new Root();
      root.state(123);

      const ctx = root.buildExportContext();

      // ExportContext に必要な情報が揃っている → FileExporter は _stateRegistry 不要
      expect(ctx.runtimePrelude).toBe(RUNTIME_PRELUDE);
      expect(ctx.runtimeInitJs).toContain('123');
    });
  });
});
