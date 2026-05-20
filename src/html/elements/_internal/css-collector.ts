/**
 * Tree 全体 CSS 収集ロジックを純関数化した helper module。
 *
 * `html-tag.ts` の `collectCssStyleString` メソッドからインラインで実装されていた
 * 「own CSS（`host.css.renderCss(resolver)`）→ 子要素の `collectCssStyleString` への
 *  再帰委譲 → bind-each snapshot 走査（`_eachTemplateSnapshots` 非空時は前者、
 *  それ以外は `_pending` を走査）」のロジックを `collectCss` 関数として export する。
 *
 * 抽出ポイント:
 *
 * - own CSS は `host.css.renderCss(resolver)` を最初に呼び、空文字以外なら push
 * - 子要素には **public method `collectCssStyleString` 経由で** 委譲する。これにより
 *   `Root` の override や将来のサブクラス独自実装にも透過に対応する。`HtmlTag` 値
 *   import を避けるため duck-typed guard
 *   （`'collectCssStyleString' in child && typeof child.collectCssStyleString === 'function'`）
 *   で `HTMLTagProtocol` 配下から呼び出し可能な子に絞る。`HtmlTag` 派生はすべて
 *   このシグネチャを持つため、現実装 `instanceof HtmlTag` と同等の集合を選択する。
 * - bind-each 走査は局所クロージャ `collectFrom` を内部に保持し、現実装と同じく
 *   `_eachTemplateSnapshots.length > 0` を最優先、それ以外は `_pending` を走査する。
 *   `cmd.type !== 'bind-each'` は continue（`eachOrdinal` 据え置き）、bind-each
 *   エントリでは現 ordinal を保持してから `eachOrdinal` を 0-based でインクリメント、
 *   `cmd.template._templateRoot === undefined` の場合は skip、それ以外は
 *   `injectEachTemplateTagPath(cmd.template, host.css.tagPath, currentOrdinal)` を
 *   先行させてから `templateRoot.collectCssStyleString(resolver)` を再帰呼び出しする。
 *
 * 戻り値は `parts.join('\n')`。区切り文字は現実装維持。
 *
 * `_children` は `protected`、`_css` は `private` のため `host` 直アクセスは
 * 不可。`host.css` getter（同一インスタンスを返す public surface）と、
 * `_children` / `_pending` / `_eachTemplateSnapshots` への narrow cast 経由で
 * 参照する（proto-render-pipeline.ts の `asInternals` パターンに倣う）。
 *
 * Requirements: 2.1, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 5.1
 * Design: design.md "Components and Interfaces" → `_internal/css-collector.ts`
 *         (Service Interface) / "System Flows" 委譲フロー / "Allowed Dependencies"
 *
 * @internal
 */
import type { IdentifierResolver } from '../../../css/utils/identifier-resolver.js';
import type { VanillaCommand } from '../../../js/vanilla/commands.js';
import type { HTMLTagProtocol } from '../../protocols/html-tag-protocol.js';
import { injectEachTemplateTagPath } from '../each-factory-resolver.js';
import type { HtmlTagHost } from './host-types.js';

/**
 * helper が `host` を経由してアクセスする最小内部面の構造型。
 *
 * `_children` は `protected`、`_css` は `private` のため、`HtmlTagHost`（=`HtmlTag`）
 * 経由では直接参照できない。`host.css` getter は public のため別途利用可能だが、
 * `_children` / `_pending` / `_eachTemplateSnapshots` は本構造型経由で narrow cast する。
 */
interface HostInternals {
  _children: HTMLTagProtocol[];
  _pending: VanillaCommand[];
  _eachTemplateSnapshots: VanillaCommand[];
}

/** `host` を helper 内部面 (`HostInternals`) に narrow する局所 cast。 */
function asInternals(host: HtmlTagHost): HostInternals {
  return host as unknown as HostInternals;
}

/**
 * `HtmlTag` の Tree 全体 CSS を収集する純関数。
 * `HtmlTag.collectCssStyleString` から委譲される。
 *
 * own CSS（`host.css.renderCss(resolver)`）→ 子要素 CSS（`child.collectCssStyleString`
 * を public method 経由で呼ぶ）→ bind-each snapshot CSS（`_eachTemplateSnapshots`
 * 非空時はそちら、それ以外は `_pending`）の順で `\n` 区切り連結する。
 *
 * @param host - 収集起点の `HtmlTag` インスタンス
 * @param resolver - optional minify-aware identifier resolver
 * @returns own CSS + 子孫 CSS + bind-each snapshot CSS を `\n` 区切りで連結した文字列
 *
 * @internal
 */
export function collectCss(host: HtmlTagHost, resolver?: IdentifierResolver): string {
  const internals = asInternals(host);
  const parts: string[] = [];

  // DF-2: スコープ付きCSS出力（tagPath が設定されている場合）
  const ownCss = host.css.renderCss(resolver);
  if (ownCss.length > 0) {
    parts.push(ownCss);
  }

  for (const child of internals._children) {
    if (
      'collectCssStyleString' in child &&
      typeof (child as { collectCssStyleString?: unknown }).collectCssStyleString === 'function'
    ) {
      const childCss = (child as { collectCssStyleString: (resolver?: IdentifierResolver) => string })
        .collectCssStyleString(resolver);
      if (childCss.length > 0) {
        parts.push(childCss);
      }
    }
  }

  // each-modifier-css-extraction: bind-each snapshot 内 templateRoot 配下の
  // modifier-chain CSS を収集する。tagPath は冪等関数で注入後、再帰的に
  // collectCssStyleString を呼び出す。CSS の重複排除は CssManager.registerTemplate
  // の (tagPath, bodyHash) dedup に委譲する。
  //
  // _pending と _eachTemplateSnapshots の両方を走査する：
  //  - _pending: protoRender 前 / closure factoryCode 未確定の bind-each
  //  - _eachTemplateSnapshots: protoRender 後に _scope へ転送された bind-each の保持先
  const collectFrom = (cmds: VanillaCommand[]): void => {
    let eachOrdinal = 0;
    for (const cmd of cmds) {
      if (cmd.type !== 'bind-each') {
        continue;
      }
      const currentOrdinal = eachOrdinal;
      eachOrdinal += 1;
      const templateRoot = cmd.template._templateRoot;
      if (templateRoot === undefined) {
        continue;
      }
      injectEachTemplateTagPath(cmd.template, host.css.tagPath, currentOrdinal);
      const eachCss = templateRoot.collectCssStyleString(resolver);
      if (eachCss.length > 0) {
        parts.push(eachCss);
      }
    }
  };
  if (internals._eachTemplateSnapshots.length > 0) {
    collectFrom(internals._eachTemplateSnapshots);
  } else {
    collectFrom(internals._pending);
  }

  return parts.join('\n');
}
