/**
 * theme-class-detector: `theme.class(...)` 呼び出しの AST 検出
 *
 * Task 4.1:
 * - `ts.forEachChild` で全 `ts.CallExpression` を走査
 * - `<expr>.class(...)` 形式の PropertyAccessExpression を持つ呼び出しを候補化
 * - 候補の LHS が `UnifiedTheme.class` メソッドを持つ型であることを検証する
 *   - Primary: TypeChecker 経由で LHS の symbol/type を取得し、`class` プロパティが
 *     `ThemeClassMethod` 互換（properties-only / properties+selectors / named の overload を持つ）
 *     かを構造的に判定する
 *   - Fallback (HEURISTIC): TypeChecker での判定が確定しない場合は、LHS が識別子 `theme` で
 *     かつソースファイルの top-level import に DraftOle 由来の named import（`theme`, `createTheme`,
 *     `el`, `css`, `Root`, `FileExporter` 等）が存在するときに限り「`theme.class()` とみなす」
 * - 無名 overload のみを採用する:
 *   - `theme.class({ ... })` または `theme.class({ ... }, { ... })` → INCLUDE
 *   - `theme.class('name', ...)` → EXCLUDE（varName が既知のためラベル注入不要）
 *   - 上記以外の形（spread / 0 args 等）→ スキップ
 *
 * 本モジュールは検出のみを担い、varName 抽出 / 書き換えは subsequent task が担当する。
 *
 * 対応 requirements: 1.1, 2.1, 3.1, 3.3
 */

import * as ts from 'typescript';

// ---- 公開型 ------------------------------------------------------------------

/**
 * 検出された `theme.class(...)` 呼び出し 1 件分の情報。
 *
 * `overload` は無名 overload のみ採用するため常に `'anonymous'`。
 * （将来 named 経路も拡張する場合は union を広げる）
 */
export interface ThemeClassDetectorResult {
  /** `theme.class(...)` の CallExpression ノード */
  readonly callExpr: ts.CallExpression;
  /** overload 種別。本実装では常に `'anonymous'` */
  readonly overload: 'anonymous';
}

// ---- 内部ヘルパー ------------------------------------------------------------

/**
 * DraftOle 由来の named import で「theme が import されているか」を雑に判定するための
 * 既知シンボル集合。HEURISTIC fallback でのみ参照する。
 */
const DRAFTOLE_KNOWN_IMPORTS: ReadonlySet<string> = new Set<string>([
  'theme',
  'createTheme',
  'el',
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

/**
 * ソースファイル top-level の ImportDeclaration から、named import に
 * `DRAFTOLE_KNOWN_IMPORTS` のいずれかが含まれるかを判定する。
 *
 * HEURISTIC fallback の前提条件として使用する。
 */
function hasDraftOleImport(sourceFile: ts.SourceFile): boolean {
  for (const stmt of sourceFile.statements) {
    if (!ts.isImportDeclaration(stmt)) continue;
    const clause = stmt.importClause;
    if (clause === undefined) continue;
    const bindings = clause.namedBindings;
    if (bindings === undefined || !ts.isNamedImports(bindings)) continue;
    for (const spec of bindings.elements) {
      const name = spec.name.text;
      if (DRAFTOLE_KNOWN_IMPORTS.has(name)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 型 `t` が `ThemeClassMethod` 互換の `class` プロパティを持つかを判定する。
 *
 * `ThemeClassMethod` は overload セット:
 *   (properties) => StyleTemplate
 *   (properties, selectors) => StyleTemplate
 *   (name, properties, selectors?) => SharedStyle
 *
 * 実装は「`class` プロパティが存在し、その型が call signature を 1 つ以上持つ」
 * 程度の緩い判定に留める（厳密に overload を見ると brittle になるため）。
 *
 * 判定不能（symbol 解決失敗等）の場合は `false` を返し、呼び出し側で
 * HEURISTIC fallback に委ねる。
 */
function typeLooksLikeUnifiedTheme(
  type: ts.Type,
  checker: ts.TypeChecker,
): boolean {
  const classProp = type.getProperty('class');
  if (classProp === undefined) return false;

  // class プロパティの宣言位置から型を取得
  const decls = classProp.getDeclarations();
  if (decls === undefined || decls.length === 0) {
    // 宣言取得失敗 → 緩めに OK 扱い（class プロパティが存在する事実のみで判定）
    return true;
  }
  try {
    const classType = checker.getTypeOfSymbolAtLocation(classProp, decls[0]);
    const signatures = classType.getCallSignatures();
    return signatures.length > 0;
  } catch {
    // 型解決例外時は class プロパティ存在のみで OK 扱い
    return true;
  }
}

/**
 * CallExpression が `theme.class(...)` 形式かを判定する。
 *
 * - PropertyAccessExpression で `.name.text === 'class'`
 * - LHS（`expr.expression`）が UnifiedTheme 互換型 — TypeChecker 経由で判定
 * - 判定不能時は HEURISTIC fallback（LHS が識別子 `theme` かつ DraftOle import が存在）
 */
function isThemeClassCall(
  node: ts.CallExpression,
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
): boolean {
  const expr = node.expression;
  if (!ts.isPropertyAccessExpression(expr)) return false;
  if (expr.name.text !== 'class') return false;

  const lhs = expr.expression;

  // Primary: TypeChecker 経由
  // 例外や undefined symbol を許容しつつ、最も robust な経路を試す
  let typeCheckOk = false;
  try {
    const symbol = checker.getSymbolAtLocation(lhs);
    if (symbol !== undefined) {
      const lhsType = checker.getTypeOfSymbolAtLocation(symbol, lhs);
      if (typeLooksLikeUnifiedTheme(lhsType, checker)) {
        typeCheckOk = true;
      }
    } else {
      // symbol が取れない場合でも、型推論で取得を試みる
      const lhsType = checker.getTypeAtLocation(lhs);
      if (typeLooksLikeUnifiedTheme(lhsType, checker)) {
        typeCheckOk = true;
      }
    }
  } catch {
    // 型チェッカー側の不具合や未解決参照は無視して fallback に委ねる
  }

  if (typeCheckOk) return true;

  // HEURISTIC fallback: LHS が識別子 `theme` かつ DraftOle import が存在
  if (ts.isIdentifier(lhs) && lhs.text === 'theme' && hasDraftOleImport(sourceFile)) {
    return true; // HEURISTIC
  }

  return false;
}

/**
 * 引数列が「無名 overload」に該当するかを判定する。
 *
 * - 1 引数: ObjectLiteralExpression → 無名（properties のみ）
 * - 2 引数: 第 1 が ObjectLiteralExpression かつ 第 2 が ObjectLiteralExpression → 無名 + selectors
 * - 第 1 引数が StringLiteral → named overload（除外）
 * - それ以外（spread / 0 引数 / 識別子参照等）→ 除外
 */
function isAnonymousOverloadArgs(args: ts.NodeArray<ts.Expression>): boolean {
  if (args.length === 0) return false;

  const first = args[0];

  // named overload は除外
  if (ts.isStringLiteral(first) || ts.isNoSubstitutionTemplateLiteral(first)) {
    return false;
  }

  // spread 要素を含む形は対象外
  for (const a of args) {
    if (ts.isSpreadElement(a)) return false;
  }

  if (args.length === 1) {
    return ts.isObjectLiteralExpression(first);
  }
  if (args.length === 2) {
    return (
      ts.isObjectLiteralExpression(first) &&
      ts.isObjectLiteralExpression(args[1])
    );
  }
  return false;
}

// ---- メイン実装 --------------------------------------------------------------

/**
 * `sourceFile` を AST 走査し、無名 overload の `theme.class(...)` 呼び出しを抽出する。
 *
 * 型チェッカーで判定が確定しない場合は構造的 HEURISTIC（`theme` 識別子 + DraftOle import）
 * を fallback として使用する。型エラーや symbol 未解決でも例外を投げない。
 *
 * @param sourceFile 走査対象のソースファイル
 * @param checker `ts.Program#getTypeChecker()` から取得した型チェッカー
 * @returns 検出された呼び出し情報の配列（挿入順）
 */
export function detectThemeClassCalls(
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
): readonly ThemeClassDetectorResult[] {
  const results: ThemeClassDetectorResult[] = [];

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node)) {
      if (
        isThemeClassCall(node, sourceFile, checker) &&
        isAnonymousOverloadArgs(node.arguments)
      ) {
        results.push({
          callExpr: node,
          overload: 'anonymous',
        });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return results;
}
