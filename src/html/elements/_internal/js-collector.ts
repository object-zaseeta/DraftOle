/**
 * Tree 全体 JS 収集ロジックを純関数化した helper module。
 *
 * `html-tag.ts` の `collectJsContent` メソッドからインラインで実装されていた
 * 「own JS（`host.jqm.render()` の length > 0 のみ push）→ 子要素の
 *  `collectJsContent` への再帰委譲（duck-typed guard 経由）」のロジックを
 * `collectJs` 関数として export する。
 *
 * 抽出ポイント:
 *
 * - own JS は `host.jqm.render()` を最初に呼び、length > 0 のときのみ push
 * - 子要素には **public method `collectJsContent` 経由で** 委譲する。これにより
 *   `Root` の override や将来のサブクラス独自実装にも透過に対応する。`HtmlTag` 値
 *   import を避けるため duck-typed guard
 *   （`'collectJsContent' in child && typeof child.collectJsContent === 'function'`）
 *   で `HTMLTagProtocol` 配下から呼び出し可能な子に絞る。
 *
 * 戻り値は `contents.join(';\n')`。区切り文字は現実装維持。
 *
 * `_children` は `protected`、`_jqm` は `private` のため `host` 直アクセスは
 * 不可。`host.jqm` getter（同一インスタンスを返す public surface）と、
 * `_children` への narrow cast 経由で参照する（css-collector.ts の
 * `asInternals` パターンに倣う）。
 *
 * Requirements: 2.2, 4.1, 5.2
 * Design: design.md "Components and Interfaces" → `_internal/js-collector.ts`
 *         (Service Interface) / "System Flows" 委譲フロー / "Allowed Dependencies"
 *
 * @internal
 */
import type { HTMLTagProtocol } from '../../protocols/html-tag-protocol.js';
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
 * `HtmlTag` の Tree 全体 JS を収集する純関数。
 * `HtmlTag.collectJsContent` から委譲される。
 *
 * own JS（`host.jqm.render()`）→ 子要素 JS（`child.collectJsContent` を
 * public method 経由で呼ぶ）の順で `;\n` 区切り連結する。
 *
 * @param host - 収集起点の `HtmlTag` インスタンス
 * @returns own JS + 子孫 JS を `;\n` 区切りで連結した文字列
 *
 * @internal
 */
export function collectJs(host: HtmlTagHost): string {
  const internals = asInternals(host);
  const contents: string[] = [];

  // 自身のJQueryManager のJS文を収集
  const ownJs = host.jqm.render();
  if (ownJs.length > 0) {
    contents.push(ownJs);
  }

  // 子要素のJSを再帰的に収集
  for (const child of internals._children) {
    if ('collectJsContent' in child && typeof child.collectJsContent === 'function') {
      const childJs = child.collectJsContent();
      if (childJs.length > 0) {
        contents.push(childJs);
      }
    }
  }

  return contents.join(';\n');
}
