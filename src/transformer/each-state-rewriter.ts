/**
 * each-state-rewriter — `.each()` コールバック内のステート識別子検出・マップ構築・診断
 *
 * Task 1.1:
 * - `.on()` CallExpression の AST 祖先を辿り、直近の ArrowFunction 親が
 *   `.each(fn)` の引数かどうかを判定する
 * - `EachScopeContext { itemParamName, factoryParamName }` 型を定義して export
 * - each スコープ外では `null` を返す
 * - `factoryParamName` は常に `"itemId"` で固定（`buildFactoryCode` シグネチャと整合）
 *
 * 対応 requirements: 1.1, 1.2, 5
 */

import * as ts from 'typescript';

// ---- 定数 -------------------------------------------------------------------

/**
 * `.each()` を判定するメソッド名。
 * whitelist-validator.ts の NESTED_CALLBACK_METHODS と整合させる。
 */
const EACH_METHOD_NAME = 'each';

/**
 * `buildFactoryCode` が生成する factory 関数の第 1 パラメータ名。
 * `function(itemId, idx, draftole)` シグネチャと整合する固定値。
 */
const FACTORY_PARAM_NAME = 'itemId';

/**
 * DT003 診断コード: each スコープ識別子のサポート外使用パターン
 */
const DT003_CODE = 9003 as number & { __brand: 'DT003' };

// ---- 公開型 ------------------------------------------------------------------

/**
 * `.each()` コールバック内でのスコープ検出結果。
 * `detectEachScopeContext` が each スコープを検出した場合に返す。
 */
export interface EachScopeContext {
  /** `.each()` コールバックの item パラメータ名（例: "item"） */
  readonly itemParamName: string;
  /** `buildFactoryCode` が生成する factory 関数の第1パラメータ名（常に "itemId"） */
  readonly factoryParamName: string;
}

/**
 * `detectEachScopeContext` の戻り値型 (3-state, TXDX-DX Task 2.1).
 *
 * - `EachScopeContext`: each スコープを (直接 or helper 経由で) 一意に特定できた。
 * - `null`: each スコープ外であることが確定した。
 * - `'ambiguous'`: helper-aware 経路で call-site が `.each` 内外混在、または
 *    異なる `itemParamName` を持つため一意に判定できない。
 *    `'ambiguous'` は helper-aware 経路 (`options.helperCallSites` 指定時) でのみ
 *    発生し、直接 AST walk-up 経路では決して返されない。
 */
export type EachScopeDetectionResult = EachScopeContext | null | 'ambiguous';

// ---- ヘルパー ----------------------------------------------------------------

/**
 * ノードが `.each(fn)` CallExpression の直接引数である ArrowFunction かを判定する。
 *
 * 判定条件:
 * 1. `node` が ArrowFunction
 * 2. `node.parent` が CallExpression
 * 3. その CallExpression の expression が PropertyAccessExpression
 * 4. プロパティ名が "each"
 * 5. `node` がその CallExpression の第 1 引数
 */
function isEachCallbackArrow(node: ts.Node): node is ts.ArrowFunction {
  if (!ts.isArrowFunction(node)) return false;

  const parent = node.parent;
  if (!ts.isCallExpression(parent)) return false;

  const expr = parent.expression;
  if (!ts.isPropertyAccessExpression(expr)) return false;

  if (expr.name.text !== EACH_METHOD_NAME) return false;

  // `node` が第 1 引数（インデックス 0）であること
  return parent.arguments.length >= 1 && parent.arguments[0] === node;
}

/**
 * ソースファイルの診断情報を作成するヘルパー
 */
function createDiagnostic(
  node: ts.Node,
  messageText: string,
  code: number,
): ts.Diagnostic {
  const sourceFile = node.getSourceFile();
  const start = node.getStart(sourceFile, false);
  const length = node.getWidth(sourceFile);
  return {
    file: sourceFile,
    start,
    length,
    messageText,
    category: ts.DiagnosticCategory.Error,
    code,
    source: 'draftole-transformer',
  };
}

// ---- 公開 API ----------------------------------------------------------------

/**
 * `.on()` CallExpression が `.each()` コールバック内にあるかを検出する。
 *
 * AST を `node.parent` を使って上位に辿り、最初に見つかった ArrowFunction 祖先が
 * `.each(fn)` の引数であるかを判定する。ネスト each は Non-Goals のため、
 * 最初の ArrowFunction 祖先のみを対象とする。
 *
 * Helper-aware walk-up (TXDX-2 / TXDX-DX Task 2.1):
 *   `options.helperCallSites` が指定された場合、通常 walk-up が `null` を返す
 *   ケース（helper の body 内に `.on` があり helper 自身の直近 ArrowFunction 祖先が
 *   `.each` でない場合）に、各 call-site から再帰的に detectEachScopeContext を
 *   実行する。判定結果は 3-state:
 *     - すべての call-site が同一 `EachScopeContext` → その context を継承
 *     - すべての call-site が `null` (each 外) → `null`
 *     - context と null の混在 / 異 itemParamName → `'ambiguous'`
 *   `'ambiguous'` は helper-aware 経路でのみ発生し、直接 AST walk-up 経路は
 *   従来通り `EachScopeContext | null` のみを返す。
 *
 * @param onCallExpr `.on(event, arrow)` の CallExpression ノード
 * @param checker TypeChecker（将来の型ベース拡張用、現在は AST 走査のみ使用）
 * @param options 任意オプション。`helperCallSites` を指定すると helper 経由の
 *                walk-up を 1 段だけ継続する。再帰呼び出し時は省略する。
 * @returns EachScopeDetectionResult (3-state: context | null | 'ambiguous')
 */
export function detectEachScopeContext(
  onCallExpr: ts.CallExpression,
  checker: ts.TypeChecker,
  options?: { readonly helperCallSites?: readonly ts.CallExpression[] },
): EachScopeDetectionResult {
  // `checker` パラメータは将来の型ベース拡張用（現時点では AST 走査のみ）
  void checker;

  // 1. 通常の AST 親方向 walk-up
  let current: ts.Node = onCallExpr;

  while (current.parent !== undefined) {
    current = current.parent;

    if (ts.isArrowFunction(current)) {
      // 直近の ArrowFunction 祖先に到達
      if (isEachCallbackArrow(current)) {
        // `.each((item) => ...)` の ArrowFunction: item パラメータ名を取得
        const firstParam = current.parameters[0];
        const itemParamName =
          firstParam !== undefined && ts.isParameter(firstParam) && ts.isIdentifier(firstParam.name)
            ? firstParam.name.text
            : 'item';

        return {
          itemParamName,
          factoryParamName: FACTORY_PARAM_NAME,
        };
      } else {
        // each 以外の ArrowFunction が先に見つかった → 通常 walk-up は each スコープ外
        // helper-aware ルートに委ねるため break
        break;
      }
    }
  }

  // 2. helper-aware walk-up (1 段限定; 再帰時は helperCallSites を渡さない)
  const helperCallSites = options?.helperCallSites;
  if (helperCallSites === undefined || helperCallSites.length === 0) {
    return null;
  }

  let inheritedContext: EachScopeContext | null = null;
  let sawNull = false;
  let sawContext = false;
  for (const callSite of helperCallSites) {
    // 再帰時は options を渡さない（multi-level helper は Non-Goal）。
    // 再帰側は helper-aware 経路を使わないため、戻り値は EachScopeContext | null に
    // 限定される（'ambiguous' は発生し得ない）。
    const ctx = detectEachScopeContext(callSite, checker);
    if (ctx === null) {
      sawNull = true;
      continue;
    }
    // ctx === 'ambiguous' は再帰側では発生しないが、union narrowing のため明示。
    if (ctx === 'ambiguous') {
      return 'ambiguous';
    }
    sawContext = true;
    if (inheritedContext === null) {
      inheritedContext = ctx;
    } else if (inheritedContext.itemParamName !== ctx.itemParamName) {
      // 異なる itemParamName → ambiguous
      return 'ambiguous';
    }
  }

  // 混在 (一部 each 内 + 一部 each 外) → ambiguous
  if (sawNull && sawContext) return 'ambiguous';
  // すべて null → each 外 (継承なし)
  // すべて同一 context → inheritedContext を継承
  return inheritedContext;
}

/**
 * EachScopeContext から「識別子名 → factory パラメータ名」マップを構築する。
 *
 * 例: EachScopeContext { itemParamName: "item", factoryParamName: "itemId" }
 *   → Map { "item" -> "itemId" }
 *
 * @param context `detectEachScopeContext` が返した EachScopeContext
 * @returns 識別子名 → factory パラメータ名のマップ
 */
export function buildEachParamNameMap(
  context: EachScopeContext,
): Map<string, string> {
  return new Map([[context.itemParamName, context.factoryParamName]]);
}

/**
 * each スコープハンドラ内の識別子使用パターンを検査し、
 * サポート外パターンに対して DT003 診断を返す。
 *
 * サポート対象: each スコープ識別子が PropertyAccessExpression の左辺（object）として使用
 *   例: `item.get()`, `item.set(v)`, `item.done`
 *
 * サポート外: PropertyAccessExpression の左辺以外で使用
 *   例: `doSomething(item)`, `const x = item`, `return item`
 *
 * @param arrowFn ハンドラの ArrowFunction ノード（`.on()` の第 2 引数）
 * @param context `detectEachScopeContext` が返した EachScopeContext
 * @param sourceFile ソースファイル（診断生成に使用）
 * @returns DT003 診断の配列（サポート対象のみの場合は空配列）
 */
export function validateEachScopeUsage(
  arrowFn: ts.ArrowFunction,
  context: EachScopeContext,
  sourceFile: ts.SourceFile,
): ts.Diagnostic[] {
  void sourceFile; // ソースファイルは node.getSourceFile() から取得

  const diagnostics: ts.Diagnostic[] = [];
  const { itemParamName } = context;

  function visit(node: ts.Node): void {
    if (ts.isIdentifier(node) && node.text === itemParamName) {
      // PropertyAccessExpression の左辺（object）として使用されているか確認
      const parent = node.parent;
      if (
        ts.isPropertyAccessExpression(parent) &&
        parent.expression === node
      ) {
        // サポート対象: `item.something` の形式
        // このノード自体は OK、子ノードへの再帰はスキップ（自身が識別子のため子なし）
        return;
      } else {
        // サポート外パターン: PropertyAccess の左辺以外
        diagnostics.push(
          createDiagnostic(
            node,
            `DraftOle DT003: each-scope identifier '${itemParamName}' is used in an unsupported pattern. ` +
              `Only property access (e.g. '${itemParamName}.get()', '${itemParamName}.set(v)') is supported. ` +
              `See docs/each-scope-handler.md`,
            DT003_CODE,
          ),
        );
        return;
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(arrowFn.body);

  return diagnostics;
}

// ---- each スコープ Symbol 集合 (relocated from index.ts) --------------------

/**
 * `.on()` CallExpression を起点に祖先方向に走査し、最も内側の `.each(fn)`
 * コールバックアロー関数を検出して、そのパラメータ Identifier の Symbol 集合を返す。
 *
 * `detectEachScopeContext` と同じ祖先走査ロジックを用いるが、こちらはパラメータの
 * Symbol を `buildStateIdMap` の `eachScopeParamSymbols` に注入するために必要となる
 * Symbol 集合を返す。
 *
 * Helper-aware (TXDX-DX Task 3.1):
 *   `options.helperCallSites` が指定された場合、直接 enclosing `.each` が見つからない
 *   ときに各 call-site で `detectEachScopeContext` を評価し、全 call-site が一意の
 *   `EachScopeContext` を共有する場合のみ、call-site の `.each(itemParam => ...)` の
 *   itemParam Symbol および helper body 内の同名 Identifier の Symbol を集合に加える。
 *   混在 (`'ambiguous'`) や全 call-site が each 外の場合は helper-aware 経路では
 *   何も追加せず `undefined` を返す (これらは呼び出し側 `tryEnclosingHelperRecovery`
 *   で既に handle されている前提)。
 *
 * @returns each スコープ外、もしくは Symbol 取得不可の場合は `undefined`
 */
export function collectEachScopeParamSymbols(
  onCallExpr: ts.CallExpression,
  checker: ts.TypeChecker,
  options?: { readonly helperCallSites?: readonly ts.CallExpression[] },
): Set<ts.Symbol> | undefined {
  // 1. 直接 enclosing `.each` を AST walk-up で探す (従来挙動)
  let current: ts.Node = onCallExpr;
  while (current.parent !== undefined) {
    current = current.parent;
    if (ts.isArrowFunction(current)) {
      const parent = current.parent;
      if (
        ts.isCallExpression(parent) &&
        ts.isPropertyAccessExpression(parent.expression) &&
        parent.expression.name.text === 'each' &&
        parent.arguments.length >= 1 &&
        parent.arguments[0] === current
      ) {
        const symbols = new Set<ts.Symbol>();
        for (const param of current.parameters) {
          if (ts.isIdentifier(param.name)) {
            const sym = checker.getSymbolAtLocation(param.name);
            if (sym !== undefined) {
              symbols.add(sym);
            }
          }
        }
        return symbols;
      }
      // each 以外の ArrowFunction が先に見つかった → 直接経路では each スコープ外
      // helper-aware 経路に委ねるため break
      break;
    }
  }

  // 2. helper-aware 経路
  const helperCallSites = options?.helperCallSites;
  if (helperCallSites === undefined || helperCallSites.length === 0) {
    return undefined;
  }

  // 全 call-site で一意な EachScopeContext を共有することを確認する。
  // 混在 / each 外 / ambiguous の場合は何も返さない。
  let sharedItemParamName: string | undefined;
  const callSiteEachArrows: ts.ArrowFunction[] = [];
  for (const callSite of helperCallSites) {
    const ctx = detectEachScopeContext(callSite, checker);
    if (ctx === null || ctx === 'ambiguous') {
      return undefined;
    }
    if (sharedItemParamName === undefined) {
      sharedItemParamName = ctx.itemParamName;
    } else if (sharedItemParamName !== ctx.itemParamName) {
      return undefined;
    }
    // call-site の祖先方向に `.each(arrow)` の arrow を探す
    let cur: ts.Node = callSite;
    while (cur.parent !== undefined) {
      cur = cur.parent;
      if (ts.isArrowFunction(cur)) {
        const par = cur.parent;
        if (
          ts.isCallExpression(par) &&
          ts.isPropertyAccessExpression(par.expression) &&
          par.expression.name.text === 'each' &&
          par.arguments.length >= 1 &&
          par.arguments[0] === cur
        ) {
          callSiteEachArrows.push(cur);
        }
        break;
      }
    }
  }

  if (sharedItemParamName === undefined || callSiteEachArrows.length === 0) {
    return undefined;
  }

  const symbols = new Set<ts.Symbol>();

  // (a) 各 call-site の `.each` arrow の itemParam Symbol を追加
  for (const arrow of callSiteEachArrows) {
    for (const param of arrow.parameters) {
      if (ts.isIdentifier(param.name)) {
        const sym = checker.getSymbolAtLocation(param.name);
        if (sym !== undefined) {
          symbols.add(sym);
        }
      }
    }
  }

  // (b) helper body 内の同名 Identifier の Symbol を追加
  //     onCallExpr を内包する helper の本体 (= 最上位の ArrowFunction 祖先) を探し、
  //     その body 配下で `ts.isIdentifier && text === sharedItemParamName` の
  //     Symbol を集める。
  let helperBodyRoot: ts.Node | undefined;
  let cur2: ts.Node = onCallExpr;
  while (cur2.parent !== undefined) {
    cur2 = cur2.parent;
    if (ts.isArrowFunction(cur2)) {
      helperBodyRoot = cur2.body;
      // 最も外側 (= module-level helper の arrow body) まで遡らず、最も内側で十分:
      // helper body 全域を walk するため、まず最初に見つけた ArrowFunction の親方向に
      // 更に ArrowFunction があれば、そちらを優先する。
    }
  }
  if (helperBodyRoot !== undefined) {
    const visit = (n: ts.Node): void => {
      if (ts.isIdentifier(n) && n.text === sharedItemParamName) {
        const sym = checker.getSymbolAtLocation(n);
        if (sym !== undefined) {
          symbols.add(sym);
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(helperBodyRoot);
  }

  if (symbols.size === 0) {
    return undefined;
  }
  return symbols;
}

/**
 * テスト専用エクスポート (TXDX-DX Task 3.1).
 *
 * `collectEachScopeParamSymbols` の単体テスト用に `__test__` プレフィックス付きで
 * 参照可能にする。relocated from index.ts (transformer-index-pipeline-split task 2.1).
 */
export const __test__collectEachScopeParamSymbols = collectEachScopeParamSymbols;

