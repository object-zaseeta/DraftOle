/**
 * Task 4.8: transformer 統合テスト — theme.class() ラベル注入
 *
 * 観測対象:
 *   `theme.class(...)` の AST 検出 → varName 解決 → label 注入 → import 拡張
 *   までを transformer (`draftoleTransformer`) を実走させて end-to-end で検証する。
 *
 * テストケース:
 *   1. Tier 1 (module-top const): `const card = theme.class({...})`
 *      → `__draftole_label__(theme.class(...), "card")` で包まれる
 *   2. Tier 2 (inline `css` prop + sibling `id`): `el.div({ id: 'hero', css: theme.class({...}) })`
 *      → `__draftole_label__(theme.class(...), "hero")` で包まれる
 *   3. Tier 3 (parent helper call): `someHelper(theme.class({...}))`
 *      → `__draftole_label__(theme.class(...), "somehelper")` で包まれる
 *   4. Import 重複防止: 既に `__draftole_label__` が import 済みなら追加されない
 *   5. DraftOle import 無し → 検出時に DT013 (Suggestion) が発行され wrap されない
 *
 * 対応 requirements: 1.1, 2.1, 3.1, 3.3, 4.1, 4.2
 */

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import draftoleTransformer from '../../src/transformer/index.ts';

// ---- ヘルパー -------------------------------------------------------------

/**
 * 仮想ファイルシステム付きで ts.Program を生成する。
 */
function createProgramWithFiles(files: Record<string, string>): {
  program: ts.Program;
  sourceFiles: Map<string, ts.SourceFile>;
} {
  const fileNames = Object.keys(files);
  const sourceFilesMap = new Map<string, ts.SourceFile>();

  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2019,
    module: ts.ModuleKind.ESNext,
    strict: false,
    noEmit: true,
  };

  const host = ts.createCompilerHost(compilerOptions);
  const originalGetSourceFile = host.getSourceFile.bind(host);

  host.getSourceFile = (fileName, languageVersion): ts.SourceFile | undefined => {
    const shortName = Object.keys(files).find(
      (k) => fileName.endsWith(k) || fileName === k,
    );
    if (shortName !== undefined) {
      const sf = ts.createSourceFile(
        fileName,
        files[shortName],
        languageVersion,
        /* setParentNodes */ true,
      );
      sourceFilesMap.set(shortName, sf);
      return sf;
    }
    return originalGetSourceFile(fileName, languageVersion);
  };

  host.fileExists = (fileName): boolean => {
    return (
      fileNames.some((k) => fileName.endsWith(k) || fileName === k) ||
      ts.sys.fileExists(fileName)
    );
  };

  host.readFile = (fileName): string | undefined => {
    const shortName = Object.keys(files).find(
      (k) => fileName.endsWith(k) || fileName === k,
    );
    if (shortName !== undefined) return files[shortName];
    return ts.sys.readFile(fileName);
  };

  const program = ts.createProgram(fileNames, compilerOptions, host);

  for (const fileName of fileNames) {
    if (!sourceFilesMap.has(fileName)) {
      const sf = program.getSourceFile(fileName);
      if (sf !== undefined) sourceFilesMap.set(fileName, sf);
    }
  }

  return { program, sourceFiles: sourceFilesMap };
}

/**
 * transformer を走らせて出力コード + diagnostics を返す。
 */
function runTransformer(source: string): {
  outputCode: string;
  diagnostics: ts.Diagnostic[];
} {
  const { program, sourceFiles } = createProgramWithFiles({
    'fixture.ts': source,
  });
  const sourceFile = sourceFiles.get('fixture.ts');
  if (sourceFile === undefined) throw new Error('sourceFile not found');

  const collected: ts.Diagnostic[] = [];
  const transformerFactory = draftoleTransformer(program, {
    debug: false,
    onDiagnostics: (diags) => {
      collected.push(...diags);
    },
  });
  const transformResult = ts.transform<ts.SourceFile>(
    [sourceFile],
    [transformerFactory],
  );
  const transformedSf = transformResult.transformed[0];
  transformResult.dispose();

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  return {
    outputCode: printer.printFile(transformedSf),
    diagnostics: collected,
  };
}

// ---- テスト本体 -----------------------------------------------------------

describe('draftoleTransformer / theme-class-label-injection (Task 4.8)', () => {
  /**
   * Tier 1: module-top const 宣言
   *
   * Source: `const card = theme.class({...})`
   * Expected: 出力に `__draftole_label__(theme.class(...), "card")` が現れ、
   *           既存の draft-ole import に `__draftole_label__` が追加される。
   */
  it('ケース1: Tier 1 (module const) → __draftole_label__("card") で wrap される', () => {
    const source = `
import { el, theme } from 'draft-ole';
const card = theme.class({ display: 'flex' });
`.trimStart();

    const { outputCode } = runTransformer(source);

    // wrap が発生していること
    expect(outputCode).toContain('__draftole_label__');
    expect(outputCode).toContain('"card"');
    // 元の theme.class(...) が wrap の中で生き残ること
    expect(outputCode).toContain('theme.class(');

    // import に __draftole_label__ が追加されていること
    // 順序を仮定しない（substring 検査）
    expect(outputCode).toMatch(/import\s*\{[^}]*__draftole_label__[^}]*\}\s*from\s*['"]draft-ole['"]/);
    expect(outputCode).toMatch(/import\s*\{[^}]*\btheme\b[^}]*\}\s*from\s*['"]draft-ole['"]/);
  });

  /**
   * Tier 2: inline `css` prop + sibling `id` ラベル
   *
   * Source: `el.div({ id: 'hero', css: theme.class({...}) })`
   * Expected: 出力に `__draftole_label__(theme.class(...), "hero")` が現れる。
   */
  it('ケース2: Tier 2 (inline css prop + sibling id) → __draftole_label__("hero")', () => {
    const source = `
import { el, theme } from 'draft-ole';
el.div({ id: 'hero', css: theme.class({ color: 'red' }) });
`.trimStart();

    const { outputCode } = runTransformer(source);

    expect(outputCode).toContain('__draftole_label__');
    expect(outputCode).toContain('"hero"');
    expect(outputCode).toContain('theme.class(');
    expect(outputCode).toMatch(/import\s*\{[^}]*__draftole_label__[^}]*\}\s*from\s*['"]draft-ole['"]/);
  });

  /**
   * Tier 3: 親 CallExpression の関数名を採用
   *
   * Source: `someHelper(theme.class({...}))`
   * Expected: 親関数名 `someHelper` を sanitize → 小文字化された `"somehelper"`
   */
  it('ケース3: Tier 3 (parent helper call) → __draftole_label__("somehelper")', () => {
    const source = `
import { el, theme } from 'draft-ole';
declare function someHelper(t: unknown): void;
someHelper(theme.class({ color: 'blue' }));
`.trimStart();

    const { outputCode } = runTransformer(source);

    expect(outputCode).toContain('__draftole_label__');
    // sanitize により lower-case 化される
    expect(outputCode).toContain('"somehelper"');
    expect(outputCode).toContain('theme.class(');
    expect(outputCode).toMatch(/import\s*\{[^}]*__draftole_label__[^}]*\}\s*from\s*['"]draft-ole['"]/);
  });

  /**
   * Import の冪等性: 既存の `__draftole_label__` import が複製されない
   */
  it('ケース4: 既存 __draftole_label__ import は複製されない', () => {
    const source = `
import { theme, __draftole_label__ } from 'draft-ole';
const a = theme.class({ color: 'green' });
`.trimStart();

    const { outputCode } = runTransformer(source);

    // wrap は発生する
    expect(outputCode).toContain('__draftole_label__');
    expect(outputCode).toContain('"a"');

    // __draftole_label__ identifier は import 文 + wrap で計 2 回登場（重複追加無し）
    // 重複追加されていれば import 内で 2 回以上現れ、合計 3 回以上になる。
    const labelMatches = outputCode.match(/__draftole_label__/g) ?? [];
    expect(labelMatches.length).toBe(2);

    // import 句内には 1 回だけ
    const importLineMatch = outputCode.match(
      /import\s*\{([^}]*)\}\s*from\s*['"]draft-ole['"]/,
    );
    expect(importLineMatch).not.toBeNull();
    const importContent = importLineMatch?.[1] ?? '';
    const importLabelMatches = importContent.match(/__draftole_label__/g) ?? [];
    expect(importLabelMatches.length).toBe(1);
  });

  /**
   * DraftOle import 無し → DT013 (Suggestion) + wrap スキップ
   *
   * 検出器は (a) 型チェッカー経由で UnifiedTheme 互換型を判定、(b) heuristic
   * fallback として bare identifier `theme` + DraftOle named import の存在を確認する。
   * DraftOle import が無い場合に検出を成立させるには (a) を通す必要がある。
   * そこで `theme` を「`class` プロパティを持つ型」として宣言する。
   * `label-injector.findDraftOleImport` は draft-ole 固有 named import が無い
   * （`unrelated` 由来の named import のみ）と判断するため DT013 が発行される。
   */
  it('ケース5: DraftOle import 無し → DT013 (Suggestion) + wrap スキップ', () => {
    const source = `
import { unrelated } from 'unrelated';
declare const theme: { class(props: object): { bodyHash: string } };
const card = theme.class({ display: 'flex' });
console.log(unrelated);
`.trimStart();

    const { outputCode, diagnostics } = runTransformer(source);

    // wrap が発生していないこと
    expect(outputCode).not.toContain('__draftole_label__');

    // DT013 (code=9013) が Suggestion カテゴリで発行されていること
    const dt013 = diagnostics.find((d) => d.code === 9013);
    expect(dt013).toBeDefined();
    expect(dt013?.category).toBe(ts.DiagnosticCategory.Suggestion);
  });
});
