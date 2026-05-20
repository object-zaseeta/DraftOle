/**
 * Task 2.3 (html-tag-responsibility-split): `_internal/proto-render-pipeline.ts` の
 * 4 関数（`flushPendingStyleTemplates` / `decideScopeClasses` /
 * `rewriteDeferredSelfTargets` / `flushPostEach`）と `ProtoRenderPipelineResult`
 * interface の純関数ユニットテスト。
 *
 * 検証内容:
 * - `flushPendingStyleTemplates`:
 *   - `_pendingStyleTemplates` が空のとき空配列を返す
 *   - `tagPath` 未確定のとき空配列を返す
 *   - 通常ケース: 既存 `protoRender` と同じ className 列を返し、`CssManager` 側に
 *     ルールが登録される
 * - `decideScopeClasses`:
 *   - hasCss / pending / tagPath いずれも未充足 → `scopeClassApplied: false`、
 *     `_attributes` 変化なし
 *   - hasCss あり + tagPath あり → class 属性に scope class が追加される
 *   - 既存 class 属性ありの場合は append（`HtmlAttribute.className` 経由）
 *   - templateClassNames が non-empty → scope class なしでも class 属性に追加される
 * - `rewriteDeferredSelfTargets`:
 *   - `ctx.factoryExtraction === true` → no-op
 *   - id 属性ありで `_pending` に deferred-self → `#id` セレクタに rewrite
 *   - id なし + bindings あり + tagPath あり → `._<classHash>` セレクタに rewrite
 *   - `_scope` 存在時、bind-each closure 未確定以外を `_scope._append` 転送
 * - `flushPostEach`:
 *   - `_pending` 内 bind-each（factoryCode 確定済み）→ `_eachTemplateSnapshots` に
 *     append + `_scope._append`
 *   - factoryCode 未確定の bind-each は `_pending` に残置
 *   - `_scope === undefined` の場合は no-op
 * - end-to-end 等価性: `div().css...().pending...` を構築し、`protoRender(ctx)`
 *   実行前後のスナップショットと、4 helper を順番に呼んだ後のスナップショットが
 *   等価であることを確認
 *
 * Requirements: 3.1, 3.3, 3.4, 3.5, 6.3
 * Design: design.md "Components and Interfaces" →
 *         `_internal/proto-render-pipeline.ts` (Service Interface) /
 *         "System Flows" sequence diagram / "Allowed Dependencies"
 */
import { describe, expect, it } from 'vitest';
import { createStyleTemplate } from '../../../../src/css/variables/style-template.js';
import { HtmlAttribute } from '../../../../src/html/attributes/html-attribute.js';
import {
  type ProtoRenderPipelineResult,
  decideScopeClasses,
  flushPendingStyleTemplates,
  flushPostEach,
  rewriteDeferredSelfTargets,
} from '../../../../src/html/elements/_internal/proto-render-pipeline.js';
import { HtmlTag } from '../../../../src/html/elements/html-tag.js';
import { createDefaultRenderContext } from '../../../../src/html/elements/render-context.js';
import type { HtmlAttributeShape } from '../../../../src/html/protocols/html-tag-protocol.js';
import type { TagType } from '../../../../src/html/tags/tag-type.js';
import type { VanillaCommand } from '../../../../src/js/vanilla/commands.js';
import type { ElementTarget } from '../../../../src/js/vanilla/element-target.js';
import type { EachTemplateSnapshot } from '../../../../src/js/vanilla/state/each-template.js';

/** テスト用具象サブクラス（`HtmlTag` は abstract）。 */
class TestTag extends HtmlTag {
  constructor(tagType: TagType = 'div') {
    super(tagType);
  }
}

/** helper が触る内部面の narrow 型（テスト側からの観測用）。 */
type Internals = {
  _attributes: HtmlAttributeShape[];
  _pending: VanillaCommand[];
  _eachTemplateSnapshots: VanillaCommand[];
  _scope?: { _append(cmd: VanillaCommand): void } | undefined;
};

const internals = (tag: HtmlTag): Internals => tag as Internals;

/** `tagPath` を確定済みにする（`CssManagerInstance.updateTagPath` 経由）。 */
function setTagPath(tag: HtmlTag, path: string): void {
  // `updateTagPath` は `CssManagerInstance` の public API（html-tag.ts:489 参照）。
  tag.css.updateTagPath(path);
}

/** `_scope` 互換のスパイ。`_append` 呼び出し列を `appended` に記録する。 */
function makeScopeSpy(): { scope: { _append(cmd: VanillaCommand): void }; appended: VanillaCommand[] } {
  const appended: VanillaCommand[] = [];
  const scope = {
    _append(cmd: VanillaCommand): void {
      appended.push(cmd);
    },
  };
  return { scope, appended };
}

/** deferred-self target の bind-text コマンドを作る。 */
function makeDeferredBindText(stateId: string): VanillaCommand {
  return {
    type: 'bind-text',
    target: { kind: 'deferred-self' } as ElementTarget,
    stateId,
  };
}

/** `factoryCode` 確定済みの bind-each コマンドを作る。 */
function makeReadyBindEach(stateId: string, code: string): VanillaCommand {
  const template: EachTemplateSnapshot = {
    itemStateIdPattern: `${stateId}.item{i}`,
    templateCommands: [],
    factoryCode: code,
    factoryKind: 'closure',
  };
  return {
    type: 'bind-each',
    target: { kind: 'deferred-self' } as ElementTarget,
    stateId,
    template,
  };
}

/** `factoryCode` 未確定の bind-each コマンドを作る。 */
function makePendingBindEach(stateId: string): VanillaCommand {
  const template: EachTemplateSnapshot = {
    itemStateIdPattern: `${stateId}.item{i}`,
    templateCommands: [],
    factoryCode: undefined,
    factoryKind: 'closure',
  };
  return {
    type: 'bind-each',
    target: { kind: 'deferred-self' } as ElementTarget,
    stateId,
    template,
  };
}

describe('_internal/proto-render-pipeline', () => {
  // ────────────────────────────────────────────────────────────
  // flushPendingStyleTemplates
  // ────────────────────────────────────────────────────────────

  describe('flushPendingStyleTemplates', () => {
    it('`_pendingStyleTemplates` が空のときは空配列を返し、副作用を起こさない', () => {
      const tag = new TestTag();
      setTagPath(tag, 'div.0');
      const ctx = createDefaultRenderContext();
      const before = tag.css.renderCss();

      const result = flushPendingStyleTemplates(tag, ctx);

      expect(result).toEqual([]);
      expect(tag.css.renderCss()).toBe(before);
    });

    it('`tagPath` が未確定のときは空配列を返し、CssManager に流さない', () => {
      const tag = new TestTag();
      tag.addStyleTemplates([createStyleTemplate({ properties: { color: 'red' } })]);
      // tagPath は updateTagPath 未呼び出しのまま（既存 644 行の guard と同条件）。
      const ctx = createDefaultRenderContext();
      const before = tag.css.renderCss();

      const result = flushPendingStyleTemplates(tag, ctx);

      expect(result).toEqual([]);
      expect(tag.css.renderCss()).toBe(before);
    });

    it('通常ケース: registerTemplate に転送し、解決済み className 群を順序保持で返す', () => {
      const tag = new TestTag();
      setTagPath(tag, 'div.0');
      const t1 = createStyleTemplate({ properties: { color: 'red' } });
      const t2 = createStyleTemplate({ properties: { background: 'blue' } });
      tag.addStyleTemplates([t1, t2]);
      const ctx = createDefaultRenderContext();

      const result = flushPendingStyleTemplates(tag, ctx);

      expect(result).toHaveLength(2);
      // 返り値は readonly string[]。実値は IdentifierResolver 由来の決定的ハッシュ。
      for (const cls of result) {
        expect(typeof cls).toBe('string');
        expect(cls.length).toBeGreaterThan(0);
      }
      // CssManager 側にルールが登録されたことを renderCss() 出力で確認。
      // 出力フォーマットは pretty-printed（`prop: value;`）。
      const css = tag.css.renderCss();
      expect(css).toContain('color: red');
      expect(css).toContain('background: blue');
    });
  });

  // ────────────────────────────────────────────────────────────
  // decideScopeClasses
  // ────────────────────────────────────────────────────────────

  describe('decideScopeClasses', () => {
    it('hasCss / pending / tagPath いずれも未充足 → scopeClassApplied=false で副作用なし', () => {
      const tag = new TestTag();
      const ctx = createDefaultRenderContext();
      const before = [...internals(tag)._attributes];

      const result = decideScopeClasses(tag, ctx, []);

      expect(result).toEqual<ProtoRenderPipelineResult>({
        extraClasses: [],
        scopeClassApplied: false,
      });
      expect(internals(tag)._attributes).toEqual(before);
    });

    it('hasCss あり + tagPath あり → class 属性に scope class が追加される', () => {
      const tag = new TestTag();
      setTagPath(tag, 'div.0');
      tag.color('red');
      const ctx = createDefaultRenderContext();

      const result = decideScopeClasses(tag, ctx, []);

      expect(result.scopeClassApplied).toBe(true);
      expect(result.extraClasses).toHaveLength(1);
      const classAttr = internals(tag)._attributes.find(a => a.key === 'class');
      if (classAttr === undefined) {
        throw new Error('class attribute should be present');
      }
      // 追加された scope class が含まれる。
      const [scopeClass] = result.extraClasses;
      if (scopeClass === undefined) {
        throw new Error('extraClasses[0] should be present');
      }
      if (classAttr.attributeValue.type === 'keyValue') {
        expect(classAttr.attributeValue.value).toContain(scopeClass);
      } else {
        throw new Error('class attribute should be keyValue');
      }
    });

    it('既存 class 属性ありの場合は HtmlAttribute.className 経由で append される', () => {
      const tag = new TestTag();
      setTagPath(tag, 'div.0');
      tag.color('red');
      tag.addHtmlAttribute(HtmlAttribute.className('user-class'));
      const ctx = createDefaultRenderContext();

      const result = decideScopeClasses(tag, ctx, []);

      const classAttrs = internals(tag)._attributes.filter(a => a.key === 'class');
      // class 属性は 1 件のまま（上書き）で、user-class と scope class の両方を含む。
      expect(classAttrs).toHaveLength(1);
      const [first] = classAttrs;
      if (first === undefined) throw new Error('class attribute should exist');
      const av = first.attributeValue;
      if (av.type !== 'keyValue') throw new Error('class must be keyValue');
      const [scopeClass] = result.extraClasses;
      if (scopeClass === undefined) throw new Error('extraClasses[0] should be present');
      expect(av.value).toContain('user-class');
      expect(av.value).toContain(scopeClass);
    });

    it('templateClassNames が non-empty → scope class なしでも class 属性に追加される', () => {
      const tag = new TestTag();
      // hasCss なし、tagPath なしでも templateClassNames だけで追加される。
      const ctx = createDefaultRenderContext();

      const result = decideScopeClasses(tag, ctx, ['tpl-abc', 'tpl-def']);

      expect(result.scopeClassApplied).toBe(false);
      expect(result.extraClasses).toEqual(['tpl-abc', 'tpl-def']);
      const classAttr = internals(tag)._attributes.find(a => a.key === 'class');
      if (classAttr === undefined) {
        throw new Error('class attribute should be present');
      }
      if (classAttr.attributeValue.type !== 'keyValue') {
        throw new Error('class must be keyValue');
      }
      expect(classAttr.attributeValue.value).toContain('tpl-abc');
      expect(classAttr.attributeValue.value).toContain('tpl-def');
    });
  });

  // ────────────────────────────────────────────────────────────
  // rewriteDeferredSelfTargets
  // ────────────────────────────────────────────────────────────

  describe('rewriteDeferredSelfTargets', () => {
    it('`ctx.factoryExtraction === true` の場合は no-op', () => {
      const tag = new TestTag();
      setTagPath(tag, 'div.0');
      const cmd = makeDeferredBindText('s1');
      internals(tag)._pending.push(cmd);
      // factoryExtraction を有効化した RenderContext。
      const ctx = { ...createDefaultRenderContext(), factoryExtraction: true };

      rewriteDeferredSelfTargets(tag, ctx);

      // _pending 内 deferred-self は書き換えられず、元のオブジェクト参照のまま残る。
      expect(internals(tag)._pending[0]).toBe(cmd);
      const target = (internals(tag)._pending[0] as { target: ElementTarget }).target;
      expect(target.kind).toBe('deferred-self');
    });

    it('id 属性あり + deferred-self コマンド → `#id` セレクタに rewrite される', () => {
      const tag = new TestTag();
      tag.addHtmlAttribute(HtmlAttribute.keyValue('id', 'my-btn'));
      internals(tag)._pending.push(makeDeferredBindText('s1'));
      const ctx = createDefaultRenderContext();

      rewriteDeferredSelfTargets(tag, ctx);

      const rewritten = internals(tag)._pending[0] as { target: ElementTarget };
      expect(rewritten.target).toEqual({ kind: 'sel', selector: '#my-btn' });
    });

    it('id なし + bindings あり + tagPath あり → `._<classHash>` セレクタに rewrite される', () => {
      const tag = new TestTag();
      setTagPath(tag, 'div.0');
      internals(tag)._pending.push(makeDeferredBindText('s1'));
      const ctx = createDefaultRenderContext();
      const expectedClass = ctx.resolver.resolveClassName('div.0');

      rewriteDeferredSelfTargets(tag, ctx);

      const rewritten = internals(tag)._pending[0] as { target: ElementTarget };
      expect(rewritten.target).toEqual({ kind: 'sel', selector: `.${expectedClass}` });
    });

    it('`_scope` 存在時、bind-each closure 未確定以外を `_scope._append` 転送し _pending から取り除く', () => {
      const tag = new TestTag();
      setTagPath(tag, 'div.0');
      const bindText = makeDeferredBindText('s1');
      const pendingEach = makePendingBindEach('s2');
      internals(tag)._pending.push(bindText, pendingEach);
      const { scope, appended } = makeScopeSpy();
      internals(tag)._scope = scope;
      const ctx = createDefaultRenderContext();

      rewriteDeferredSelfTargets(tag, ctx);

      // bind-text（deferred-self → sel に書き換え済み）が _scope に転送される。
      expect(appended).toHaveLength(1);
      const [appendedCmd] = appended;
      if (appendedCmd === undefined) throw new Error('appended[0] should exist');
      expect(appendedCmd.type).toBe('bind-text');
      // bind-each (closure 未確定) は _pending に残る（type === 'bind-each' を維持）。
      // ただし rewrite ループは deferred-self ターゲットをすべて書き換えるため、
      // pendingEach も target が `sel` に rewrite された **新規オブジェクト** で
      // 置き換わる（`rewriteCommandTarget` の `{ ...cmd, target }` 経由）。
      // したがって参照同一性（`toBe`）ではなく type による検査を行う。
      expect(internals(tag)._pending).toHaveLength(1);
      const [remaining] = internals(tag)._pending;
      if (remaining === undefined) throw new Error('_pending[0] should exist');
      expect(remaining.type).toBe('bind-each');
      // factoryCode 未確定であることが残置条件。
      if (remaining.type !== 'bind-each') throw new Error('expected bind-each');
      expect(remaining.template.factoryCode).toBeUndefined();
      expect(remaining.stateId).toBe('s2');
    });
  });

  // ────────────────────────────────────────────────────────────
  // flushPostEach
  // ────────────────────────────────────────────────────────────

  describe('flushPostEach', () => {
    it('`_scope === undefined` のときは no-op', () => {
      const tag = new TestTag();
      const cmd = makePendingBindEach('s1');
      internals(tag)._pending.push(cmd);

      flushPostEach(tag);

      // _scope なし → _pending は変化なし、snapshot も増えない。
      expect(internals(tag)._pending).toEqual([cmd]);
      expect(internals(tag)._eachTemplateSnapshots).toEqual([]);
    });

    it('bind-each（factoryCode 確定済み）を _eachTemplateSnapshots に append し _scope へ転送する', () => {
      const tag = new TestTag();
      const ready = makeReadyBindEach('s1', 'function(){return _e0;}');
      internals(tag)._pending.push(ready);
      const { scope, appended } = makeScopeSpy();
      internals(tag)._scope = scope;

      flushPostEach(tag);

      expect(appended).toEqual([ready]);
      expect(internals(tag)._eachTemplateSnapshots).toEqual([ready]);
      expect(internals(tag)._pending).toEqual([]);
    });

    it('bind-each（factoryCode 未確定）は _pending に残置、確定済みのみ転送される', () => {
      const tag = new TestTag();
      const ready = makeReadyBindEach('s1', 'function(){return _e0;}');
      const pending = makePendingBindEach('s2');
      internals(tag)._pending.push(ready, pending);
      const { scope, appended } = makeScopeSpy();
      internals(tag)._scope = scope;

      flushPostEach(tag);

      expect(appended).toEqual([ready]);
      expect(internals(tag)._eachTemplateSnapshots).toEqual([ready]);
      expect(internals(tag)._pending).toEqual([pending]);
    });
  });

  // ────────────────────────────────────────────────────────────
  // end-to-end 等価性（4 helper sequence vs existing protoRender）
  // ────────────────────────────────────────────────────────────

  describe('end-to-end 等価性 (4 helper sequence vs existing protoRender)', () => {
    /**
     * 同条件の `TestTag` を 2 つ作り:
     *   - tagA: 既存 `protoRender(ctx)` を呼ぶ
     *   - tagB: helper 4 つを順番に（design.md System Flows の順序で）呼ぶ
     * その後 `_attributes` / `_pending` の状態（および出力 HTML 文字列）を
     * 比較して bytewise 等価であることを確認する。
     *
     * 注意: `protoRender` は `resolveEachFactories` も呼ぶため、helper 経路でも
     * 同関数を間に挟む（design.md "System Flows" の固定順序）。
     */
    it('css + pending bindings ありの典型ケースで helper 4 段が protoRender と等価', async () => {
      const { resolveEachFactories } = await import(
        '../../../../src/html/elements/each-factory-resolver.js'
      );

      function buildTag(): HtmlTag {
        const tag = new TestTag();
        setTagPath(tag, 'div.0');
        tag.color('red');
        // bindings: deferred-self target を持つ bind-text を 1 件積む。
        internals(tag)._pending.push(makeDeferredBindText('s1'));
        return tag;
      }

      const tagA = buildTag();
      const tagB = buildTag();

      const ctxA = createDefaultRenderContext();
      const ctxB = createDefaultRenderContext();

      // 経路 A: 既存 protoRender
      const htmlA = tagA.protoRender(ctxA);

      // 経路 B: helper 4 段 + resolveEachFactories を design.md System Flows 順に実行
      const templateClassNames = flushPendingStyleTemplates(tagB, ctxB);
      decideScopeClasses(tagB, ctxB, templateClassNames);
      rewriteDeferredSelfTargets(tagB, ctxB);
      resolveEachFactories(tagB, ctxB);
      flushPostEach(tagB);

      // 属性配列: 同型・同値であること（HtmlAttribute は不変オブジェクトのため deep equal で OK）
      expect(internals(tagB)._attributes).toEqual(internals(tagA)._attributes);

      // _pending: bind-text の target が同じセレクタに書き換わっていることを確認
      // （protoRender 側は _pending を rewrite した上で _scope 未設定なら配列に残置する）
      expect(internals(tagB)._pending).toEqual(internals(tagA)._pending);

      // _eachTemplateSnapshots は bind-each なしなのでどちらも空のまま
      expect(internals(tagB)._eachTemplateSnapshots).toEqual(
        internals(tagA)._eachTemplateSnapshots,
      );

      // 参考: A 側の HTML 出力は `<div class="...">` を含むことを確認（sanity check）
      expect(htmlA.startsWith('<div')).toBe(true);
    });
  });
});
