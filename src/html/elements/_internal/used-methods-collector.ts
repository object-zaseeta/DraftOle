/**
 * Tree 全体 used-methods 収集ロジックを純関数化した helper module。
 *
 * `html-tag.ts` の `collectUsedMethods` メソッドからインラインで実装されていた
 * 「own usedMethods（`host._jqm.usedMethods`）から `new Set` 初期化 → 子要素の
 *  `collectUsedMethods` への再帰委譲（duck-typed guard 経由）」のロジックを
 * `collectUsedMethods` 関数として export する。
 *
 * 抽出ポイント:
 *
 * - own usedMethods は `host.jqm.usedMethods` を読み出し、新しい `Set<JQueryMethodType>`
 *   で初期化する。`host.jqm` getter は `_jqm` private field の同一インスタンスを
 *   返す public surface であり、`_jqm` 直アクセス（private）を避ける（css-collector /
 *   js-collector と同様の規約）。
 * - 子要素には **public method `collectUsedMethods` 経由で** 委譲する。これにより
 *   `Root` の override や将来のサブクラス独自実装にも透過に対応する。`HtmlTag` 値
 *   import を避けるため duck-typed guard
 *   （`'collectUsedMethods' in child && typeof child.collectUsedMethods === 'function'`）
 *   で `HTMLTagProtocol` 配下から呼び出し可能な子に絞る。
 * - 子の `collectUsedMethods()` の戻り `Set` を `for ... of` で走査し、`result.add(method)`
 *   で集約する（現実装維持）。
 *
 * 戻り値は集約後の `Set<JQueryMethodType>`。消費側は membership のみを参照する
 * 仕様のため、insertion order は契約に含まれない。
 *
 * `_children` は `protected` のため `host` 直アクセスは不可。`host.jqm` getter
 * （同一インスタンスを返す public surface）と、`_children` への narrow cast 経由で
 * 参照する（css-collector.ts / js-collector.ts の `asInternals` パターンに倣う）。
 *
 * Requirements: 2.3, 4.1, 5.3
 * Design: design.md "Components and Interfaces" → `_internal/used-methods-collector.ts`
 *         (Service Interface) / "Boundary Commitments" / "Allowed Dependencies"
 *
 * @internal
 */
import type { HTMLTagProtocol } from '../../protocols/html-tag-protocol.js';
import type { JQueryMethodType } from '../../protocols/jquery-method-type.js';
import type { HtmlTagHost } from './host-types.js';

/**
 * helper が `host` を経由してアクセスする最小内部面の構造型。
 *
 * `_children` は `protected` のため、`HtmlTagHost`（=`HtmlTag`）経由では
 * 直接参照できない。`host.jqm` getter は public のため別途利用可能だが、
 * `_children` は本構造型経由で narrow cast する。
 */
interface HostInternals {
  _children: HTMLTagProtocol[];
}

/** `host` を helper 内部面 (`HostInternals`) に narrow する局所 cast。 */
function asInternals(host: HtmlTagHost): HostInternals {
  return host as unknown as HostInternals;
}

/**
 * `HtmlTag` の Tree 全体で使用された jQuery メソッド集合を返す純関数。
 * `HtmlTag.collectUsedMethods` から委譲される。
 *
 * own usedMethods（`host.jqm.usedMethods`）で初期化された新しい `Set` に、
 * 子要素の `collectUsedMethods()`（public method 経由）戻り集合を順次マージする。
 *
 * @param host - 収集起点の `HtmlTag` インスタンス
 * @returns own + 子孫の jQuery method 集合
 *
 * @internal
 */
export function collectUsedMethods(host: HtmlTagHost): Set<JQueryMethodType> {
  const internals = asInternals(host);

  // 自身のJQueryManagerで使用されたメソッドから開始
  const result = new Set<JQueryMethodType>(host.jqm.usedMethods);

  // 子要素のメソッドを再帰的に収集
  for (const child of internals._children) {
    if ('collectUsedMethods' in child && typeof child.collectUsedMethods === 'function') {
      for (const method of child.collectUsedMethods()) {
        result.add(method);
      }
    }
  }

  return result;
}
