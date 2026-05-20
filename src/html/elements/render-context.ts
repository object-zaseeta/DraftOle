/**
 * RenderContext — protoRender 系メソッドが共有する単一コンテキスト。
 *
 * Requirements: 3.1（id 自動生成）、3.4（id 重複検出）
 *
 * 設計メモ:
 * - `IdRegistry` と `IdentifierResolver` をひとつのオブジェクトに束ねて
 *   レンダーツリー全体で同一インスタンスを伝搬させるための器。
 * - 既存の `protoRender` シグネチャに **optional 引数** として追加できる
 *   形にしてあり、ctx 省略時は呼び出し側が `createDefaultRenderContext()`
 *   などで自前生成して旧挙動互換を保つ運用を想定する。
 * - サブクラス（Root / PairType / SelfClosingType / TextType）の override は、
 *   受け取った ctx を子要素 `protoRender(ctx)` に **必ず伝搬する責務**を持つ。
 *   伝搬漏れは Req 3.4 の不達につながる（design.md 参照）。
 *
 * このファイルは純粋な型定義 + 軽量ファクトリのみで、副作用や
 * ランタイム依存を持たない。
 */
import { IdRegistry } from './id-registry.js';
import {
  createIdentifierResolver,
  defaultIdentifierResolver,
  type IdentifierResolver,
} from '../../css/utils/identifier-resolver.js';
import type { CssConfig } from '../../css/config/css-config.js';

/**
 * レンダーフェーズ全体で共有するコンテキスト。
 *
 * - `registry`: ツリー単位で id 重複を検出するためのレジストリ。
 *   Root.protoRender() の冒頭で `reset()` され、以降の子要素レンダーで
 *   同一インスタンスを共有する。
 * - `resolver`: tagPath からクラス名・id を決定的に生成する純関数群。
 *   ステートレスなので使い回し可能。
 */
export interface RenderContext {
  readonly registry: IdRegistry;
  readonly resolver: IdentifierResolver;
  /**
   * ファクトリ抽出モードフラグ。
   *
   * `true` の場合、`each` などの factory 由来コンポーネントの
   * 抽出経路を有効化する（後続タスクで実装）。
   * 未設定または `false` の場合は従来挙動を維持する。
   *
   * Requirements: 1.1, 2.1
   */
  readonly factoryExtraction?: boolean;
}

/**
 * デフォルトの RenderContext を生成するファクトリ。
 *
 * `protoRender` を ctx 省略形で呼び出した場合に内部で組み立てる用途を想定。
 * IdRegistry は **新規インスタンス**を毎回生成する。
 *
 * `options.cssConfig` が指定された場合、`cssConfig.minifyClassNames` に応じて
 * minify-aware な `IdentifierResolver` を `createIdentifierResolver` で構築する。
 * 省略時は副作用のないシングルトン（`defaultIdentifierResolver`）を共有する
 * （既存挙動とバイト等価）。
 *
 * 設計判断: `RenderContext` interface には `cssConfig` フィールドを追加しない。
 * minify 状態は `resolver` 内に閉じ込められ、下流は `resolver` のみを単一情報源とする
 * （css-config-pipeline-wiring spec、Issue 2 対応）。
 *
 * @param options - `{ cssConfig?: CssConfig }` 省略可
 */
export function createDefaultRenderContext(
  options?: { cssConfig?: CssConfig },
): RenderContext {
  const resolver: IdentifierResolver = options?.cssConfig === undefined
    ? defaultIdentifierResolver
    : createIdentifierResolver({ minify: options.cssConfig.minifyClassNames });
  return {
    registry: new IdRegistry(),
    resolver,
  };
}
