/**
 * state-id-resolver.ts
 *
 * State/Computed 型の識別と _runtimeId 文字列リテラルの抽出ユーティリティ。
 *
 * Task 1.1: state-id-resolver.ts の新規作成
 * Task 2.2: canonical 経路への純化（フォールバック責務の完全分離）。
 *           - `buildSourceStateNameMap` の再エクスポートを削除
 *           - `buildStateIdMap` を `StateIdFallback` 注入式に変更
 *           - 戻り値を `StateIdResolution`（stateIdMap + unresolved）に拡張
 *
 * 公開 API:
 *   - isStateTypeNode(node, checker): State/Computed 型ノードを判定する型ガード
 *   - resolveStateIdByType(identNode, checker): _runtimeId の文字列リテラル値を返す
 *   - buildStateIdMap(arrowFn, checker, options?): StateIdResolution
 */

import * as ts from 'typescript';
import type { StateIdFallback } from './state-id-fallback';

/**
 * `buildStateIdMap` の戻り値。
 *
 * - `stateIdMap`: 解決済み Symbol → ランタイム ID のマップ
 * - `unresolved`: canonical/フォールバック双方で解決できなかった State 型の Symbol →
 *                 代表 Identifier ノードのマップ（同一 Symbol が複数回参照された場合は
 *                 最初に出現した Identifier を代表とする）
 */
export interface StateIdResolution {
  readonly stateIdMap: Map<ts.Symbol, string>;
  readonly unresolved: ReadonlyMap<ts.Symbol, ts.Identifier>;
}

/**
 * `buildStateIdMap` のオプション。
 *
 * - `fallback`: canonical 経路（型リテラル）が null を返した場合に試みる補助経路。
 *               未指定の場合、canonical 経路のみで動作する。
 * - `eachScopeParamSymbols`: each スコープのパラメータ Symbol 集合。
 *                            この集合に含まれる Symbol は unresolved への登録を
 *                            silently skip する（TRANS-2 の責務範囲）。
 */
export interface BuildStateIdMapOptions {
  readonly fallback?: StateIdFallback;
  readonly eachScopeParamSymbols?: ReadonlySet<ts.Symbol>;
}

/**
 * ノードの型が State/Computed の構造的マーカーを持つか判定する。
 *
 * `_runtimeId: string` または `_runtimeId: StringLiteral` と `get()` を
 * 両方持つ型を State/Computed と判定する。
 *
 * @param node     検査対象のノード
 * @param checker  TypeChecker
 * @returns        State/Computed 型であれば true
 */
export function isStateTypeNode(node: ts.Node, checker: ts.TypeChecker): boolean {
  const type = checker.getTypeAtLocation(node);
  const runtimeIdProp = type.getProperty('_runtimeId');
  const getProp = type.getProperty('get');
  if (runtimeIdProp === undefined || getProp === undefined) return false;
  const declNode = runtimeIdProp.valueDeclaration ?? runtimeIdProp.declarations?.[0];
  if (declNode === undefined) return false;
  const propType = checker.getTypeOfSymbolAtLocation(runtimeIdProp, declNode);
  return (propType.flags & (ts.TypeFlags.String | ts.TypeFlags.StringLiteral)) !== 0;
}

/**
 * アロー関数本体内で参照されている State/Computed 変数のシンボル → ランタイム ID マップを構築する。
 *
 * 解決優先順:
 * 1. `resolveStateIdByType` で `_runtimeId` の文字列リテラル型を取得（canonical）
 * 2. `options.fallback?.resolve(node)` を呼び出し補助経路で解決
 * 3. 上記いずれも null かつ `isStateTypeNode` が true の場合、`unresolved` に登録
 *    （ただし `options.eachScopeParamSymbols` に含まれる Symbol は silently skip）
 *
 * 同一 Symbol が複数回参照された場合、最初に出現した Identifier が `unresolved` の
 * 代表ノードとして採用される（1 Symbol につき 1 エントリ）。
 *
 * @param arrowFn  対象のアロー関数
 * @param checker  TypeChecker
 * @param options  オプション（フォールバック・each スコープ Symbol 集合）
 * @returns        解決済みマップと未解決 Symbol マップ
 */
export function buildStateIdMap(
  arrowFn: ts.ArrowFunction,
  checker: ts.TypeChecker,
  options?: BuildStateIdMapOptions,
): StateIdResolution {
  const stateIdMap = new Map<ts.Symbol, string>();
  const unresolved = new Map<ts.Symbol, ts.Identifier>();
  const seen = new Set<ts.Symbol>();

  const fallback = options?.fallback;
  const eachScopeParamSymbols = options?.eachScopeParamSymbols;

  function visit(node: ts.Node): void {
    if (ts.isIdentifier(node)) {
      // PropertyAccessExpression の name 側（右辺）はスキップ
      const parent = node.parent;
      if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
        return;
      }

      const symbol = checker.getSymbolAtLocation(node);
      if (symbol !== undefined && !seen.has(symbol)) {
        seen.add(symbol);

        // 1. canonical: 文字列リテラル型から取得
        let runtimeId = resolveStateIdByType(node, checker);

        // 2. fallback: 注入された StateIdFallback で補助解決
        if (runtimeId === null && fallback !== undefined) {
          runtimeId = fallback.resolve(node);
        }

        if (runtimeId !== null) {
          stateIdMap.set(symbol, runtimeId);
        } else if (isStateTypeNode(node, checker)) {
          // 3. each スコープのパラメータは silently skip
          if (eachScopeParamSymbols?.has(symbol) === true) {
            // skip
          } else if (!unresolved.has(symbol)) {
            unresolved.set(symbol, node);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  // 本体のみを走査（パラメータは State でないため除外）
  visit(arrowFn.body);

  return { stateIdMap, unresolved };
}

/**
 * 状態識別子ノードから `_runtimeId` の型リテラル文字列を取得する。
 *
 * `extractRuntimeIdFromType` のリネーム版。
 *
 * State<T> のインスタンスが `const count: State<number> & { _runtimeId: "count-id" }`
 * のように型付けされている場合、TypeChecker から文字列リテラル型を取り出す。
 *
 * - 型が string literal (e.g. "count-id") であれば返す
 * - `string` 型（汎用）の場合は null を返す
 * - Union 型の場合、最初の文字列リテラル型を試みる
 *
 * @param identNode  State 型のルート識別子ノード
 * @param checker    TypeChecker
 * @returns          文字列リテラル（runtimeId）または null
 */
export function resolveStateIdByType(
  identNode: ts.Identifier,
  checker: ts.TypeChecker,
): string | null {
  const type = checker.getTypeAtLocation(identNode);

  // _runtimeId プロパティのシンボルを取得
  const runtimeIdProp = type.getProperty('_runtimeId');
  if (runtimeIdProp === undefined) return null;

  // プロパティの型を取得
  const declNode =
    runtimeIdProp.valueDeclaration ??
    (runtimeIdProp.declarations !== undefined && runtimeIdProp.declarations.length > 0
      ? runtimeIdProp.declarations[0]
      : undefined);
  if (declNode === undefined) return null;

  const propType = checker.getTypeOfSymbolAtLocation(runtimeIdProp, declNode);

  // 文字列リテラル型かチェック
  if (propType.isStringLiteral()) {
    return propType.value;
  }

  // Union 型の場合、最初の文字列リテラル型を試みる
  if (propType.isUnion()) {
    for (const member of propType.types) {
      if (member.isStringLiteral()) {
        return member.value;
      }
    }
  }

  return null;
}

// ---- インライン展開対応 StateIdResolution (relocated from index.ts) ---------

/**
 * ハンドラおよびインライン展開対象の関数本体から StateIdResolution を構築する。
 *
 * 本体スコープと各インライン関数スコープの解決結果を以下の規約でマージする:
 *
 * - `stateIdMap`: Symbol キーをユニオン化。衝突時は本体スコープの解決値を優先する
 *   （後勝ちではない: 既に存在する Symbol はインライン側の値で上書きしない）。
 * - `unresolved`: 全スコープの未解決 Symbol をユニオン化。代表 Identifier は本体
 *   スコープを優先する。ただしいずれかのスコープで `stateIdMap` に解決された
 *   Symbol は「インライン展開後には既知」とみなして `unresolved` から除外する。
 *
 * relocated from index.ts (transformer-index-pipeline-split task 2.3).
 */
export function buildStateIdMapWithInlining(
  arrowFn: ts.ArrowFunction,
  checker: ts.TypeChecker,
  inlineMap: ReadonlyMap<string, ts.ArrowFunction>,
  fallback: StateIdFallback,
): StateIdResolution {
  const bodyResolution = buildStateIdMap(arrowFn, checker, { fallback });

  const combinedStateIdMap = new Map<ts.Symbol, string>(bodyResolution.stateIdMap);
  const combinedUnresolved = new Map<ts.Symbol, ts.Identifier>(bodyResolution.unresolved);

  for (const funcArrow of inlineMap.values()) {
    const inlineResolution = buildStateIdMap(funcArrow, checker, { fallback });

    // stateIdMap マージ: 本体スコープが衝突時に勝つ → 既存キーをスキップ。
    for (const [sym, runtimeId] of inlineResolution.stateIdMap) {
      if (!combinedStateIdMap.has(sym)) {
        combinedStateIdMap.set(sym, runtimeId);
      }
    }

    // unresolved マージ: 本体スコープの代表 Identifier を優先 → 既存キーをスキップ。
    for (const [sym, identNode] of inlineResolution.unresolved) {
      if (!combinedUnresolved.has(sym)) {
        combinedUnresolved.set(sym, identNode);
      }
    }
  }

  // いずれかのスコープで解決された Symbol は unresolved から除外する。
  for (const sym of combinedStateIdMap.keys()) {
    combinedUnresolved.delete(sym);
  }

  return { stateIdMap: combinedStateIdMap, unresolved: combinedUnresolved };
}
