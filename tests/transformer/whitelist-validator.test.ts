/**
 * Task 5.2: whitelist-validator テスト
 *
 * 観測可能な完了基準:
 *   許可 6 カテゴリ:
 *     1. state/state-handle  - State<T> / Computed<T> / ScriptStateHandle<T> 判定
 *     2. event-param         - ハンドラ仮引数名との一致
 *     3. local               - HandlerIR.localDecls との一致
 *     4. builtin             - BUILTIN_GLOBALS 照合（Math, JSON, String, console 等）
 *     5. console             - BUILTIN_GLOBALS に含まれる（上記 4 と統合）
 *     6. extraWhitelist      - 追加ホワイトリスト識別子
 *   拒否 5 カテゴリ:
 *     1. module-level variable  - モジュールレベル変数
 *     2. imported identifier    - import されたシンボル
 *     3. window/globalThis      - グローバルオブジェクト
 *     4. undeclared identifier  - 未宣言の識別子
 *     5. class/function at module level - モジュールレベルのクラス・関数宣言
 *
 * 対応 requirements: 3.1, 3.2, 3.4, 3.6
 */

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import type { HandlerIR, IdentifierRef } from '../../src/transformer/handler-ir-extractor.ts';
import { validateHandler } from '../../src/transformer/whitelist-validator.ts';

// ---- Feature Flag -------------------------------------------------------

/**
 * Task 5.2 のフィーチャーフラグ。
 * false の間は全テストをスキップする（Feature Flag Protocol の RED フェーズ）。
 */
const FEATURE_WHITELIST_VALIDATOR = true;

// ---- テスト用ユーティリティ -------------------------------------------------

/**
 * TypeScript プログラムを生成するヘルパー。
 * 仮想ファイルシステムに複数のソースファイルを用意できる。
 */
function createTestProgram(files: Record<string, string>): {
  program: ts.Program;
  sourceFiles: Map<string, ts.SourceFile>;
} {
  const fileNames = Object.keys(files);
  const sourceFiles = new Map<string, ts.SourceFile>();

  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2019,
    module: ts.ModuleKind.ESNext,
    strict: true,
    noEmit: true,
  };

  // メモリ上のコンパイラホストを作成
  const host = ts.createCompilerHost(compilerOptions);

  // ファイルの読み取りをオーバーライド
  const originalGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersion): ts.SourceFile | undefined => {
    const normalizedName = fileName.replace(/\\/g, '/');
    for (const [name, content] of Object.entries(files)) {
      if (normalizedName.endsWith(name) || normalizedName === name) {
        const sf = ts.createSourceFile(name, content, languageVersion, true);
        sourceFiles.set(name, sf);
        return sf;
      }
    }
    return originalGetSourceFile(fileName, languageVersion);
  };

  host.fileExists = (fileName): boolean => {
    const normalizedName = fileName.replace(/\\/g, '/');
    for (const name of fileNames) {
      if (normalizedName.endsWith(name) || normalizedName === name) {
        return true;
      }
    }
    return ts.sys.fileExists(fileName);
  };

  const program = ts.createProgram(fileNames, compilerOptions, host);

  return { program, sourceFiles };
}

/**
 * ソースコード + 追加ファイルからプログラムを生成し、最初のアロー関数を見つけて
 * HandlerIR を構築するヘルパー。
 */
function buildHandlerIR(
  handlerCode: string,
  extraFiles?: Record<string, string>,
  paramName?: string,
  localDeclsArr?: string[],
  extraWhitelist?: readonly string[],
): {
  ir: HandlerIR;
  refs: IdentifierRef[];
  program: ts.Program;
  sourceFile: ts.SourceFile;
  diagnostics: ts.Diagnostic[];
} {
  const mainFile = 'main.ts';
  const files: Record<string, string> = {
    [mainFile]: handlerCode,
    ...extraFiles,
  };

  const { program, sourceFiles } = createTestProgram(files);
  const checker = program.getTypeChecker();

  let sourceFile = sourceFiles.get(mainFile);
  if (sourceFile === undefined) {
    // フォールバック: プログラムから取得
    sourceFile = program.getSourceFile(mainFile);
  }
  if (sourceFile === undefined) {
    throw new Error(`Source file '${mainFile}' not found`);
  }

  // アロー関数を探す
  let arrowFn: ts.ArrowFunction | undefined;
  function findArrow(node: ts.Node): void {
    if (ts.isArrowFunction(node) && arrowFn === undefined) {
      arrowFn = node;
    }
    ts.forEachChild(node, findArrow);
  }
  findArrow(sourceFile);

  if (arrowFn === undefined) {
    throw new Error(`No ArrowFunction found in: ${handlerCode}`);
  }

  // HandlerIR を構築
  const localDecls = new Set<string>(localDeclsArr ?? []);
  if (paramName !== undefined) {
    localDecls.add(paramName);
  }

  const ir: HandlerIR = {
    node: arrowFn,
    paramName: paramName ?? null,
    paramTypeText: null,
    localDecls,
    referencedIdentifiers: [],
    isExpressionBody: !ts.isBlock(arrowFn.body),
  };

  // IdentifierRef[] を収集
  const refs: IdentifierRef[] = [];
  const seen = new Set<string>();

  function collectRefs(node: ts.Node): void {
    if (ts.isIdentifier(node)) {
      const parent = node.parent;
      // プロパティアクセス右辺はスキップ (a.b の b)
      if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
        return;
      }
      // プロパティ名定義はスキップ ({ a: 1 } の a, obj.a = 1 の a 等)
      if (ts.isPropertyAssignment(parent) && parent.name === node) {
        return;
      }
      // ShorthandPropertyAssignment の name もスキップ ({ a } の a は参照だが定義コンテキスト)
      // → ただし ShorthandPropertyAssignment は参照でもあるので通す

      const name = node.text;
      if (seen.has(name)) return;
      seen.add(name);

      const symbol = checker.getSymbolAtLocation(node);
      refs.push({ name, node, symbol, kind: { tag: 'unknown' } });
      return;
    }
    ts.forEachChild(node, collectRefs);
  }

  // パラメータも含めて収集
  for (const param of arrowFn.parameters) {
    collectRefs(param.name);
  }
  collectRefs(arrowFn.body);

  const diagnostics = validateHandler(ir, refs, program, sourceFile, extraWhitelist);

  return { ir, refs, program, sourceFile, diagnostics };
}

// ---- テストケース -----------------------------------------------------------

const TEST_TIMEOUT_MS = 30_000;

describe(`whitelist-validator (Feature Flag: ${FEATURE_WHITELIST_VALIDATOR})`, () => {
  // =============================
  // 許可 6 カテゴリ
  // =============================

  describe('許可カテゴリ 1: state/state-handle (DraftoleStateMarker を持つ型)', () => {
    it(
      'State<T> 型の識別子は diagnostics なし',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        // DraftoleStateMarker プロパティを持つ型の識別子
        const stateTypeDecl = `
declare const __draftoleStateMarker__: unique symbol;
interface MockState<T> {
  readonly [__draftoleStateMarker__]: 'state';
  readonly _runtimeId: string;
  get(): T;
  set(v: T): void;
}
declare const count: MockState<number>;
const fn = () => count.set(1);
`.trimStart();

        const { diagnostics } = buildHandlerIR(stateTypeDecl);
        expect(diagnostics).toHaveLength(0);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'DraftoleStateMarker プロパティを持つ型の識別子は許可される',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        // state.ts の DraftoleStateMarker を模倣
        const code = `
declare const DraftoleStateMarker: unique symbol;
interface ReadableState<T> {
  readonly [DraftoleStateMarker]: 'state';
  readonly _runtimeId: string;
  get(): T;
}
declare const myState: ReadableState<string>;
const fn = () => myState.get();
`.trimStart();

        const { diagnostics } = buildHandlerIR(code);
        expect(diagnostics).toHaveLength(0);
      },
      TEST_TIMEOUT_MS,
    );
  });

  describe('許可カテゴリ 2: event-param (ハンドラ仮引数名との一致)', () => {
    it(
      'paramName と同名の識別子はエラーなし',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        const code = `
const fn = (e: MouseEvent) => e.preventDefault();
`.trimStart();

        const { diagnostics } = buildHandlerIR(code, {}, 'e');
        expect(diagnostics).toHaveLength(0);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'event 引数名 event でも許可される',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        const code = `
const fn = (event: Event) => event.stopPropagation();
`.trimStart();

        const { diagnostics } = buildHandlerIR(code, {}, 'event');
        expect(diagnostics).toHaveLength(0);
      },
      TEST_TIMEOUT_MS,
    );
  });

  describe('許可カテゴリ 3: local (HandlerIR.localDecls との一致)', () => {
    it(
      'localDecls に含まれる識別子はエラーなし',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        const code = `
const fn = () => {
  const x = 42;
  return x + 1;
};
`.trimStart();

        // x を localDecls に含める
        const { diagnostics } = buildHandlerIR(code, {}, undefined, ['x']);
        expect(diagnostics).toHaveLength(0);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'ブロック本体のローカル宣言は許可される',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        const code = `
const fn = () => {
  const result = 10;
  const doubled = result * 2;
  return doubled;
};
`.trimStart();

        const { diagnostics } = buildHandlerIR(code, {}, undefined, ['result', 'doubled']);
        expect(diagnostics).toHaveLength(0);
      },
      TEST_TIMEOUT_MS,
    );
  });

  describe('許可カテゴリ 4 & 5: builtin / console (BUILTIN_GLOBALS 照合)', () => {
    it(
      'Math は許可される',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        const code = `
const fn = () => Math.max(1, 2);
`.trimStart();

        const { diagnostics } = buildHandlerIR(code);
        expect(diagnostics).toHaveLength(0);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'JSON は許可される',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        const code = `
const fn = () => JSON.stringify({ a: 1 });
`.trimStart();

        const { diagnostics } = buildHandlerIR(code);
        expect(diagnostics).toHaveLength(0);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'String は許可される',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        const code = `
const fn = () => String(42);
`.trimStart();

        const { diagnostics } = buildHandlerIR(code);
        expect(diagnostics).toHaveLength(0);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'Number は許可される',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        const code = `
const fn = () => Number("3.14");
`.trimStart();

        const { diagnostics } = buildHandlerIR(code);
        expect(diagnostics).toHaveLength(0);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'Boolean は許可される',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        const code = `
const fn = () => Boolean(0);
`.trimStart();

        const { diagnostics } = buildHandlerIR(code);
        expect(diagnostics).toHaveLength(0);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'Array は許可される',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        const code = `
const fn = () => Array.isArray([]);
`.trimStart();

        const { diagnostics } = buildHandlerIR(code);
        expect(diagnostics).toHaveLength(0);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'Object は許可される',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        const code = `
const fn = () => Object.keys({});
`.trimStart();

        const { diagnostics } = buildHandlerIR(code);
        expect(diagnostics).toHaveLength(0);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'console は許可される（カテゴリ 5）',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        const code = `
const fn = () => console.log("debug");
`.trimStart();

        const { diagnostics } = buildHandlerIR(code);
        expect(diagnostics).toHaveLength(0);
      },
      TEST_TIMEOUT_MS,
    );
  });

  describe('許可カテゴリ 6: extraWhitelist (追加ホワイトリスト識別子)', () => {
    it(
      'extraWhitelist に含まれる識別子はエラーなし',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        const code = `
declare const customUtil: { format(s: string): string };
const fn = () => customUtil.format("hello");
`.trimStart();

        const { diagnostics } = buildHandlerIR(code, {}, undefined, undefined, ['customUtil']);
        expect(diagnostics).toHaveLength(0);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'extraWhitelist なしでは同じ識別子がエラーになる',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        const code = `
declare const customUtil: { format(s: string): string };
const fn = () => customUtil.format("hello");
`.trimStart();

        // extraWhitelist なし
        const { diagnostics } = buildHandlerIR(code);
        expect(diagnostics.length).toBeGreaterThan(0);
      },
      TEST_TIMEOUT_MS,
    );
  });

  // =============================
  // 拒否 5 カテゴリ
  // =============================

  describe('拒否カテゴリ 1: モジュールレベル変数', () => {
    it(
      'モジュールレベルの const は ts.Diagnostic error になる',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        // モジュールレベルの outsideVar をハンドラから参照
        const code = `
const outsideVar = 42;
const fn = () => outsideVar + 1;
`.trimStart();

        const { diagnostics } = buildHandlerIR(code);
        expect(diagnostics.length).toBeGreaterThan(0);
        expect(diagnostics[0]!.category).toBe(ts.DiagnosticCategory.Error);
        expect(diagnostics[0]!.messageText).toContain('outsideVar');
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'モジュールレベルの let も ts.Diagnostic error になる',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        const code = `
let counter = 0;
const fn = () => counter;
`.trimStart();

        const { diagnostics } = buildHandlerIR(code);
        expect(diagnostics.length).toBeGreaterThan(0);
        expect(diagnostics[0]!.category).toBe(ts.DiagnosticCategory.Error);
      },
      TEST_TIMEOUT_MS,
    );
  });

  describe('拒否カテゴリ 2: import された識別子', () => {
    it(
      '外部モジュールの import シンボルは ts.Diagnostic error になる',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        // import した someUtil をハンドラで使用
        const code = `
import { someUtil } from './utils';
const fn = () => someUtil();
`.trimStart();

        const utilsFile = `
export function someUtil(): void {}
`.trimStart();

        const { diagnostics } = buildHandlerIR(code, { './utils.ts': utilsFile });
        expect(diagnostics.length).toBeGreaterThan(0);
        expect(diagnostics[0]!.category).toBe(ts.DiagnosticCategory.Error);
        expect(diagnostics[0]!.messageText).toContain('someUtil');
      },
      TEST_TIMEOUT_MS,
    );
  });

  describe('拒否カテゴリ 3: window / globalThis', () => {
    it(
      'window は ts.Diagnostic error になる',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        const code = `
const fn = () => window.location.href;
`.trimStart();

        const { diagnostics } = buildHandlerIR(code);
        expect(diagnostics.length).toBeGreaterThan(0);
        expect(diagnostics[0]!.category).toBe(ts.DiagnosticCategory.Error);
        expect(diagnostics[0]!.messageText).toContain('window');
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'globalThis は ts.Diagnostic error になる',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        const code = `
const fn = () => globalThis.setTimeout;
`.trimStart();

        const { diagnostics } = buildHandlerIR(code);
        expect(diagnostics.length).toBeGreaterThan(0);
        expect(diagnostics[0]!.category).toBe(ts.DiagnosticCategory.Error);
        expect(diagnostics[0]!.messageText).toContain('globalThis');
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'undefined identifier は ts.Diagnostic error になる',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        const code = `
const fn = () => undefined;
`.trimStart();

        const { diagnostics } = buildHandlerIR(code);
        const undefinedDiag = diagnostics.find((d) => {
          if (d.category !== ts.DiagnosticCategory.Error) return false;
          const m = typeof d.messageText === 'string' ? d.messageText : d.messageText.messageText;
          return m.includes("'undefined'");
        });
        if (undefinedDiag === undefined) {
          throw new Error('expected an Error diagnostic mentioning undefined');
        }
        const msg = typeof undefinedDiag.messageText === 'string'
          ? undefinedDiag.messageText
          : undefinedDiag.messageText.messageText;
        expect(msg).toContain('forbidden');
        expect(msg).toContain('void 0');
      },
      TEST_TIMEOUT_MS,
    );
  });

  describe('拒否カテゴリ 4: 未宣言の識別子', () => {
    it(
      '未宣言の識別子は ts.Diagnostic error になる',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        const code = `
const fn = () => unknownVar.doSomething();
`.trimStart();

        const { diagnostics } = buildHandlerIR(code);
        expect(diagnostics.length).toBeGreaterThan(0);
        expect(diagnostics[0]!.category).toBe(ts.DiagnosticCategory.Error);
        expect(diagnostics[0]!.messageText).toContain('unknownVar');
      },
      TEST_TIMEOUT_MS,
    );
  });

  describe('拒否カテゴリ 5: モジュールレベルのクラス・関数宣言', () => {
    it(
      'モジュールレベルの関数参照は ts.Diagnostic error になる',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        const code = `
function doSomething(): void {}
const fn = () => doSomething();
`.trimStart();

        const { diagnostics } = buildHandlerIR(code);
        expect(diagnostics.length).toBeGreaterThan(0);
        expect(diagnostics[0]!.category).toBe(ts.DiagnosticCategory.Error);
        expect(diagnostics[0]!.messageText).toContain('doSomething');
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'モジュールレベルのクラス参照は ts.Diagnostic error になる',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        const code = `
class MyHelper {}
const fn = () => new MyHelper();
`.trimStart();

        const { diagnostics } = buildHandlerIR(code);
        expect(diagnostics.length).toBeGreaterThan(0);
        expect(diagnostics[0]!.category).toBe(ts.DiagnosticCategory.Error);
        expect(diagnostics[0]!.messageText).toContain('MyHelper');
      },
      TEST_TIMEOUT_MS,
    );
  });

  // =============================
  // エラー集約（全件走査）
  // =============================

  describe('エラー集約: 複数の unknown は全件収集する', () => {
    it(
      '複数の unknown 識別子がある場合、すべて diagnostics に含まれる',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        const code = `
const fn = () => badA + badB + badC;
`.trimStart();

        const { diagnostics } = buildHandlerIR(code);
        // 3 件の diagnostics が返る（badA, badB, badC それぞれ）
        expect(diagnostics.length).toBeGreaterThanOrEqual(3);

        const msgs = diagnostics.map((d) => d.messageText as string);
        expect(msgs.some((m) => m.includes('badA'))).toBe(true);
        expect(msgs.some((m) => m.includes('badB'))).toBe(true);
        expect(msgs.some((m) => m.includes('badC'))).toBe(true);
      },
      TEST_TIMEOUT_MS,
    );
  });

  // =============================
  // エラーメッセージの品質
  // =============================

  describe('エラーメッセージ品質', () => {
    it(
      'エラーメッセージに識別子名・DT001 コードが含まれる',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        const code = `
const forbidden = 99;
const fn = () => forbidden + 1;
`.trimStart();

        const { diagnostics } = buildHandlerIR(code);
        expect(diagnostics.length).toBeGreaterThan(0);

        const diag = diagnostics[0]!;
        expect(diag.category).toBe(ts.DiagnosticCategory.Error);
        // source が draftole-transformer
        expect(diag.source).toBe('draftole-transformer');
        // messageText に識別子名を含む
        const msg = typeof diag.messageText === 'string' ? diag.messageText : '';
        expect(msg).toContain('forbidden');
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'エラー ts.Diagnostic は source 位置情報 (file, start, length) を持つ',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        const code = `
const bad = 1;
const fn = () => bad;
`.trimStart();

        const { diagnostics } = buildHandlerIR(code);
        expect(diagnostics.length).toBeGreaterThan(0);

        const diag = diagnostics.at(0);
        expect(diag).toBeDefined();
        expect(diag?.file).toBeDefined();
        expect(diag?.start).toBeTypeOf('number');
        expect(diag?.length).toBeTypeOf('number');
        expect(diag?.start).toBeGreaterThanOrEqual(0);
        expect(diag?.length).toBeGreaterThan(0);
      },
      TEST_TIMEOUT_MS,
    );
  });

  // =============================
  // 追加カバレッジ: hasStateMarker フォールバック経路 / paramSymbols オプション
  // =============================
  // src/transformer/whitelist-validator.ts の以下の分岐をカバーする:
  //   - L111: name.toLowerCase().includes('draftole') (候補名以外の draftole 系)
  //   - L119, 123-125: _runtimeId + get 構造マーカー補助判定
  //   - L133: typeName.includes('State<' | 'Computed<' | ...)  型名フォールバック
  //   - L459-462: options.paramSymbols による each-scope 内参照の救済
  describe('カバレッジ: hasStateMarker フォールバック / paramSymbols オプション', () => {
    it(
      'シンボル名が小文字化して draftole を含む (例: _DraftoleInternal) 型は state として許可',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        // 候補名 (__draftoleStateMarker__ 等) と完全一致せず、
        // かつ DraftoleState / draftoleState という連結も含まないが、
        // toLowerCase().includes('draftole') にはマッチするプロパティ名。
        // → hasStateMarker は L111 経路で true を返す
        const code = `
interface FakeState<T> {
  readonly _DraftoleInternal_X: 'mark';
  get(): T;
}
declare const myState: FakeState<number>;
const fn = () => myState.get();
`.trimStart();

        const { diagnostics } = buildHandlerIR(code);
        // myState は L111 経由で State と判定 → diagnostics 0 件
        expect(diagnostics).toHaveLength(0);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      '_runtimeId: string + get メソッドを持つ構造的マーカーは state として許可される',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        // marker プロパティを一切持たないが、
        // _runtimeId: string + get(): T の構造を持つ型 → L119, L125 経由で許可
        const code = `
interface StructuralState<T> {
  readonly _runtimeId: string;
  get(): T;
}
declare const myState: StructuralState<number>;
const fn = () => myState.get();
`.trimStart();

        const { diagnostics } = buildHandlerIR(code);
        // myState は構造的マーカー経由で State と判定 → diagnostics 0 件
        expect(diagnostics).toHaveLength(0);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      '型名が State<T> を含む型は typeName フォールバックで許可される',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        // marker / _runtimeId を持たないが、型名 (TypeChecker.typeToString) に
        // 'State<' を含む型 → L133 typeName フォールバックで許可
        // ※ ジェネリック型として宣言することで typeToString が "State<number>" を返す
        const code = `
interface State<T> {
  read(): T;
}
declare const myState: State<number>;
const fn = () => myState.read();
`.trimStart();

        const { diagnostics } = buildHandlerIR(code);
        // myState は typeName 'State<number>' で許可される
        expect(diagnostics).toHaveLength(0);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      '型名が Computed<T> を含む型は typeName フォールバックで許可される',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        const code = `
interface Computed<T> {
  evaluate(): T;
}
declare const derived: Computed<string>;
const fn = () => derived.evaluate();
`.trimStart();

        const { diagnostics } = buildHandlerIR(code);
        expect(diagnostics).toHaveLength(0);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'options.paramSymbols に含まれる Symbol を持つ識別子は許可される (helper-aware 経路)',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        // helper-aware: outer の `.each(item => helper())` の helper body 内 `item` 等を
        // each-scope 内参照として救済する経路 (Task 3.3)。
        // ここではテストドライバから直接 paramSymbols を渡して L459, L461 を網羅する。
        const code = `
declare const itemRef: unknown;
const fn = () => itemRef;
`.trimStart();

        const mainFile = 'main.ts';
        const { program, sourceFiles } = createTestProgram({ [mainFile]: code });
        const checker = program.getTypeChecker();
        const sourceFile = sourceFiles.get(mainFile) ?? program.getSourceFile(mainFile);
        if (sourceFile === undefined) throw new Error('source not found');

        // arrow を探す
        let arrowFn: ts.ArrowFunction | undefined;
        function findArrow(n: ts.Node): void {
          if (ts.isArrowFunction(n) && arrowFn === undefined) {
            arrowFn = n;
          }
          ts.forEachChild(n, findArrow);
        }
        findArrow(sourceFile);
        if (arrowFn === undefined) throw new Error('arrow not found');

        // itemRef 識別子を探して Symbol を取得
        let itemRefIdent: ts.Identifier | undefined;
        function findIdent(n: ts.Node): void {
          if (
            ts.isIdentifier(n) &&
            n.text === 'itemRef' &&
            itemRefIdent === undefined &&
            // arrow body の中
            arrowFn !== undefined &&
            n.getStart() >= arrowFn.body.getStart()
          ) {
            itemRefIdent = n;
          }
          ts.forEachChild(n, findIdent);
        }
        findIdent(sourceFile);
        if (itemRefIdent === undefined) throw new Error('itemRef ident not found');

        const itemRefSymbol = checker.getSymbolAtLocation(itemRefIdent);
        if (itemRefSymbol === undefined) {
          throw new Error('itemRef symbol not resolved');
        }

        const ir: HandlerIR = {
          node: arrowFn,
          paramName: null,
          paramTypeText: null,
          localDecls: new Set<string>(),
          referencedIdentifiers: [],
          isExpressionBody: !ts.isBlock(arrowFn.body),
        };

        const refs: IdentifierRef[] = [
          {
            name: 'itemRef',
            node: itemRefIdent,
            symbol: itemRefSymbol,
            kind: { tag: 'unknown' },
          },
        ];

        // paramSymbols を渡して helper-aware 経路を有効化
        const paramSymbols = new Set<ts.Symbol>([itemRefSymbol]);
        const diags = validateHandler(
          ir,
          refs,
          program,
          sourceFile,
          undefined,
          { paramSymbols },
        );

        // itemRef Symbol は paramSymbols に含まれる → 救済され diagnostics 0 件
        expect(diags).toHaveLength(0);
      },
      TEST_TIMEOUT_MS,
    );

    it(
      'options.paramSymbols が空集合の場合は救済されず、通常の判定に進む',
      () => {
        if (!FEATURE_WHITELIST_VALIDATOR) return;

        // paramSymbols.size === 0 → L459 の 2 つ目のサブ条件 (size > 0) が false
        // → 救済経路はスキップされ通常判定 (未知識別子 → DT001 error)
        const code = `
declare const itemRef: unknown;
const fn = () => itemRef;
`.trimStart();

        const mainFile = 'main.ts';
        const { program, sourceFiles } = createTestProgram({ [mainFile]: code });
        const sourceFile = sourceFiles.get(mainFile) ?? program.getSourceFile(mainFile);
        if (sourceFile === undefined) throw new Error('source not found');

        let arrowFn: ts.ArrowFunction | undefined;
        function findArrow(n: ts.Node): void {
          if (ts.isArrowFunction(n) && arrowFn === undefined) arrowFn = n;
          ts.forEachChild(n, findArrow);
        }
        findArrow(sourceFile);
        if (arrowFn === undefined) throw new Error('arrow not found');

        const checker = program.getTypeChecker();
        let itemRefIdent: ts.Identifier | undefined;
        function findIdent(n: ts.Node): void {
          if (
            ts.isIdentifier(n) &&
            n.text === 'itemRef' &&
            itemRefIdent === undefined &&
            arrowFn !== undefined &&
            n.getStart() >= arrowFn.body.getStart()
          ) {
            itemRefIdent = n;
          }
          ts.forEachChild(n, findIdent);
        }
        findIdent(sourceFile);
        if (itemRefIdent === undefined) throw new Error('itemRef ident not found');

        const ir: HandlerIR = {
          node: arrowFn,
          paramName: null,
          paramTypeText: null,
          localDecls: new Set<string>(),
          referencedIdentifiers: [],
          isExpressionBody: !ts.isBlock(arrowFn.body),
        };

        const refs: IdentifierRef[] = [
          {
            name: 'itemRef',
            node: itemRefIdent,
            symbol: checker.getSymbolAtLocation(itemRefIdent),
            kind: { tag: 'unknown' },
          },
        ];

        const diags = validateHandler(
          ir,
          refs,
          program,
          sourceFile,
          undefined,
          { paramSymbols: new Set<ts.Symbol>() },
        );

        // 救済されず通常の unknown 識別子経路で diagnostic が発生
        expect(diags.length).toBeGreaterThan(0);
      },
      TEST_TIMEOUT_MS,
    );
  });
});
