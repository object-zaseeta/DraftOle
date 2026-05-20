/**
 * 遅延解決モデルの実体: `PendingBuffer` + `FlushOrchestrator`。
 *
 * 要素ビルダ（`HtmlTag` サブクラス）が `Root.addChild` で登録される以前に
 * 受け取った DOM 操作コマンドは、各要素の `_pending: VanillaCommand[]`
 * バッファに積まれる。`Root.addChild(el)` の時点で `FlushOrchestrator.flush`
 * が呼ばれ、バッファ内容を Root が保持する `VanillaScope` に転送するとともに、
 * 要素に `_scope` 参照を紐付けて以降の呼び出しを即時 `_append` 経路へ切り替える。
 *
 * - Requirements: 1.6, 1.7, 1.8 (unified-element-api)
 * - Design: 「遅延解決モデル」「PendingBuffer + FlushOrchestrator」
 *
 * 本モジュールは Root.addChild 側（task 4.2）から呼ばれることを想定しており、
 * 本ステップ時点では他モジュールから参照されない（テストのみが直接呼ぶ）。
 */

import { HtmlTag } from '../../html/elements/html-tag.js';
import type { VanillaScope } from './vanilla-script-builder.js';
import { hasCommandTarget } from './commands.js';

/**
 * 遅延解決モデルのフラッシュ制御。
 *
 * `flush(el, scope)` は以下を満たす:
 * 1. 既にフラッシュ済み（`el._scope !== undefined`）なら no-op で戻る（二重登録ガード）
 * 2. `el._scope = scope` を設定
 * 3. `el._pending` 内の全 `VanillaCommand` を `scope._append` へ順序保存で転送
 * 4. `el._pending` を空配列にリセット
 * 5. `el` の子要素のうち `HtmlTag` インスタンスに対して深さ優先で `flush` を再帰
 *
 * 子要素が `HtmlTag` でない場合（`TextType` 相当の非タグノードや、
 * `protoRender` のみを実装する外部ノード）はスキップする。
 *
 * 以下のコマンドは protoRender まで _pending に留保する（render-phase 解決が必要）:
 * - `deferred-self` target を持つコマンド（id 自動付与後に selector が確定）
 * - `bind-each` で closure factory 未確定のコマンド（resolveEachFactories で確定）
 */
export const FlushOrchestrator = {
  flush(el: HtmlTag, scope: VanillaScope): void {
    // (1) 二重登録ガード: 既にフラッシュ済みの要素は再処理しない
    if (el._scope !== undefined) {
      return;
    }

    // (2) scope 参照を紐付け、以降の要素メソッドが即時経路を取れるようにする
    el._scope = scope;

    // (3)(4) バッファ済みコマンドを scope へ転送し、バッファを空にする。
    // 以下は protoRender まで _pending に留保する:
    // - deferred-self target: protoRender で id が確定してから scope へ転送
    // - bind-each (closure 未確定): resolveEachFactories で factoryCode 確定後に転送
    const pending = el._pending;
    const deferred: typeof pending = [];
    for (const cmd of pending) {
      if (hasCommandTarget(cmd) && cmd.target.kind === 'deferred-self') {
        deferred.push(cmd);
      } else if (
        cmd.type === 'bind-each' &&
        cmd.template.factoryKind === 'closure' &&
        cmd.template.factoryCode === undefined
      ) {
        deferred.push(cmd);
      } else {
        scope._append(cmd);
      }
    }
    pending.length = 0;
    for (const cmd of deferred) {
      pending.push(cmd);
    }

    // (5) 子要素（HtmlTag のみ）へ深さ優先で再帰
    for (const child of el.children) {
      if (child instanceof HtmlTag) {
        FlushOrchestrator.flush(child, scope);
      }
    }
  },
};

export type FlushOrchestratorType = typeof FlushOrchestrator;
