/**
 * label-injector: 抽出済み varName を用いて、対象 CallExpression を
 * `__draftole_label__(<origCall>, "<varName>")` の形にラップする AST プリミティブを提供する。
 *
 * # 役割
 * - 本モジュールは **AST ノードを構築するだけ** で、SourceFile への変異は一切行わない。
 *   呼び出し側（task 4.7 の transformer pipeline）が printer / replace で適用する。
 *
 * # `__draftole_label__` の import 戦略（reuse-existing-import）
 * design §label-injector の方針:
 *   1. 既に DraftOle が export している識別子（`KNOWN_DRAFTOLE_IDENTIFIERS`）のいずれかを
 *      named import で取り込んでいる ImportDeclaration をファイル先頭から探索する。
 *   2. 見つかった ImportDeclaration の `moduleSpecifier` をそのまま再利用し、
 *      その named imports に `__draftole_label__` を **追加** する。
 *   3. 見つからない場合は新規 import を生成せず、対象ファイルの書き換えをスキップし、
 *      pipeline 側で diagnostic コード `DT013`（Suggestion カテゴリ）を発行する。
 *
 * # DT013 フォールバック方針
 * `findDraftOleImport` が `undefined` を返した場合、呼び出し側 pipeline は:
 *   - 新規 import を作らない
 *   - 当該ファイルの label 注入をスキップする
 *   - `fileDiagnostics` に Suggestion カテゴリ・コード `DT013` の `ts.Diagnostic` を push する
 * 本モジュールはあくまでプリミティブを提供するのみで、上記オーケストレーションは行わない。
 *
 * 対応 requirements: 4.1, 4.2, 4.5
 * 対応 design: §label-injector
 */

import * as ts from 'typescript';

// ---- 既知 DraftOle 識別子セット（import site 検出用） -----------------------

/**
 * DraftOle が公開している代表的な named export 群。
 * このうちいずれか1つでも named import に含まれている ImportDeclaration を
 * 「DraftOle import site」とみなす。
 */
const KNOWN_DRAFTOLE_IDENTIFIERS: ReadonlySet<string> = new Set<string>([
  'el',
  'theme',
  'css',
  'Root',
  'FileExporter',
  'button',
  'div',
  'html',
  'body',
  'view',
  'Page',
  'App',
  'bindEach',
]);

const LABEL_IDENTIFIER = '__draftole_label__';

// ---- 公開 API ---------------------------------------------------------------

/**
 * `__draftole_label__` をどこから import するかの方針を表す。
 * `findDraftOleImport` の戻り値。
 */
export interface DraftOleImportSite {
  /** 拡張対象の既存 ImportDeclaration（named imports に `__draftole_label__` を追加する）。 */
  readonly importDecl: ts.ImportDeclaration;
  /** その import の moduleSpecifier 文字列（例: `'draft-ole'`, `'../../dist/index.js'`）。 */
  readonly moduleSpecifier: string;
}

/**
 * SourceFile を走査し、再利用可能な DraftOle named import を探す。
 *
 * 仕様:
 * - `ts.ImportDeclaration` を順に検査する。
 * - `importClause.namedBindings` が `ts.NamedImports` の場合のみ対象。
 *   （`NamespaceImport` の場合は本モジュールでは扱わない。）
 * - いずれかの `ImportSpecifier.name.text` が `KNOWN_DRAFTOLE_IDENTIFIERS` に含まれていれば
 *   その import を採用する（**ファイル中で最初に一致したもの**）。
 * - 該当が無ければ `undefined` を返す。
 *
 * # 呼び出し側への期待
 * `undefined` が返った場合、pipeline は label 注入をスキップし、
 * Suggestion カテゴリの diagnostic（コード `DT013`）を発行すること。
 */
export function findDraftOleImport(sourceFile: ts.SourceFile): DraftOleImportSite | undefined {
  for (const stmt of sourceFile.statements) {
    if (!ts.isImportDeclaration(stmt)) continue;
    const importClause = stmt.importClause;
    if (!importClause) continue;
    const namedBindings = importClause.namedBindings;
    if (!namedBindings || !ts.isNamedImports(namedBindings)) continue;

    const hasKnown = namedBindings.elements.some((spec) =>
      KNOWN_DRAFTOLE_IDENTIFIERS.has(spec.name.text),
    );
    if (!hasKnown) continue;

    // ImportDeclaration の moduleSpecifier は必ず StringLiteral。
    const moduleSpecifier = (stmt.moduleSpecifier as ts.StringLiteral).text;
    return {
      importDecl: stmt,
      moduleSpecifier,
    };
  }
  return undefined;
}

/**
 * `__draftole_label__` が既に SourceFile の named imports に存在するかを判定する。
 * 存在する場合は pipeline 側で import 追加処理をスキップできる。
 */
export function hasLabelImport(sourceFile: ts.SourceFile): boolean {
  for (const stmt of sourceFile.statements) {
    if (!ts.isImportDeclaration(stmt)) continue;
    const importClause = stmt.importClause;
    if (!importClause) continue;
    const namedBindings = importClause.namedBindings;
    if (!namedBindings || !ts.isNamedImports(namedBindings)) continue;

    if (namedBindings.elements.some((spec) => spec.name.text === LABEL_IDENTIFIER)) {
      return true;
    }
  }
  return false;
}

/**
 * `__draftole_label__(<callExpr>, "<varName>")` の CallExpression を構築する。
 *
 * - 純粋な AST 構築のみ。SourceFile への変異は行わない。
 * - 返り値の型は元の式と同じ（runtime helper の signature が identity 型透過のため）。
 */
export function buildLabeledCall(
  callExpr: ts.CallExpression,
  varName: string,
): ts.CallExpression {
  return ts.factory.createCallExpression(
    ts.factory.createIdentifier(LABEL_IDENTIFIER),
    /* typeArguments */ undefined,
    [callExpr, ts.factory.createStringLiteral(varName)],
  );
}

/**
 * `__draftole_label__` を単独で named import する新規 ImportDeclaration を生成する。
 *
 * # 用途: emit-safe な import 注入
 * 呼び出し側 pipeline は、本関数で生成した ImportDeclaration を
 * SourceFile の statements 先頭に prepend することで `__draftole_label__` を
 * 取り込む。`updateImportDeclaration` で既存 import を mutate する方式は
 * TS→TS printing では問題なく動作するが、`program.emit()` 経由の TS→JS では
 * binder が pre-transform 時点のシンボル表で識別子解決を行うため、後付けで
 * 加えた named specifier が「bare identifier」として未解決化される。
 *
 * # 重要: emit substitution の限界
 * TypeScript の ES→CJS modules transformer は、シンボル束縛済みの識別子のみ
 * `draft_ole_N.__draftole_label__` 形に書き換える。transformer が新規追加した
 * 識別子はシンボル束縛を持たないため、`import` 構文を新規追加するだけでは
 * call site が bare identifier のまま emit され ReferenceError になる。
 *
 * このため、CommonJS ターゲット時は本関数ではなく
 * {@link createLabelRequireStatement} を使い、`const { __draftole_label__ } = require(...)`
 * を直接生成すること。本関数は ESM ターゲット / TS→TS printing 用途に残す。
 *
 * @param moduleSpecifier `findDraftOleImport` で取得した既存 draft-ole import の
 *   module path をそのまま渡す。新規 import は同一 module を参照する必要がある。
 */
export function createLabelImportDeclaration(
  moduleSpecifier: string,
): ts.ImportDeclaration {
  const factory = ts.factory;
  return factory.createImportDeclaration(
    /* modifiers */ undefined,
    factory.createImportClause(
      /* isTypeOnly */ false,
      /* name */ undefined,
      factory.createNamedImports([
        factory.createImportSpecifier(
          /* isTypeOnly */ false,
          /* propertyName */ undefined,
          factory.createIdentifier(LABEL_IDENTIFIER),
        ),
      ]),
    ),
    factory.createStringLiteral(moduleSpecifier),
  );
}

/**
 * CommonJS 出力向けの `__draftole_label__` 取り込み文を生成する。
 *
 * 生成形:
 *   `const { __draftole_label__ } = require('<moduleSpecifier>');`
 *
 * TS の ES→CJS modules transformer による識別子置換に依存しないため、
 * transformer が新規追加した識別子でも安全に解決される。
 *
 * 呼び出し側 pipeline は、`compilerOptions.module` が CommonJS 系の場合に
 * 本関数の戻り値を SourceFile.statements の先頭に prepend する。
 */
export function createLabelRequireStatement(
  moduleSpecifier: string,
): ts.VariableStatement {
  const factory = ts.factory;
  const labelIdent = factory.createIdentifier(LABEL_IDENTIFIER);
  return factory.createVariableStatement(
    /* modifiers */ undefined,
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          factory.createObjectBindingPattern([
            factory.createBindingElement(
              /* dotDotDotToken */ undefined,
              /* propertyName */ undefined,
              labelIdent,
              /* initializer */ undefined,
            ),
          ]),
          /* exclamationToken */ undefined,
          /* type */ undefined,
          factory.createCallExpression(
            factory.createIdentifier('require'),
            /* typeArguments */ undefined,
            [factory.createStringLiteral(moduleSpecifier)],
          ),
        ),
      ],
      ts.NodeFlags.Const,
    ),
  );
}

