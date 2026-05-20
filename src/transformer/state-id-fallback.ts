/**
 * state-id-fallback.ts
 *
 * State ランタイム ID 解決の補助経路（フォールバック）を局所化するモジュール。
 *
 * canonical 経路（型リテラル `_runtimeId` の抽出）が値を返せない場合に限り、
 * AST 後順走査で構築した「変数名 → ランタイム ID」マップを参照する。
 *
 * Task 2.1: フォールバック責務を `state-id-resolver.ts` から分離する。
 *
 * 公開 API:
 *   - StateIdFallback           : フォールバック契約のインタフェース
 *   - createSourceStateNameFallback(sourceFile, checker)
 *                                : 単一ソースファイル走査ベースの StateIdFallback を生成するファクトリ
 *   - buildSourceStateNameMap(sourceFile, checker)
 *                                : 旧 API（後方互換のため公開）
 *
 * 受容パターン（resolve が値を返せる構造）:
 *   - 単一 Root インスタンスを持つソースファイル
 *   - `const x = state(...)` のように VariableDeclaration の initializer に
 *     直接 State/Computed 生成式が代入されているケース
 *
 * 非受容パターン（フォールバックでは解決不可）:
 *   - 複数 Root インスタンス（カウンタが共有されないため）
 *   - ヘルパー関数で State 生成をラップしたケース
 *   - 分割代入で受け取るケース
 *   - オブジェクトリテラルのプロパティに代入するケース
 *   - 関数からの直接 return（変数名が存在しない）
 */

import * as ts from 'typescript';
import { isStateTypeNode, resolveStateIdByType } from './state-id-resolver';

/**
 * State ランタイム ID 解決のフォールバック契約。
 *
 * canonical 経路（`resolveStateIdByType`）が null を返した識別子に対して、
 * このインタフェースの `resolve` が補助的に値を返せる場合に使用される。
 */
export interface StateIdFallback {
  /**
   * 識別子ノードからランタイム ID を解決する。
   *
   * @param identNode  解決対象の識別子ノード
   * @returns          ランタイム ID（"s0" など）または null（解決不可）
   */
  resolve(identNode: ts.Identifier): string | null;

  /**
   * 当該識別子がフォールバック適用対象かを判定する。
   *
   * 真値条件: `_runtimeId` の文字列リテラル型が取得不能（canonical 経路で null）
   * かつ `isStateTypeNode` が true（State/Computed 型である）。
   *
   * @param identNode  検査対象の識別子ノード
   * @returns          フォールバック適用対象であれば true
   */
  supportsPattern(identNode: ts.Identifier): boolean;
}

/**
 * ソースファイル全体を後順走査し、`StateIdFallback` を生成するファクトリ。
 *
 * 構築時に一度だけ `buildSourceStateNameMap` を実行し、以降の `resolve` は
 * 構築済みマップへのルックアップに委譲する（O(1)）。
 *
 * @param sourceFile  走査対象のソースファイル
 * @param checker     TypeChecker
 * @returns           StateIdFallback 実装
 */
export function createSourceStateNameFallback(
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
): StateIdFallback {
  const nameToId = buildSourceStateNameMap(sourceFile, checker);

  return {
    resolve(identNode: ts.Identifier): string | null {
      return nameToId.get(identNode.text) ?? null;
    },
    supportsPattern(identNode: ts.Identifier): boolean {
      return (
        resolveStateIdByType(identNode, checker) === null &&
        isStateTypeNode(identNode, checker)
      );
    },
  };
}

/**
 * ソースファイル内の State/Computed 生成呼び出しを後順走査でカウントし、
 * 変数名 → ランタイム ID（"s0", "s1", …）のマップを構築する。
 *
 * StateRegistry.allocateId() の実行順を静的に再現する。
 * 後順走査はチェーン `x.state().map()` の内側呼び出しを先にカウントするため
 * ランタイムの左辺優先評価と一致する。
 *
 * @param sourceFile  走査対象のソースファイル
 * @param checker     TypeChecker
 * @returns           変数名 → ランタイム ID の ReadonlyMap
 *
 * @remarks
 * **制約**:
 * - 単一 Root インスタンスを持つファイルでのみ信頼できる
 * - ネストされたスコープ・ヘルパー抽象化内の State 生成はサポート外
 */
export function buildSourceStateNameMap(
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
): ReadonlyMap<string, string> {
  const nameToId = new Map<string, string>();
  let counter = 0;

  function visit(node: ts.Node): void {
    // 後順: 子を先に走査
    ts.forEachChild(node, visit);

    if (!ts.isCallExpression(node)) return;

    // 返り値が State/Computed 型である CallExpression のみカウント
    if (!isStateTypeNode(node, checker)) return;

    const id = `s${counter++}`;

    // このノードが VariableDeclaration の initializer に直接代入されているか確認
    const parent = node.parent;
    if (
      parent !== undefined &&
      ts.isVariableDeclaration(parent) &&
      ts.isIdentifier(parent.name)
    ) {
      nameToId.set(parent.name.text, id);
    }
  }

  visit(sourceFile);
  return nameToId;
}
