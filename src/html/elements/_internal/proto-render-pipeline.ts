/**
 * `protoRender` の補助ロジック 4 段を純関数化した helper module。
 *
 * `html-tag.ts` の `protoRender` メソッドからインラインで実装されていた以下の
 * 4 つの副作用段階を、固定順序で呼び出される export 関数として提供する:
 *
 * 1. `flushPendingStyleTemplates(host, ctx)` —
 *    `_pendingStyleTemplates` を `tagPath` 確定後に `CssManager.registerTemplate`
 *    へ転送し、解決済み className 群を返す。
 * 2. `decideScopeClasses(host, ctx, templateClassNames)` —
 *    scope class 自動付与の必要性を判定し、必要なら `_attributes` の class 属性に
 *    追記する。
 * 3. `rewriteDeferredSelfTargets(host, ctx)` —
 *    `_pending` 内の `deferred-self` ターゲットを id / class セレクタに in-place
 *    で書き換え、`_scope` 存在時には解決済みコマンドを転送する。
 *    `ctx.factoryExtraction === true` の場合は no-op。
 * 4. `flushPostEach(host)` —
 *    `resolveEachFactories` 後に `_pending` 内の bind-each（factoryCode 確定済み）
 *    を `_eachTemplateSnapshots` に保存し `_scope._append` に転送する。
 *
 * 各関数は `host` の内部状態（`_pending` / `_pendingStyleTemplates` /
 * `_eachTemplateSnapshots` / `_attributes` / `_scope` / `_css`）を直接 mutate する。
 * 呼び出し順を入れ替えると bytewise 等価が崩れる点に注意する。
 *
 * Requirements: 3.1, 3.3, 3.4, 3.5, 6.3, 6.4
 * Design: design.md "Components and Interfaces" → `_internal/proto-render-pipeline.ts`
 *         (Service Interface) / "System Flows" sequence diagram /
 *         "Allowed Dependencies"
 *
 * @internal
 */
import type { HtmlTagHost } from './host-types.js';
import type { RenderContext } from '../render-context.js';
import { HtmlAttribute } from '../../attributes/html-attribute.js';
import { hasCommandTarget, rewriteCommandTarget } from '../../../js/vanilla/commands.js';
import type { VanillaCommand } from '../../../js/vanilla/commands.js';
import type { ElementTarget } from '../../../js/vanilla/element-target.js';
import type { HtmlAttributeShape } from '../../protocols/html-tag-protocol.js';
import type { StyleTemplate } from '../../../css/variables/style-template.js';

/**
 * `flushPendingStyleTemplates` + `decideScopeClasses` の結果を表す軽量レコード。
 *
 * - `extraClasses`: scope class（自動付与時）と template 由来 className を結合した
 *   class 名列。`decideScopeClasses` で実際に `_attributes` の class 属性に追加された
 *   値と同一順序。
 * - `scopeClassApplied`: scope class（`resolver.resolveClassName(tagPath)` 由来）が
 *   自動付与されたか。template 由来のみのケースでは `false` になる。
 *
 * @internal
 */
export interface ProtoRenderPipelineResult {
  /** 既に解決されたスコープ用クラス名（template 由来含む） */
  readonly extraClasses: readonly string[];
  /** scope-class 自動付与が発生したか */
  readonly scopeClassApplied: boolean;
}

/**
 * `_css` を duck-typing で参照するための部分型。
 *
 * `HtmlTag._css` は `private` フィールドのため helper module からは直接アクセス
 * できないが、`host.css` getter が同一インスタンスを返すため、必要な API
 * （`tagPath` / `render()` / `registerTemplate`）はそちら経由で参照する。
 */
interface CssManagerLike {
  readonly tagPath?: string;
  render(): string;
  registerTemplate?: (
    tpl: StyleTemplate,
    resolver: RenderContext['resolver'],
    tagPath: string,
  ) => string;
}

/**
 * helper が `host` を経由してアクセスする最小内部面の構造型。
 *
 * `_attributes` は `protected`、`_css` は `private` のため外部からは見えない。
 * 本ファイル内のみで使う narrow 型として一括 cast する（`as unknown as`）。
 * `_pending` / `_pendingStyleTemplates` / `_eachTemplateSnapshots` / `_scope`
 * はアクセス修飾子なし（package-internal 慣習）のため、`HtmlTagHost` 経由でも
 * 直接参照可能だが、本構造型に含めることで helper の依存面を 1 箇所に集約する。
 */
interface HostInternals {
  _attributes: HtmlAttributeShape[];
  _pending: VanillaCommand[];
  _pendingStyleTemplates: StyleTemplate[];
  _eachTemplateSnapshots: VanillaCommand[];
  _scope?: { _append(cmd: VanillaCommand): void } | undefined;
  readonly css: CssManagerLike;
}

/** `host` を helper 内部面 (`HostInternals`) に narrow する局所 cast。 */
function asInternals(host: HtmlTagHost): HostInternals {
  return host as unknown as HostInternals;
}

/**
 * `_pendingStyleTemplates` を tagPath 確定後に `CssManager.registerTemplate` へ
 * 転送し、解決済み className 群を返す。
 *
 * - `_pendingStyleTemplates` が空、または `host.css.tagPath` が未確定の場合は
 *   空配列を返す（既存 `protoRender` 644 行の guard と同一）。
 * - `host.css.registerTemplate` が duck-typing で見つからない場合も空配列を返す。
 * - `_pendingStyleTemplates` 自体は **mutate しない**（append-only 維持）。
 *
 * 副作用: `host.css.registerTemplate` を呼び `CssManager` 側にテンプレートを登録する。
 *
 * Requirements: 3.3, 3.4, 6.3
 *
 * @internal
 */
export function flushPendingStyleTemplates(
  host: HtmlTagHost,
  ctx: RenderContext,
): readonly string[] {
  const internals = asInternals(host);
  const tagPath = internals.css.tagPath;
  if (internals._pendingStyleTemplates.length === 0 || !tagPath) {
    return [];
  }
  const register = internals.css.registerTemplate;
  if (typeof register !== 'function') {
    return [];
  }
  const result: string[] = [];
  for (const tpl of internals._pendingStyleTemplates) {
    const className = register.call(internals.css, tpl, ctx.resolver, tagPath);
    result.push(className);
  }
  return result;
}

/**
 * scope class 自動付与の必要性を判定し、必要なら `host._attributes` に class を
 * 追加または上書きする。
 *
 * 自動付与トリガ:
 * - `hasCss`（`host.css.render().length > 0`）または `_pending.length > 0` で
 *   id 属性が未指定の場合 — `_css.tagPath` が確定していることが前提。
 * - `templateClassNames` が非空の場合は、scope class 自動付与の有無に関わらず
 *   class 属性に追加する。
 *
 * 副作用:
 * - 既存の `class` 属性（`keyValue`）があれば `HtmlAttribute.className` で結合し直して
 *   同じインデックスに上書きする。
 * - `class` 属性が存在しない場合は `host.addHtmlAttribute(HtmlAttribute.className(...))` で
 *   末尾に追加する。
 *
 * Requirements: 3.4, 6.3
 *
 * @internal
 */
export function decideScopeClasses(
  host: HtmlTagHost,
  ctx: RenderContext,
  templateClassNames: readonly string[],
): ProtoRenderPipelineResult {
  const internals = asInternals(host);
  const tagPath = internals.css.tagPath;
  const hasExplicitId = internals._attributes.some(a => a.key === 'id');
  const hasCss = internals.css.render().length > 0;
  const needsSelectorClass =
    !hasExplicitId && internals._pending.length > 0 && !!tagPath;
  const wantsScopeClass = (hasCss || needsSelectorClass) && !!tagPath;

  if (!wantsScopeClass && templateClassNames.length === 0) {
    return { extraClasses: [], scopeClassApplied: false };
  }

  const extraClasses: string[] = [];
  if (wantsScopeClass && tagPath) {
    extraClasses.push(ctx.resolver.resolveClassName(tagPath));
  }
  for (const name of templateClassNames) {
    extraClasses.push(name);
  }

  const existingClassIdx = internals._attributes.findIndex(a => a.key === 'class');
  if (existingClassIdx >= 0) {
    const existing = internals._attributes[existingClassIdx]!;
    if (existing.attributeValue.type === 'keyValue') {
      internals._attributes[existingClassIdx] = HtmlAttribute.className(
        existing.attributeValue.value,
        ...extraClasses,
      );
    }
  } else {
    host.addHtmlAttribute(HtmlAttribute.className(...extraClasses));
  }

  return {
    extraClasses,
    scopeClassApplied: wantsScopeClass,
  };
}

/**
 * `_pending` 内の `deferred-self` ターゲットを確定済みセレクタへ書き換える。
 *
 * セレクタ解決の優先順位:
 *   1. ユーザーが明示した id 属性 → `'#<id>'`
 *   2. JS バインディング対象かつ tagPath が確定済み → `'._<classHash>'`
 *      （HTML に id 属性を付与せず、クラスセレクタで代替する）
 *
 * - `ctx.factoryExtraction === true` の場合は **no-op**（each 内部要素は
 *   `document.createElement` で生成され、querySelector 経路は使わない）。
 * - セレクタが解決できない場合（バインディングなし or tagPath 未確定）は no-op。
 * - 解決後、`_scope` が存在すれば bind-each (closure 未確定) **以外** のコマンドを
 *   `_scope._append` に転送し、`_pending` から取り除く。
 *
 * Requirements: 3.1, 3.3, 6.3
 *
 * @internal
 */
export function rewriteDeferredSelfTargets(
  host: HtmlTagHost,
  ctx: RenderContext,
): void {
  if (ctx.factoryExtraction === true) return;

  const internals = asInternals(host);
  const tagPath = internals.css.tagPath;
  const hasExplicitId = internals._attributes.some(a => a.key === 'id');
  const idAttr = internals._attributes.find(a => a.key === 'id');

  let resolvedSelector: string | undefined;
  if (idAttr !== undefined && idAttr.attributeValue.type === 'keyValue') {
    resolvedSelector = `#${idAttr.attributeValue.value}`;
  } else if (!hasExplicitId && internals._pending.length > 0 && !!tagPath) {
    resolvedSelector = `.${ctx.resolver.resolveClassName(tagPath)}`;
  }
  if (resolvedSelector === undefined) return;

  const selTarget: ElementTarget = {
    kind: 'sel',
    selector: resolvedSelector,
  };
  for (let i = 0; i < internals._pending.length; i++) {
    const cmd = internals._pending[i]!;
    if (hasCommandTarget(cmd) && cmd.target.kind === 'deferred-self') {
      internals._pending[i] = rewriteCommandTarget(cmd, selTarget);
    }
  }

  // FlushOrchestrator が deferred-self コマンドを _pending に留保していた場合、
  // 解決済みコマンドを _scope（VanillaScriptBuilder）へ遅延転送する。
  // bind-each (closure 未確定) は resolveEachFactories まで残す。
  if (internals._scope !== undefined && internals._pending.length > 0) {
    const scope = internals._scope;
    const remaining: VanillaCommand[] = [];
    for (const cmd of internals._pending) {
      if (
        cmd.type === 'bind-each' &&
        cmd.template.factoryKind === 'closure' &&
        cmd.template.factoryCode === undefined
      ) {
        remaining.push(cmd);
      } else {
        scope._append(cmd);
      }
    }
    internals._pending.length = 0;
    for (const cmd of remaining) {
      internals._pending.push(cmd);
    }
  }
}

/**
 * `resolveEachFactories` 完了後に `_pending` 内の bind-each（factoryCode 確定済み）
 * を `_eachTemplateSnapshots` に append し、`_scope._append` に転送する。
 *
 * 動作詳細:
 * - `host._scope` が `undefined` の場合は **no-op**（既存 protoRender 753 行）。
 * - `_pending` を走査し:
 *   - `bind-each` で `template.factoryCode !== undefined` → `_eachTemplateSnapshots`
 *     に append し、`_scope._append` で転送。
 *   - `bind-each` で `factoryCode === undefined` → そのまま `_pending` に残置。
 *   - それ以外（deferred-self 解決済み非 bind-each 等）→ `_scope._append` に転送。
 *     ※ 通常は `rewriteDeferredSelfTargets` で既に flush 済みのため到達しないが、
 *        既存実装の safety net をそのまま維持する。
 *
 * Requirements: 3.5, 6.3
 *
 * @internal
 */
export function flushPostEach(host: HtmlTagHost): void {
  const internals = asInternals(host);
  if (internals._scope === undefined || internals._pending.length === 0) return;

  const scope = internals._scope;
  const stillPending: VanillaCommand[] = [];
  for (const cmd of internals._pending) {
    if (cmd.type === 'bind-each' && cmd.template.factoryCode !== undefined) {
      // each-modifier-css-extraction: CSS 収集 phase で templateRoot を再走査
      // できるよう、_scope へ転送する前にスナップショットを保持する。
      internals._eachTemplateSnapshots.push(cmd);
      scope._append(cmd);
    } else if (cmd.type !== 'bind-each') {
      // deferred-self 解決済みの非 bind-each コマンドはここには来ないはずだが念のため
      scope._append(cmd);
    } else {
      stillPending.push(cmd);
    }
  }
  internals._pending.length = 0;
  for (const cmd of stillPending) {
    internals._pending.push(cmd);
  }
}
