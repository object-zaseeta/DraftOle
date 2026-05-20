/**
 * each-factory-resolver — bind-each テンプレートの factoryCode を render-phase で確定させるフック。
 *
 * `HtmlTag.protoRender` 内で呼び出される想定（task 3.2 で配線）。本モジュールは
 * `parent._pending` を走査し、factoryCode 未確定の `bind-each` コマンドに対して以下を行う:
 *
 * 1. 親 tagPath を基に `each${ordinal}` を tagPath として template ルートに注入
 *    （`ordinal` は `_pending` 内の bind-each サブセットにおける 0-based index）
 * 2. `factoryExtraction: true` を付与した RenderContext で template の `protoRender`
 *    を呼び出し、`_attributes` への class マージなどの side-effect のみを得る
 * 3. `buildFactoryCode` で closure 形式 factory コードを生成して `cmd.template.factoryCode`
 *    に格納
 *
 * 既に factoryCode が設定済みの bind-each コマンドはスキップするため、複数回呼んでも
 * idempotent に動作する。
 *
 * Requirements: 1.1, 1.2, 1.3, 2.1
 */

import type { HtmlTag } from './html-tag.js';
import type { RenderContext } from './render-context.js';
import {
  buildFactoryCode,
  type EachTemplateSnapshot,
} from '../../js/vanilla/state/each-template.js';

/**
 * `EachTemplateSnapshot._templateRoot` に tagPath を冪等注入する純粋関数。
 *
 * - target = `${parentTagPath}.each${ordinal}` を計算し、`_templateRoot._css.tagPath`
 *   に設定する
 * - 既に同一 target が設定済みなら no-op（render-phase での再注入を許容）
 * - 既設定値が target と異なる場合は実装バグ検出のため throw（fail-loud）
 * - `_templateRoot` が未保持の snapshot（static-placeholder 経路）では no-op
 *
 * Requirements: 1.2
 */
export function injectEachTemplateTagPath(
  snapshot: EachTemplateSnapshot,
  parentTagPath: string,
  ordinal: number,
): void {
  const templateRoot = snapshot._templateRoot;
  if (templateRoot === undefined) {
    return;
  }
  const target = `${parentTagPath}.each${ordinal}`;
  const templateCss = (templateRoot as unknown as {
    _css?: { tagPath: string };
  })._css;
  if (templateCss === undefined) {
    return;
  }
  const current = templateCss.tagPath;
  if (current !== '' && current !== target) {
    throw new Error(
      `injectEachTemplateTagPath: tagPath conflict (current=${current}, target=${target})`,
    );
  }
  templateCss.tagPath = target;
}

/**
 * `parent._pending` を走査し、未確定 bind-each テンプレートの factoryCode を
 * render-phase で解決する。
 *
 * - `cmd.template.factoryCode === undefined && cmd.template._templateRoot !== undefined`
 *   を満たすコマンドのみ処理対象とする。
 * - `_pending` 内の bind-each コマンドのうち何番目かを `ordinal` として算出
 *   （0-based）。
 * - template ルートの `_css.tagPath` に `${parent._css.tagPath}.each${ordinal}` を注入。
 * - `factoryExtraction: true` を付与した ctx で template の protoRender を呼び、
 *   class マージ等の side-effect を発火させる。
 * - `buildFactoryCode` の結果を `cmd.template.factoryCode` に格納する。
 *
 * 関数自体は副作用のみで戻り値を返さない。同じ parent を 2 回目に呼んだ場合、
 * すべての bind-each cmd が factoryCode を保持しているため何も行わない（idempotent）。
 *
 * @param parent - bind-each コマンドを `_pending` に保持する親 HtmlTag
 * @param ctx - 現行の RenderContext（factoryCtx の base となる）
 */
export function resolveEachFactories(parent: HtmlTag, ctx: RenderContext): void {
  // parent._css.tagPath は private フィールド経由でアクセスする必要があるため
  // 構造的に取り出す（HtmlTag 内では `_css.tagPath` が string で公開されている）。
  const parentCss = (parent as unknown as {
    _css: { tagPath: string };
  })._css;
  const parentTagPath = parentCss?.tagPath ?? '';

  let ordinal = 0;
  for (const cmd of parent._pending) {
    if (cmd.type !== 'bind-each') {
      continue;
    }
    const currentOrdinal = ordinal;
    ordinal += 1;

    const template = cmd.template;
    if (template.factoryCode !== undefined) {
      // 既に確定済み — idempotent path（2 回目以降の呼び出し）
      continue;
    }
    const templateRoot = template._templateRoot;
    if (templateRoot === undefined) {
      // closure 経路でのみ _templateRoot が保持される。未保持なら static 経路の
      // 旧形 factory が build-phase で確定済みのため、本フックの対象外。
      continue;
    }

    // 1) tagPath を template ルートへ注入（冪等関数経由）
    injectEachTemplateTagPath(template, parentTagPath, currentOrdinal);

    // 2) factoryExtraction: true を付与した ctx で protoRender を呼び side-effect を発火
    const factoryCtx: RenderContext = { ...ctx, factoryExtraction: true };
    templateRoot.protoRender(factoryCtx);

    // 3) buildFactoryCode で closure factory コードを生成し snapshot に格納
    const arrayStateId = cmd.stateId;
    const itemStateIdPattern = template.itemStateIdPattern;
    template.factoryCode = buildFactoryCode(templateRoot, {
      arrayStateId,
      itemStateIdPattern,
    });
  }
}
