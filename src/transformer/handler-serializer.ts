/**
 * handler-serializer: `HandlerIR` + `stateIdMap` → `SerializedHandler { code, params }`
 *
 * Task 6.1:
 * - `HandlerIR` と `stateIdMap: Map<ts.Symbol, string>` を受け取り、
 *   ハンドラ本体のアロー関数を `__draftole__.state("<runtimeId>")...` 形式の JS 文字列に変換する
 * - `ts.transform` + 自家製 visitor で識別子を PropertyAccess 連鎖に置換
 * - 最終 JS は `ts.createPrinter()` で emit（型注釈は tsc が自動除去）
 * - 式本体アロー (`() => expr`) もブロック本体 (`() => { ... }`) も同一 IR で処理
 *
 * 対応 requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.9
 * 対応 design: handler-serializer, D-8
 */

import * as ts from 'typescript';
import type { HandlerIR } from './handler-ir-extractor.ts';

// ---- 公開型 ------------------------------------------------------------------

/**
 * serializeHandler の入力
 */
export interface HandlerSerializerInput {
  /** 抽出済み HandlerIR */
  readonly ir: HandlerIR;
  /** State シンボル → _runtimeId 文字列 のマップ */
  readonly stateIdMap: Map<ts.Symbol, string>;
  /**
   * each スコープのパラメータ識別子名 → ランタイム変数名 のマップ。
   * `.each()` 内ハンドラで `item.get()` などを `__draftole__.state(itemId).get()` に変換するために使用。
   * Identifier 引数（非 StringLiteral）で state() を生成する点が stateIdMap と異なる。
   */
  readonly eachScopeParams?: Map<string, string>;
  /**
   * モジュールレベルのゼロ引数アロー関数をインライン展開するマップ。
   * `addTodo()` のような呼び出しをハンドラ直書きコードに変換するために使用。
   */
  readonly inlineMap?: ReadonlyMap<string, ts.ArrowFunction>;
}

/**
 * serializeHandler の出力
 */
export interface SerializedHandler {
  /** 変換後の JS コード文字列（ハンドラ本体相当） */
  readonly code: string;
  /** イベントリスナ関数の仮引数名リスト（e.g. ["e"] or []） */
  readonly params: readonly string[];
}

// ---- ランタイム API 名 -------------------------------------------------------

/** ランタイムグローバル名 */
const RUNTIME_GLOBAL = '__draftole__';

/** state() メソッド名 */
const RUNTIME_STATE_METHOD = 'state';

// ---- ヘルパー ----------------------------------------------------------------

/**
 * `__draftole__.state("<runtimeId>")` の CallExpression を生成する。
 *
 * 生成 AST:
 *   __draftole__.state("<runtimeId>")
 * = CallExpression(
 *     PropertyAccessExpression(Identifier("__draftole__"), "state"),
 *     [StringLiteral("<runtimeId>")]
 *   )
 */
function createStateCall(runtimeId: string, factory: ts.NodeFactory): ts.CallExpression {
  const draftoleIdent = factory.createIdentifier(RUNTIME_GLOBAL);
  const stateAccess = factory.createPropertyAccessExpression(
    draftoleIdent,
    factory.createIdentifier(RUNTIME_STATE_METHOD),
  );
  return factory.createCallExpression(
    stateAccess,
    /* typeArgs */ undefined,
    [factory.createStringLiteral(runtimeId)],
  );
}

/**
 * `__draftole__.state(paramVar)` の CallExpression を生成する。
 *
 * `createStateCall` との違い: 引数が StringLiteral ではなく Identifier である。
 * `.each()` 内ハンドラで `item` のような each スコープパラメータを動的に解決するために使用する。
 *
 * 生成 AST:
 *   __draftole__.state(itemId)
 * = CallExpression(
 *     PropertyAccessExpression(Identifier("__draftole__"), "state"),
 *     [Identifier(paramVar)]  ← StringLiteral ではない
 *   )
 *
 * @param paramVar ランタイム変数名（例: "itemId"）
 * @param factory  ts.NodeFactory
 */
function createDynamicStateCall(paramVar: string, factory: ts.NodeFactory): ts.CallExpression {
  const draftoleIdent = factory.createIdentifier(RUNTIME_GLOBAL);
  const stateAccess = factory.createPropertyAccessExpression(
    draftoleIdent,
    factory.createIdentifier(RUNTIME_STATE_METHOD),
  );
  return factory.createCallExpression(
    stateAccess,
    /* typeArgs */ undefined,
    [factory.createIdentifier(paramVar)],
  );
}

/**
 * stateIdMap から「識別子名 → runtimeId」のシンプルなマップを構築する。
 * whitelist-validator によって事前チェック済みの識別子のみが変換対象となるため、
 * 名前ベースの照合で十分。
 */
function buildNameMap(stateIdMap: Map<ts.Symbol, string>): Map<string, string> {
  const nameMap = new Map<string, string>();
  for (const [sym, runtimeId] of stateIdMap) {
    nameMap.set(sym.getName(), runtimeId);
  }
  return nameMap;
}

/**
 * ArrowFunction の内部アロー（二次コールバック）を function 式に変換するノードファクトリ。
 *
 * `state.update(t => expr)` の `t => expr` を
 * `function(t) { return expr; }` に変換する（Req 4.3, D-8）。
 */
function arrowToFunctionExpression(
  arrow: ts.ArrowFunction,
  factory: ts.NodeFactory,
  visitor: ts.Visitor,
  context: ts.TransformationContext,
): ts.FunctionExpression {
  // パラメータを変換（型注釈を除去するため visitEachChild を通す）
  const transformedParams = arrow.parameters.map((p) =>
    ts.visitEachChild(p, visitor, context),
  );

  // 本体を変換
  let block: ts.Block;
  if (ts.isBlock(arrow.body)) {
    const transformedBlock = ts.visitEachChild(arrow.body, visitor, context) as ts.Block;
    block = transformedBlock;
  } else {
    // 式本体 → return 文に変換してから再帰的に visitor を適用
    const transformedExpr = ts.visitNode(arrow.body, visitor) as ts.Expression;
    block = factory.createBlock(
      [factory.createReturnStatement(transformedExpr)],
      /* multiline */ true,
    );
  }

  return factory.createFunctionExpression(
    /* modifiers */ undefined,
    /* asteriskToken */ undefined,
    /* name */ undefined,
    /* typeParams */ undefined,
    transformedParams,
    /* returnType */ undefined,
    block,
  );
}

// ---- visitor ----------------------------------------------------------------

/**
 * ハンドラ本体を走査し、state 識別子を `__draftole__.state(id)` に置換する visitor を返す。
 *
 * 置換ルール（design §handler-serializer 変換規則表）:
 * - `stateIdent` (stateIdMap に名前が含まれる) → `__draftole__.state("<runtimeId>")`
 * - PropertyAccessExpression の name 側（右辺）は置換対象外
 * - ArrowFunction（内部アロー: outerArrow と異なる）→ function 式に変換
 * - ExpressionStatement のゼロ引数呼び出しで inlineMap に含まれる → 本体をインライン展開
 * - その他ノードは再帰的に走査
 *
 * @param nameMap    識別子名 → runtimeId のマップ
 * @param outerArrow 外側の ArrowFunction（これ自体は変換対象外）
 * @param context    ts.TransformationContext
 * @param inlineMap  ゼロ引数モジュールレベル関数インライン展開マップ（省略可）
 */
function createStateReplacingVisitor(
  nameMap: Map<string, string>,
  outerArrow: ts.ArrowFunction,
  context: ts.TransformationContext,
  inlineMap?: ReadonlyMap<string, ts.ArrowFunction>,
  eachScopeParams?: Map<string, string>,
): ts.Visitor {
  const factory = context.factory;

  function visitor(node: ts.Node): ts.Node | ts.Node[] {
    // ---- ゼロ引数モジュールレベル関数呼び出しをインライン展開 ----------------
    // `addTodo()` のような ExpressionStatement を関数本体のステートメントで置換する。
    // Block 内の Statement ノードに対してのみ適用（visitEachChild が配列を処理）。
    if (inlineMap !== undefined && ts.isExpressionStatement(node)) {
      const expr = node.expression;
      if (
        ts.isCallExpression(expr) &&
        ts.isIdentifier(expr.expression) &&
        expr.arguments.length === 0
      ) {
        const funcArrow = inlineMap.get(expr.expression.text);
        if (funcArrow !== undefined && ts.isBlock(funcArrow.body)) {
          // インライン展開: 関数本体の各ステートメントを visitor で変換して返す
          return funcArrow.body.statements.map(
            (s) => ts.visitEachChild(s, visitor, context) as ts.Statement,
          );
        }
      }
    }

    // ---- ArrowFunction（内部アロー）を function 式に変換 --------------------
    // outerArrow 自体は変換しない（body だけを変換する）
    if (ts.isArrowFunction(node) && node !== outerArrow) {
      return arrowToFunctionExpression(node, factory, visitor, context);
    }

    // ---- TypeScript 型アサーション（`expr as T`）を除去 ----------------------
    // シリアライズ後のコードは JavaScript として評価されるため型アサーションを除去する。
    if (ts.isAsExpression(node)) {
      return ts.visitNode(node.expression, visitor) as ts.Expression;
    }
    // `<T>expr` 形式の型アサーションも除去（古い TS 記法）
    if (ts.isTypeAssertionExpression(node)) {
      return ts.visitNode(node.expression, visitor) as ts.Expression;
    }

    // ---- Identifier の置換 --------------------------------------------------
    if (ts.isIdentifier(node)) {
      // PropertyAccessExpression の name 側（右辺）はスキップ
      // 例: `count.get()` の `get` は変換しない
      const parent = node.parent;
      if (
        ts.isPropertyAccessExpression(parent) &&
        parent.name === node
      ) {
        return node;
      }

      // each スコープパラメータなら Identifier 引数で動的置換（nameMap より先に評価）
      const dynamicParamVar = eachScopeParams?.get(node.text);
      if (dynamicParamVar !== undefined) {
        return createDynamicStateCall(dynamicParamVar, factory);
      }

      // stateIdMap に含まれる名前なら置換
      const runtimeId = nameMap.get(node.text);
      if (runtimeId !== undefined) {
        return createStateCall(runtimeId, factory);
      }

      return node;
    }

    // ---- TypeAssertion / AsExpression: 型注釈を除去 -------------------------
    // `(e.target as HTMLInputElement)` → `(e.target)` ではなく、
    // TypeScript Printer が --target ES2019 では as 式のまま出力するため
    // ここでは変換せず、Printer の emitFlags に任せる。
    // (型注釈除去は本来 tsc の仕事: TypeScript の transform emit でのみ除去される)

    // ---- その他ノード: 再帰的に走査 -----------------------------------------
    return ts.visitEachChild(node, visitor, context);
  }

  return visitor;
}

// ---- emit ヘルパー -----------------------------------------------------------

/**
 * 変換済みの Statement[] を結合して JS コード文字列を返す。
 */
function printStatements(
  statements: readonly ts.Statement[],
  sourceFile: ts.SourceFile,
  printer: ts.Printer,
): string {
  return statements
    .map((stmt) => printer.printNode(ts.EmitHint.Unspecified, stmt, sourceFile))
    .join('\n');
}

// ---- メイン実装 -------------------------------------------------------------

/**
 * `HandlerIR` と `stateIdMap` からハンドラ本体を `SerializedHandler` に変換する。
 *
 * - `ts.transform` + 自家製 visitor で識別子を `__draftole__.state(id)...` 連鎖に置換
 * - `ts.createPrinter()` で JS として emit（型注釈は TypeScript が自動除去）
 * - 識別子の置換対象: stateIdMap に Symbol が含まれる Identifier ノード
 *
 * @param input HandlerSerializerInput
 * @returns SerializedHandler
 */
export function serializeHandler(input: HandlerSerializerInput): SerializedHandler {
  const { ir, stateIdMap } = input;

  // ---- params の決定 (Req 4.4) -----------------------------------------------
  const params: string[] = ir.paramName !== null ? [ir.paramName] : [];

  // ---- 準備 -------------------------------------------------------------------
  const arrowFn = ir.node;
  const sourceFile = arrowFn.getSourceFile();
  const nameMap = buildNameMap(stateIdMap);

  // ---- ts.transform で AST 変換 -----------------------------------------------
  // ArrowFunction の body を含む SourceFile を transform する。
  // visitor は body 内のノードのみを実質的に書き換える（outerArrow の body から走査）。

  const transformResult = ts.transform<ts.SourceFile>(
    sourceFile,
    [
      (context: ts.TransformationContext): ts.Transformer<ts.SourceFile> => {
        const visitor = createStateReplacingVisitor(nameMap, arrowFn, context, input.inlineMap, input.eachScopeParams);

        return (sf: ts.SourceFile): ts.SourceFile => {
          // SourceFile 全体を走査するが、変換対象は arrowFn 内のノードのみ
          return ts.visitEachChild(sf, visitor, context) as ts.SourceFile;
        };
      },
    ],
    {
      target: ts.ScriptTarget.ES2019,
      module: ts.ModuleKind.CommonJS,
    },
  );

  const transformedSf = transformResult.transformed[0];

  // ---- 変換後の ArrowFunction を探す -----------------------------------------
  // 変換後 SourceFile から元の arrowFn に対応するノードを探す。
  // transform は元のノードと対応する変換後ノードを返すが、
  // visitEachChild は新しいノードを作成するため pos は保持しない。
  // 代わりに、元の arrowFn の pos/end と合致するノードを探す。

  let transformedArrow: ts.ArrowFunction | undefined;
  const targetPos = arrowFn.pos;
  const targetEnd = arrowFn.end;

  function findTransformedArrow(node: ts.Node): void {
    if (
      ts.isArrowFunction(node) &&
      node.pos === targetPos &&
      node.end === targetEnd
    ) {
      transformedArrow = node;
      return;
    }
    // 変換で pos が変わった場合のフォールバック: 最初の ArrowFunction
    ts.forEachChild(node, findTransformedArrow);
  }

  findTransformedArrow(transformedSf);

  // pos/end で見つからない場合、変換後の SourceFile 内の最初の ArrowFunction を使う
  // （変換によって pos が変わることがある）
  if (transformedArrow === undefined) {
    function findFirstArrow(node: ts.Node): void {
      if (transformedArrow !== undefined) return;
      if (ts.isArrowFunction(node)) {
        transformedArrow = node;
        return;
      }
      ts.forEachChild(node, findFirstArrow);
    }
    findFirstArrow(transformedSf);
  }

  transformResult.dispose();

  // ---- emit -------------------------------------------------------------------
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    omitTrailingSemicolon: false,
    removeComments: false,
  });

  // 変換後の ArrowFunction が見つからなかった場合はエラー
  if (transformedArrow === undefined) {
    throw new Error('[handler-serializer] Failed to locate transformed ArrowFunction');
  }

  let code: string;
  if (ir.isExpressionBody) {
    // 式本体: body expression を直接 emit
    const bodyExpr = transformedArrow.body as ts.Expression;
    code = printer.printNode(
      ts.EmitHint.Expression,
      bodyExpr,
      transformedSf,
    );
  } else {
    // ブロック本体: 各 statement を emit して結合
    const block = transformedArrow.body as ts.Block;
    code = printStatements(block.statements, transformedSf, printer);
  }

  return { code, params };
}
