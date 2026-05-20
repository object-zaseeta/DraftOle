/**
 * Task 5.5: diagnostic-reporter テスト
 *
 * 観測可能な完了基準:
 *   各カテゴリのメッセージに「源位置」「識別子名」「修正例」文字列が含まれる
 *
 * テスト対象カテゴリ (DT001〜DT010):
 *   DT001 - ホワイトリスト外クロージャ捕捉
 *   DT002 - 空本体警告
 *   DT003 - 非アロー関数
 *   DT004 - async/await 禁止
 *   DT005 - yield/generator 禁止
 *   DT006 - ++ / -- 禁止
 *   DT007 - デコレータ禁止
 *   DT008 - 禁止グローバル (window/globalThis)
 *   DT009 - transformer 内部エラー
 *   DT010 - 空本体（情報用、別途バリアント）
 *
 * 対応 requirements: 2.5, 2.7, 3.3
 * 対応 design: diagnostic-reporter, Error Message Template
 */

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import {
  DIAGNOSTIC_TABLE,
  createDiagnostic,
  type DiagnosticCode,
  type DiagnosticData,
} from '../../src/transformer/diagnostic-reporter.ts';

// ---- Feature Flag -------------------------------------------------------

/**
 * Task 5.5 のフィーチャーフラグ。
 * false の間は全テストをスキップする（Feature Flag Protocol の RED フェーズ）。
 */
const FEATURE_DIAGNOSTIC_REPORTER = true;

// ---- テスト用ユーティリティ -------------------------------------------------

/**
 * テスト用のダミー ts.SourceFile と ts.Node を作成するヘルパー。
 */
function createTestSourceFile(content: string, fileName = 'test.ts'): ts.SourceFile {
  return ts.createSourceFile(fileName, content, ts.ScriptTarget.ES2019, true);
}

/**
 * ソースファイル内の最初の Identifier ノードを返す。
 */
function findFirstIdentifier(sourceFile: ts.SourceFile): ts.Identifier {
  let found: ts.Identifier | undefined;
  function visit(node: ts.Node): void {
    if (found !== undefined) return;
    if (ts.isIdentifier(node)) {
      found = node;
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  if (found === undefined) {
    throw new Error('No identifier found in source file');
  }
  return found;
}

// ---- DIAGNOSTIC_TABLE テスト -----------------------------------------------

describe.skipIf(!FEATURE_DIAGNOSTIC_REPORTER)('DIAGNOSTIC_TABLE', () => {
  it('DT001〜DT011 の全エラーコードが定義されている', () => {
    expect(DIAGNOSTIC_TABLE).toBeDefined();
    for (let i = 1; i <= 11; i++) {
      const code = `DT${String(i).padStart(3, '0')}` as DiagnosticCode;
      expect(DIAGNOSTIC_TABLE[code]).toBeDefined();
    }
  });

  it('各エントリに code / messageTemplate / suggestion が含まれる', () => {
    for (const [key, entry] of Object.entries(DIAGNOSTIC_TABLE)) {
      expect(entry.code, `${key}: code が定義されている`).toBeTypeOf('number');
      expect(entry.messageTemplate, `${key}: messageTemplate が定義されている`).toBeTypeOf('string');
      expect(entry.suggestion, `${key}: suggestion が定義されている`).toBeTypeOf('string');
      expect(entry.messageTemplate.length, `${key}: messageTemplate が空でない`).toBeGreaterThan(0);
      expect(entry.suggestion.length, `${key}: suggestion が空でない`).toBeGreaterThan(0);
    }
  });
});

// ---- createDiagnostic テスト ------------------------------------------------

describe.skipIf(!FEATURE_DIAGNOSTIC_REPORTER)('createDiagnostic', () => {
  it('DT001: ホワイトリスト外識別子エラーに源位置・識別子名・修正例が含まれる', () => {
    const src = 'outsideVar.doSomething()';
    const sourceFile = createTestSourceFile(src, 'examples/interactive/mvp-demo.ts');
    const node = findFirstIdentifier(sourceFile);

    const data: DiagnosticData = {
      identifierName: 'outsideVar',
      fixExample: "state を 'root.state(...)' で宣言してください",
    };
    const diag = createDiagnostic('DT001', node, sourceFile, data);

    // 源位置（start）が設定されていること
    expect(diag.start).toBeDefined();
    expect(diag.start).toBeGreaterThanOrEqual(0);

    // length が設定されていること
    expect(diag.length).toBeDefined();
    expect(diag.length).toBeGreaterThan(0);

    // file が sourceFile であること
    expect(diag.file).toBe(sourceFile);

    // messageText に識別子名が含まれること
    const msg = typeof diag.messageText === 'string' ? diag.messageText : '';
    expect(msg).toContain('outsideVar');

    // messageText に修正例が含まれること
    expect(msg).toContain("root.state(...)");

    // カテゴリがエラーであること
    expect(diag.category).toBe(ts.DiagnosticCategory.Error);

    // コードが DT001 に対応する番号であること
    expect(diag.code).toBe(DIAGNOSTIC_TABLE.DT001.code);
  });

  it('DT001: messageText に源位置情報（行列番号または start 値）が含まれる', () => {
    // 複数行ソースで位置が埋め込まれるケース
    const src = `const x = 1;\nconst y = outsideVar;\n`;
    const sourceFile = createTestSourceFile(src, 'examples/handler.ts');

    // "outsideVar" の Identifier を探す
    let outsideVarNode: ts.Identifier | undefined;
    function findOutsideVar(node: ts.Node): void {
      if (ts.isIdentifier(node) && node.text === 'outsideVar') {
        outsideVarNode = node;
        return;
      }
      ts.forEachChild(node, findOutsideVar);
    }
    findOutsideVar(sourceFile);
    expect(outsideVarNode).toBeDefined();
    if (outsideVarNode === undefined) throw new Error('outsideVarNode not found');

    const data: DiagnosticData = {
      identifierName: 'outsideVar',
      fixExample: "If 'outsideVar' is a state, declare it via root.state(...)",
    };
    const diag = createDiagnostic('DT001', outsideVarNode, sourceFile, data);

    const msg = typeof diag.messageText === 'string' ? diag.messageText : '';

    // 識別子名が含まれること
    expect(msg).toContain('outsideVar');

    // 修正例文字列が含まれること
    expect(msg).toContain('root.state(...)');

    // 源位置として start が正しく設定されていること（0 でない）
    expect(diag.start).toBeGreaterThan(0);
  });

  it('DT002: 空本体警告に識別子名と修正例が含まれる', () => {
    // arrowFn という識別子が含まれるソースを使う（空本体アロー関数の警告シナリオを模擬）
    const src = 'const arrowFn = () => {}';
    const sourceFile = createTestSourceFile(src, 'test.ts');
    const node = findFirstIdentifier(sourceFile);

    const data: DiagnosticData = {
      identifierName: 'arrowFn',
      fixExample: 'ハンドラ本体に処理を追加してください',
    };
    const diag = createDiagnostic('DT002', node, sourceFile, data);

    expect(diag.category).toBe(ts.DiagnosticCategory.Warning);
    const msg = typeof diag.messageText === 'string' ? diag.messageText : '';
    expect(msg).toContain('arrowFn');
    expect(msg).toContain('ハンドラ本体に処理を追加');
  });

  it('DT003: 非アロー関数エラーに識別子名と修正例が含まれる', () => {
    const src = 'function handler() {}';
    const sourceFile = createTestSourceFile(src, 'test.ts');
    const node = findFirstIdentifier(sourceFile);

    const data: DiagnosticData = {
      identifierName: 'handler',
      fixExample: 'アロー関数 (e) => { ... } を使用してください',
    };
    const diag = createDiagnostic('DT003', node, sourceFile, data);

    expect(diag.category).toBe(ts.DiagnosticCategory.Error);
    const msg = typeof diag.messageText === 'string' ? diag.messageText : '';
    expect(msg).toContain('handler');
    expect(msg).toContain('アロー関数');
  });

  it('DT004: async/await 禁止エラーに識別子名と修正例が含まれる', () => {
    const src = 'async () => { await fetch("url"); }';
    const sourceFile = createTestSourceFile(src, 'test.ts');
    const node = findFirstIdentifier(sourceFile);

    const data: DiagnosticData = {
      identifierName: 'fetch',
      fixExample: 'async/await はシリアライズできません。同期コードに書き換えてください',
    };
    const diag = createDiagnostic('DT004', node, sourceFile, data);

    expect(diag.category).toBe(ts.DiagnosticCategory.Error);
    const msg = typeof diag.messageText === 'string' ? diag.messageText : '';
    expect(msg).toContain('fetch');
    expect(msg).toContain('async');
  });

  it('DT005: yield/generator 禁止エラーに識別子名と修正例が含まれる', () => {
    const src = 'function* gen() { yield 1; }';
    const sourceFile = createTestSourceFile(src, 'test.ts');
    const node = findFirstIdentifier(sourceFile);

    const data: DiagnosticData = {
      identifierName: 'gen',
      fixExample: 'generator/yield はシリアライズできません',
    };
    const diag = createDiagnostic('DT005', node, sourceFile, data);

    expect(diag.category).toBe(ts.DiagnosticCategory.Error);
    const msg = typeof diag.messageText === 'string' ? diag.messageText : '';
    expect(msg).toContain('gen');
    expect(msg).toContain('yield');
  });

  it('DT006: ++ / -- 禁止エラーに識別子名と修正例が含まれる', () => {
    const src = 'count++';
    const sourceFile = createTestSourceFile(src, 'test.ts');
    const node = findFirstIdentifier(sourceFile);

    const data: DiagnosticData = {
      identifierName: 'count',
      fixExample: 'state.set(state.get() + 1) を使用してください',
    };
    const diag = createDiagnostic('DT006', node, sourceFile, data);

    expect(diag.category).toBe(ts.DiagnosticCategory.Error);
    const msg = typeof diag.messageText === 'string' ? diag.messageText : '';
    expect(msg).toContain('count');
    expect(msg).toContain('state.set(state.get() + 1)');
  });

  it('DT007: デコレータ禁止エラーに識別子名と修正例が含まれる', () => {
    const src = 'decoratorName';
    const sourceFile = createTestSourceFile(src, 'test.ts');
    const node = findFirstIdentifier(sourceFile);

    const data: DiagnosticData = {
      identifierName: 'decoratorName',
      fixExample: 'デコレータはシリアライズできません',
    };
    const diag = createDiagnostic('DT007', node, sourceFile, data);

    expect(diag.category).toBe(ts.DiagnosticCategory.Error);
    const msg = typeof diag.messageText === 'string' ? diag.messageText : '';
    expect(msg).toContain('decoratorName');
    expect(msg).toContain('デコレータ');
  });

  it('DT008: 禁止グローバル (window/globalThis) エラーに識別子名と修正例が含まれる', () => {
    const src = 'window.location.href';
    const sourceFile = createTestSourceFile(src, 'test.ts');
    const node = findFirstIdentifier(sourceFile);

    const data: DiagnosticData = {
      identifierName: 'window',
      fixExample: 'window/globalThis はハンドラ内では使用できません。state API を使用してください',
    };
    const diag = createDiagnostic('DT008', node, sourceFile, data);

    expect(diag.category).toBe(ts.DiagnosticCategory.Error);
    const msg = typeof diag.messageText === 'string' ? diag.messageText : '';
    expect(msg).toContain('window');
    expect(msg).toContain('state API');
  });

  it('DT009: transformer 内部エラーに識別子名と修正例が含まれる', () => {
    const src = 'identifier';
    const sourceFile = createTestSourceFile(src, 'test.ts');
    const node = findFirstIdentifier(sourceFile);

    const data: DiagnosticData = {
      identifierName: 'identifier',
      fixExample: 'draftole-transformer のバージョンを確認してください',
    };
    const diag = createDiagnostic('DT009', node, sourceFile, data);

    expect(diag.category).toBe(ts.DiagnosticCategory.Error);
    const msg = typeof diag.messageText === 'string' ? diag.messageText : '';
    expect(msg).toContain('identifier');
    expect(msg).toContain('バージョン');
  });

  it('TC-J: DT011 メッセージに源位置・識別子名・修正例が含まれる（テーブル駆動拡張）', () => {
    const src = 'const x = 1;\nconst y = unresolvedState;\n';
    const sourceFile = createTestSourceFile(src, 'examples/handler.ts');

    let identNode: ts.Identifier | undefined;
    function find(node: ts.Node): void {
      if (ts.isIdentifier(node) && node.text === 'unresolvedState') {
        identNode = node;
        return;
      }
      ts.forEachChild(node, find);
    }
    find(sourceFile);
    expect(identNode).toBeDefined();
    if (identNode === undefined) throw new Error('identNode not found');

    const fixExample = 'root.state<"unresolvedState-id">(initial)';
    const data: DiagnosticData = {
      identifierName: 'unresolvedState',
      fixExample,
    };
    const diag = createDiagnostic('DT011', identNode, sourceFile, data);

    // 源位置: start/length/file が正しく設定されている
    const expectedStart = src.indexOf('unresolvedState');
    expect(diag.start).toBe(expectedStart);
    expect(diag.length).toBe('unresolvedState'.length);
    expect(diag.file).toBe(sourceFile);

    // 識別子名と修正例が messageText に含まれる
    const msg = typeof diag.messageText === 'string' ? diag.messageText : '';
    expect(msg).toContain('unresolvedState');
    expect(msg).toContain(fixExample);

    // カテゴリ・コード・source が DT011 に対応
    expect(diag.category).toBe(ts.DiagnosticCategory.Error);
    expect(diag.code).toBe(DIAGNOSTIC_TABLE.DT011.code);
    expect(diag.source).toBe('draftole-transformer');
  });

  it('DT011: 解決不能 State 識別子エラーに識別子名・修正例・コード・カテゴリが正しく設定される', () => {
    const src = 'foo';
    const sourceFile = createTestSourceFile(src, 'test.ts');
    const node = findFirstIdentifier(sourceFile);

    const data: DiagnosticData = {
      identifierName: 'foo',
      fixExample: 'root.state<"foo-id">(initial)',
    };
    const diag = createDiagnostic('DT011', node, sourceFile, data);

    const msg = typeof diag.messageText === 'string' ? diag.messageText : '';
    expect(msg).toContain('DT011');
    expect(msg).toContain("'foo'");
    expect(msg).toContain('root.state<"foo-id">(initial)');
    expect(diag.category).toBe(ts.DiagnosticCategory.Error);
    expect(diag.code).toBe(9011);
  });

  it('DT010: 追加情報メッセージに識別子名と修正例が含まれる', () => {
    const src = 'someVar';
    const sourceFile = createTestSourceFile(src, 'test.ts');
    const node = findFirstIdentifier(sourceFile);

    const data: DiagnosticData = {
      identifierName: 'someVar',
      fixExample: 'docs/api/handler-serialization.md を参照してください',
    };
    const diag = createDiagnostic('DT010', node, sourceFile, data);

    const msg = typeof diag.messageText === 'string' ? diag.messageText : '';
    expect(msg).toContain('someVar');
    expect(msg).toContain('docs/api/handler-serialization.md');
  });
});

// ---- エラーメッセージ形式テスト -----------------------------------------------

describe.skipIf(!FEATURE_DIAGNOSTIC_REPORTER)('createDiagnostic エラーメッセージ形式', () => {
  it('DT001: Design 仕様のエラーメッセージテンプレートに準拠した形式', () => {
    // Design §Error Message Template のフォーマットを再現:
    //   error DT001: Closure capture outside whitelist ...
    //   identifier 'outsideVar' is captured from module scope
    //   note: allowed: state API ...
    //   help: if 'outsideVar' is a state, declare it via root.state(...)
    const src = `element.on('click', () => outsideVar.doSomething())`;
    const sourceFile = createTestSourceFile(src, 'examples/interactive/mvp-demo.ts');

    let outsideVarNode: ts.Identifier | undefined;
    function find(node: ts.Node): void {
      if (ts.isIdentifier(node) && node.text === 'outsideVar') {
        outsideVarNode = node;
        return;
      }
      ts.forEachChild(node, find);
    }
    find(sourceFile);
    expect(outsideVarNode).toBeDefined();
    if (outsideVarNode === undefined) throw new Error('outsideVarNode not found');

    const data: DiagnosticData = {
      identifierName: 'outsideVar',
      fixExample: "if 'outsideVar' is a state, declare it via root.state(...) and call through that handle.",
    };
    const diag = createDiagnostic('DT001', outsideVarNode, sourceFile, data);

    const msg = typeof diag.messageText === 'string' ? diag.messageText : '';

    // 識別子名が含まれること (Req 2.5, 3.3)
    expect(msg).toContain('outsideVar');

    // 修正例が含まれること (Req 3.3)
    expect(msg).toContain("root.state(...)");

    // DT001 コードが含まれること
    expect(msg).toContain('DT001');

    // source フィールドが 'draftole-transformer' であること
    expect(diag.source).toBe('draftole-transformer');

    // 源位置が設定されていること (Req 2.5)
    expect(diag.start).toBeGreaterThan(0);
    expect(diag.length).toBeGreaterThan(0);
    expect(diag.file).toBe(sourceFile);
  });

  it('源位置: start と length が ts.Node から正しく計算される', () => {
    // const outsideVar = 1; の outsideVar Identifier の位置を検証する
    const src2 = 'const outsideVar = 1;';
    const sourceFile2 = createTestSourceFile(src2, 'test2.ts');

    let identNode: ts.Identifier | undefined;
    function findIdent(node: ts.Node): void {
      if (ts.isIdentifier(node) && node.text === 'outsideVar') {
        identNode = node;
        return;
      }
      ts.forEachChild(node, findIdent);
    }
    findIdent(sourceFile2);
    expect(identNode).toBeDefined();
    if (identNode === undefined) throw new Error('identNode not found');

    const expectedStart = src2.indexOf('outsideVar');
    const data: DiagnosticData = {
      identifierName: 'outsideVar',
      fixExample: 'use root.state(...)',
    };
    const diag = createDiagnostic('DT001', identNode, sourceFile2, data);

    expect(diag.start).toBe(expectedStart);
    expect(diag.length).toBe('outsideVar'.length);
  });
});
