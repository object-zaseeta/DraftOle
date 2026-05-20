/**
 * whitelist-validator — ルート識別子・構文の検査
 *
 * Task 5.2:
 * - `validateHandler(ir, refs, program, sourceFile, extraWhitelist?)` を export
 * - 各 IdentifierRef を TypeChecker で型判定し `IdentifierKind` に分類
 *   1. state/state-handle: DraftoleStateMarker プロパティの有無で判定
 *   2. event-param: HandlerIR.paramName との一致
 *   3. local: HandlerIR.localDecls との一致
 *   4. builtin: BUILTIN_GLOBALS 照合（console を含む）
 *   5. extraWhitelist: 追加ホワイトリスト識別子
 * - unknown 検出時は ts.Diagnostic error を蓄積（全件走査）
 *
 * Task 5.3:
 * - 二次コールバック再帰検査
 * - .map(inner => ...) / .update(inner => ...) / .each(inner => ...) の
 *   内部 ArrowFunction も同規則で検査
 * - 内部アロー引数は event-param ではなく local として扱う
 *
 * 対応 requirements: 3.1, 3.2, 3.4, 3.5, 3.6
 * 対応 design: whitelist-validator, D-1, D-7
 */

import * as ts from 'typescript';
import type { HandlerIR, IdentifierRef } from './handler-ir-extractor.ts';
import { isBuiltinGlobal, isForbiddenSyntaxKind } from './whitelist-registry';

// ---- 定数 -------------------------------------------------------------------

/**
 * 二次コールバックとして再帰検査するメソッド名。
 * state.map(fn) / state.update(fn) / state.each(fn) の fn を対象とする。
 * また、Array.prototype.filter / find / reduce / forEach / flatMap 等の
 * 一般配列メソッドのコールバックも同規則で扱う（Req 3.1）。
 */
const NESTED_CALLBACK_METHODS = new Set([
  'map', 'update', 'each',
  'filter', 'find', 'findIndex', 'reduce', 'reduceRight',
  'forEach', 'some', 'every', 'flatMap', 'sort',
]);

/**
 * DraftoleStateMarker プロパティ名。
 * state.ts で `declare const DraftoleStateMarker: unique symbol` として定義されており、
 * TypeChecker から getProperty() で存在確認する（Design D-7）。
 *
 * unique symbol は通常プロパティ名で直接検索できないため、
 * 型のプロパティシンボル一覧を走査して `__draftoleStateMarker__` または
 * description に "DraftoleStateMarker" / "draftoleState" を含むシンボルを探す。
 */
const STATE_MARKER_CANDIDATES = [
  '__draftoleStateMarker__',
  'DraftoleStateMarker',
  '_draftoleState',
];

/**
 * 明示的に禁止するグローバル識別子。
 *
 * - `window` / `globalThis` / `global` / `self`: 直接 DOM/Node global へ触らせない
 * - `undefined`: identifier として参照不可（再代入可能で安全な保証ができないため）。
 *   利用側は `=== undefined` の比較ではなく `length === 0` 等の構造的判定に置換する。
 *   値として必要な場合は `void 0` を使う（builtin として許可）。
 */
const FORBIDDEN_GLOBALS = new Set(['window', 'globalThis', 'global', 'self', 'undefined']);

/**
 * Diagnostic エラーコード（DT001）
 */
const DT001_CODE = 9001 as number & { __brand: 'DT001' };

// ---- 禁止構文ラベルマップ -----------------------------------------------------

/**
 * 禁止 SyntaxKind → エラーメッセージ用の人間可読ラベル。
 * PostfixUnaryExpression は ++ / -- のどちらか演算子種別で絞り込む。
 */
const FORBIDDEN_SYNTAX_LABELS = new Map<ts.SyntaxKind, string>([
  [ts.SyntaxKind.AwaitExpression, 'await'],
  [ts.SyntaxKind.YieldExpression, 'yield'],
  [ts.SyntaxKind.PostfixUnaryExpression, 'postfix ++ / --'],
  [ts.SyntaxKind.PrefixUnaryExpression, 'prefix ++ / --'],
  [ts.SyntaxKind.Decorator, 'decorator'],
]);

// ---- ヘルパー ----------------------------------------------------------------

/**
 * TypeChecker の型が DraftoleStateMarker プロパティを持つかを確認する。
 *
 * State<T> / Computed<T> / ScriptStateHandle<T> はすべて
 * `readonly [DraftoleStateMarker]: 'state'` を持つ（Design D-7）。
 *
 * unique symbol プロパティは以下の方法で検出する:
 * 1. 型の全プロパティシンボルを取得
 * 2. 各シンボルの name に STATE_MARKER_CANDIDATES のいずれかを含むか確認
 * 3. または `_runtimeId: string` プロパティを持つかも確認（補助判定）
 */
function hasStateMarker(type: ts.Type, checker: ts.TypeChecker): boolean {
  // アプローチ1: 型のプロパティシンボルを全走査
  const props = type.getProperties();
  for (const prop of props) {
    const name = prop.getName();
    // STATE_MARKER_CANDIDATES との照合
    for (const candidate of STATE_MARKER_CANDIDATES) {
      if (name === candidate || name.includes('DraftoleState') || name.includes('draftoleState')) {
        return true;
      }
    }
    // unique symbol プロパティ: シンボル名に "__draftole" を含む
    if (name.toLowerCase().includes('draftole')) {
      return true;
    }
  }

  // アプローチ2: `_runtimeId` と `get()` を持つ型を State と判定（構造的マーカー補助）
  const runtimeIdProp = type.getProperty('_runtimeId');
  const getProp = type.getProperty('get');
  if (runtimeIdProp !== undefined && getProp !== undefined) {
    // _runtimeId: string かつ get が関数である場合は State とみなす
    const runtimeIdType = checker.getTypeOfSymbolAtLocation(
      runtimeIdProp,
      runtimeIdProp.valueDeclaration ?? runtimeIdProp.declarations?.[0] ?? ({} as ts.Node),
    );
    if ((runtimeIdType.flags & ts.TypeFlags.String) !== 0 ||
        (runtimeIdType.flags & ts.TypeFlags.StringLiteral) !== 0) {
      return true;
    }
  }

  // アプローチ3: 型名に State / Computed / StateHandle を含む
  const typeName = checker.typeToString(type);
  if (
    typeName.includes('State<') ||
    typeName.includes('Computed<') ||
    typeName.includes('StateHandle<') ||
    typeName.includes('ReadableState<')
  ) {
    return true;
  }

  return false;
}

/**
 * ts.Diagnostic error を生成するヘルパー。
 */
function createErrorDiagnostic(
  node: ts.Node,
  messageText: string,
  sourceFile: ts.SourceFile,
): ts.Diagnostic {
  const start = node.getStart(sourceFile, false);
  const length = node.getWidth(sourceFile);
  return {
    file: sourceFile,
    start,
    length,
    messageText,
    category: ts.DiagnosticCategory.Error,
    code: DT001_CODE,
    source: 'draftole-transformer',
  };
}

/**
 * 識別子が event-param かどうかを判定する。
 */
function isEventParam(name: string, ir: HandlerIR): boolean {
  return ir.paramName !== null && name === ir.paramName;
}

/**
 * 識別子が local かどうかを判定する。
 */
function isLocal(name: string, ir: HandlerIR): boolean {
  return ir.localDecls.has(name);
}

/**
 * ノードが二次コールバック呼び出し（state.map/update/each の ArrowFunction 引数）
 * かどうかを確認し、該当する ArrowFunction を返す。
 *
 * 例: `myState.map(inner => inner + 1)` → `inner => inner + 1` を返す
 */
function findNestedCallbackArrow(
  node: ts.Node,
): ts.ArrowFunction | undefined {
  // CallExpression かどうか確認
  if (!ts.isCallExpression(node)) return undefined;
  const callExpr = node;

  // メソッドアクセス（obj.method(...)）か確認
  const expr = callExpr.expression;
  if (!ts.isPropertyAccessExpression(expr)) return undefined;

  // メソッド名が map/update/each か確認
  const methodName = expr.name.text;
  if (!NESTED_CALLBACK_METHODS.has(methodName)) return undefined;

  // 引数リストに ArrowFunction が含まれるか確認（最初の引数を対象）
  for (const arg of callExpr.arguments) {
    if (ts.isArrowFunction(arg)) {
      return arg;
    }
  }

  return undefined;
}

/**
 * 指定ノードが outerArrow 内の .map/.update/.each コールバック ArrowFunction の
 * 内部（その body または parameters の子孫）に属するかを確認する。
 * 属する場合、ネストされた ArrowFunction を返す（外側の検査でスキップするため）。
 */
function findEnclosingNestedArrow(
  node: ts.Node,
  outerArrow: ts.ArrowFunction,
): ts.ArrowFunction | undefined {
  // outerArrow 本体全体を走査して .map/.update/.each(Arrow) パターンを収集
  const nestedArrows: ts.ArrowFunction[] = [];

  function collectNested(n: ts.Node): void {
    const found = findNestedCallbackArrow(n);
    if (found !== undefined) {
      nestedArrows.push(found);
      // found の内部はさらに深いネストとして別途収集しない（ここでは1段のみ）
      return;
    }
    ts.forEachChild(n, collectNested);
  }
  collectNested(outerArrow.body);

  // node がいずれかの nestedArrow の子孫かを確認
  for (const nestedArrow of nestedArrows) {
    if (isDescendantOf(node, nestedArrow)) {
      return nestedArrow;
    }
  }
  return undefined;
}

/**
 * target が ancestor の子孫ノードかを確認する。
 */
function isDescendantOf(target: ts.Node, ancestor: ts.Node): boolean {
  let current: ts.Node | undefined = target;
  while (current !== undefined) {
    if (current === ancestor) return true;
    current = current.parent;
  }
  return false;
}

/**
 * ArrowFunction の仮引数名リストを返す。
 */
function getArrowParamNames(arrowFn: ts.ArrowFunction): string[] {
  return arrowFn.parameters.map((p) => {
    if (ts.isIdentifier(p.name)) {
      return p.name.text;
    }
    return '';
  }).filter((n) => n.length > 0);
}

/**
 * 内部アロー関数の識別子を収集する（内部アロー自身のネストは含めない）。
 * collectRefs と同様のロジックだが、inner arrow の body のみを対象にする。
 */
function collectNestedRefs(
  arrowFn: ts.ArrowFunction,
  checker: ts.TypeChecker,
  outerSeen: Set<string>,
): IdentifierRef[] {
  const refs: IdentifierRef[] = [];
  const seen = new Set<string>(outerSeen);

  function collect(node: ts.Node): void {
    // 内部にさらに ArrowFunction がある場合は再帰しない（別途処理）
    if (ts.isArrowFunction(node) && node !== arrowFn) return;

    if (ts.isIdentifier(node)) {
      const parent = node.parent;
      if (ts.isPropertyAccessExpression(parent) && parent.name === node) return;
      if (ts.isPropertyAssignment(parent) && parent.name === node) return;

      const name = node.text;
      if (seen.has(name)) return;
      seen.add(name);

      const symbol = checker.getSymbolAtLocation(node);
      refs.push({ name, node, symbol, kind: { tag: 'unknown' } });
      return;
    }
    ts.forEachChild(node, collect);
  }

  // 仮引数を収集
  for (const param of arrowFn.parameters) {
    collect(param.name);
  }
  // 本体を収集
  collect(arrowFn.body);

  return refs;
}

// ---- 禁止構文ウォーカー -------------------------------------------------------

/**
 * ハンドラ本体 AST を走査し、FORBIDDEN_SYNTAX に該当するノードに対して
 * ts.Diagnostic error を生成する（Req 4.8）。
 *
 * - AwaitExpression / YieldExpression: 無条件禁止
 * - PostfixUnaryExpression: 演算子が ++ / -- のときのみ禁止
 * - PrefixUnaryExpression:  演算子が ++ / -- のときのみ禁止（! や - は許可）
 *
 * @param handlerBody   ハンドラの ArrowFunction の body ノード
 * @param sourceFile    対象ソースファイル（診断情報の位置用）
 * @param diagnostics   結果を蓄積する配列（破壊的追加）
 */
function validateForbiddenSyntax(
  handlerBody: ts.Node,
  sourceFile: ts.SourceFile,
  diagnostics: ts.Diagnostic[],
): void {
  function visit(node: ts.Node): void {
    if (!isForbiddenSyntaxKind(node.kind)) {
      ts.forEachChild(node, visit);
      return;
    }

    // PostfixUnaryExpression / PrefixUnaryExpression は ++ / -- のみ禁止
    if (
      node.kind === ts.SyntaxKind.PostfixUnaryExpression ||
      node.kind === ts.SyntaxKind.PrefixUnaryExpression
    ) {
      const unary = node as ts.PostfixUnaryExpression | ts.PrefixUnaryExpression;
      const op = unary.operator;
      if (
        op !== ts.SyntaxKind.PlusPlusToken &&
        op !== ts.SyntaxKind.MinusMinusToken
      ) {
        // ! や - は許可 → 子ノードを継続走査
        ts.forEachChild(node, visit);
        return;
      }
      const opText = op === ts.SyntaxKind.PlusPlusToken ? '++' : '--';
      const isPostfix = node.kind === ts.SyntaxKind.PostfixUnaryExpression;
      const label = isPostfix ? `postfix ${opText}` : `prefix ${opText}`;
      diagnostics.push(
        createErrorDiagnostic(
          node,
          `DraftOle DT001: Forbidden syntax '${label}' is not allowed in DraftOle handlers. ` +
            `Use state.update(fn) or state.set(state.get() ${opText === '++' ? '+ 1' : '- 1'}) instead. See docs/api/handler-serialization.md`,
          sourceFile,
        ),
      );
      ts.forEachChild(node, visit);
      return;
    }

    // AwaitExpression / YieldExpression / Decorator: 無条件禁止
    const label = FORBIDDEN_SYNTAX_LABELS.get(node.kind) ?? ts.SyntaxKind[node.kind];
    const detail =
      node.kind === ts.SyntaxKind.Decorator
        ? 'Decorators are not serializable.'
        : 'async/await and yield are not serializable.';
    diagnostics.push(
      createErrorDiagnostic(
        node,
        `DraftOle DT001: Forbidden syntax '${label}' is not allowed in DraftOle handlers. ` +
          `${detail} See docs/api/handler-serialization.md`,
        sourceFile,
      ),
    );
    ts.forEachChild(node, visit);
  }

  visit(handlerBody);
}

// ---- メイン実装 -------------------------------------------------------------

/**
 * `validateHandler` の任意オプション。
 *
 * Task 3.3 (TXDX-DX):
 *   - `paramSymbols` を helper-aware な each-scope param Symbol 集合として受け取り、
 *     `checker.getSymbolAtLocation(node)` が当該集合に含まれる識別子は
 *     each-scope 内参照として許可する。
 *   - helper 経由で `.each(item => helper())` の helper body 内 `item.set(...)` を
 *     unknown 識別子として誤拒否しないために使用する。
 *   - 直接 enclosing `.each` 経路でも同じ集合 (call-site の itemParam Symbol) を渡す
 *     ことで分岐ロジックを統一する。
 *   - 集合は inner-callback 再帰 (`.map/.update/.each` の内側 ArrowFunction) にも
 *     継承される (helper-aware case (b) を inner-callback 内で誤拒否させない)。
 */
export interface ValidateHandlerOptions {
  /** helper-aware で構築された each-scope param Symbol 集合 (Task 3.3) */
  readonly paramSymbols?: ReadonlySet<ts.Symbol>;
}

/**
 * ハンドラ内の識別子参照リストを検証し、unknown な識別子に対して
 * `ts.Diagnostic` エラーを返す。
 *
 * - IdentifierRef の各要素を順番に判定する（全件走査）
 * - unknown 検出時は即終了せず蓄積して全件返す（Req 2.7）
 *
 * @param ir            HandlerIR（paramName / localDecls を使用）
 * @param refs          collectIdentifiers が返した IdentifierRef[]
 * @param program       ts.Program（TypeChecker 取得に使用）
 * @param sourceFile    対象ソースファイル（診断情報の位置用）
 * @param extraWhitelist 追加ホワイトリスト識別子（DraftoleTransformerOptions.extraWhitelist）
 * @param options       任意オプション (Task 3.3: helper-aware paramSymbols 等)
 * @returns             unknown 識別子に対する ts.Diagnostic[]（PASS なら空配列）
 */
export function validateHandler(
  ir: HandlerIR,
  refs: IdentifierRef[],
  program: ts.Program,
  sourceFile: ts.SourceFile,
  extraWhitelist?: readonly string[],
  options?: ValidateHandlerOptions,
): ts.Diagnostic[] {
  const checker = program.getTypeChecker();
  const diagnostics: ts.Diagnostic[] = [];
  const extra = new Set<string>(extraWhitelist ?? []);
  const paramSymbols = options?.paramSymbols;

  // ---- 禁止構文チェック (Req 4.8) -------------------------------------------
  validateForbiddenSyntax(ir.node.body, sourceFile, diagnostics);

  for (const ref of refs) {
    const { name, node } = ref;

    // ---- 0. nested callback scope ----------------------------------------
    // refs が外部から収集されていて nested arrow 内の識別子を含む場合、
    // その識別子は nested validator が処理するためここでスキップする。
    if (findEnclosingNestedArrow(node, ir.node) !== undefined) {
      continue;
    }

    // ---- 1. event-param --------------------------------------------------
    if (isEventParam(name, ir)) {
      continue;
    }

    // ---- 1b. helper-aware each-scope param Symbol (Task 3.3) -------------
    // helper 経由で `.each(item => helper())` の helper body 内に現れる `item` 等は
    // 通常 `event-param` / `local` / `builtin` のいずれにも該当せず、また
    // `getTypeAtLocation` も State<T> 系として解決されないため、従来は
    // unknown 識別子として誤拒否されていた。
    // `tryEnclosingHelperRecovery` が helper-aware に構築した paramSymbols 集合
    // (call-site `.each(itemParam)` の Symbol + helper body 内同名 Identifier の
    // Symbol) と一致する場合は each-scope 内参照として許可する。
    if (paramSymbols !== undefined && paramSymbols.size > 0) {
      const sym = checker.getSymbolAtLocation(node);
      if (sym !== undefined && paramSymbols.has(sym)) {
        continue;
      }
    }

    // ---- 2. local --------------------------------------------------------
    if (isLocal(name, ir)) {
      continue;
    }

    // ---- 3. builtin (BUILTIN_GLOBALS + console) --------------------------
    if (isBuiltinGlobal(name)) {
      continue;
    }

    // ---- 4. extraWhitelist -----------------------------------------------
    if (extra.has(name)) {
      continue;
    }

    // ---- 5. FORBIDDEN_GLOBALS (window / globalThis / undefined / ...) -----
    if (FORBIDDEN_GLOBALS.has(name)) {
      const hint = name === 'undefined'
        ? `Use structural checks (e.g., 'arr.length === 0', '.includes(x)') or 'void 0' literal instead of '=== undefined' comparisons.`
        : `Use state API or event parameters instead.`;
      diagnostics.push(
        createErrorDiagnostic(
          node,
          `DraftOle DT001: Identifier '${name}' is forbidden in DraftOle handlers. ` +
            `${hint} See docs/api/handler-serialization.md`,
          sourceFile,
        ),
      );
      continue;
    }

    // ---- 6. State/Computed/ScriptStateHandle 型判定 (TypeChecker) --------
    const type = checker.getTypeAtLocation(node);
    if (hasStateMarker(type, checker)) {
      // State 系型と判定: 許可
      continue;
    }

    // ---- 7. unknown → エラー蓄積 -----------------------------------------
    diagnostics.push(
      createErrorDiagnostic(
        node,
        `DraftOle DT001: Identifier '${name}' is not allowed in DraftOle handlers. ` +
          `Only state API references, event parameters, local declarations, and built-ins are permitted. ` +
          `If '${name}' is a state, declare it via 'root.state(...)'. See docs/api/handler-serialization.md`,
        sourceFile,
      ),
    );
  }

  // ---- 二次コールバック再帰検査 (Req 3.5) ------------------------------------
  // outer ハンドラの AST ノードを走査して .map/.update/.each(ArrowFunction) を探し、
  // 内部アローを同じホワイトリスト規則で再帰検査する。
  // 内部アロー引数は event-param ではなく local として扱う。
  // Task 3.3: helper-aware paramSymbols は inner-callback 再帰にも伝播する。
  validateNestedCallbacks(ir, program, sourceFile, extra, diagnostics, checker, paramSymbols);

  return diagnostics;
}

/**
 * outer ハンドラの AST 全体を走査し、
 * .map/.update/.each(ArrowFunction) パターンを見つけて再帰検査する。
 *
 * @param ir            outer HandlerIR（paramName / localDecls を含む）
 * @param program       ts.Program
 * @param sourceFile    対象ソースファイル
 * @param extra         extraWhitelist の Set
 * @param diagnostics   結果を蓄積する配列（破壊的追加）
 * @param checker       TypeChecker
 */
function validateNestedCallbacks(
  ir: HandlerIR,
  program: ts.Program,
  sourceFile: ts.SourceFile,
  extra: Set<string>,
  diagnostics: ts.Diagnostic[],
  checker: ts.TypeChecker,
  paramSymbols: ReadonlySet<ts.Symbol> | undefined,
): void {
  function visitNode(node: ts.Node): void {
    // .map/.update/.each(ArrowFunction) パターンを検出
    const nestedArrow = findNestedCallbackArrow(node);
    if (nestedArrow !== undefined) {
      // 内部アローのパラメータ名を収集して local として追加
      const innerParamNames = getArrowParamNames(nestedArrow);

      // outer の localDecls + event-param + inner params を合わせた localDecls を作成
      const innerLocalDecls = new Set<string>(ir.localDecls);
      if (ir.paramName !== null) {
        innerLocalDecls.add(ir.paramName);
      }
      for (const paramName of innerParamNames) {
        innerLocalDecls.add(paramName);
      }

      // 内部アロー用の HandlerIR（paramName は null、inner params は全て local 扱い）
      const innerIR: HandlerIR = {
        node: nestedArrow,
        paramName: null,
        paramTypeText: null,
        localDecls: innerLocalDecls,
        referencedIdentifiers: [],
        isExpressionBody: !ts.isBlock(nestedArrow.body),
      };

      // 内部アローの識別子を収集（既に outer で見た識別子も再チェックする）
      const innerRefs = collectNestedRefs(nestedArrow, checker, new Set<string>());

      // 内部アローを同規則で検査（diagnostics に直接追加）
      // Task 3.3: helper-aware paramSymbols を inner-callback にも伝播する。
      //   helper 経由 each-scope の `item` Symbol が、inner `.map(inner => item...)`
      //   等の中で参照されても誤拒否されないようにするため。
      const innerDiags = validateHandler(
        innerIR,
        innerRefs,
        program,
        sourceFile,
        [...extra],
        { paramSymbols },
      );
      for (const d of innerDiags) {
        diagnostics.push(d);
      }

      // 内部アロー自体のさらなるネストは validateHandler 内の再帰呼び出しが処理するため、
      // ここでは内部アローの子ノードを再帰的に visitNode しない
      return;
    }

    ts.forEachChild(node, visitNode);
  }

  // outer ハンドラ本体を走査
  visitNode(ir.node.body);
}
