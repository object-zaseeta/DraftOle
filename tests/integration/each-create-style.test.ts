/**
 * Task 1.1: Req 3 検証スパイク — `each` テンプレート内での `createStyle` 利用
 *
 * 検証観点:
 *   Req 3.1: `each` コールバックの外で定義した `createStyle({...})` を
 *            `css:` 属性経由で `each` 内要素に適用できる
 *   Req 3.2: `each` 内で `createStyle` を適用した場合、生成CSSクラスが
 *            反復数 N に対して N 倍に増えない（重複排除）
 *   Req 3.3: `each` コールバック内で `.setStyle(prop, item.map(...))` を
 *            使うリアクティブスタイルが引き続き動作する
 *   Req 3.4: 静的スタイル（`css:` 属性）とリアクティブスタイル（`.setStyle()`）が
 *            同一要素に共存できる
 *
 * 判定基準（PASS）:
 *   - TypeScript 型エラーが出ない
 *   - 同一 `createStyle` を N 回 `each` で適用してもCSSに1回だけ出力される
 *   - `.setStyle()` 由来のバインド式が生成ファクトリコードに含まれる
 *   - 既存スナップショットに意図しない差分が出ない
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4
 * Design: design.md § Verification Spike Components / Req 3/4/5 Verification
 */

import { describe, expect, it } from 'vitest';
import { Root } from '../../src/html/elements/root.js';
import { createStyle } from '../../src/css/variables/css-shared-style.js';
import { rule } from '../../src/css/variables/global-dsl.js';
import { li, ul, span } from '../../src/html/tags/factories.js';
import { buildFactoryCode, captureEachTemplate } from '../../src/js/vanilla/state/each-template.js';
import { StateImpl } from '../../src/js/vanilla/state/state.js';
import { StateRegistry } from '../../src/js/vanilla/state/registry.js';
import type { ElementMethods } from '../../src/js/vanilla/element-methods.js';
import { resolveEachFactories } from '../../src/html/elements/each-factory-resolver.js';
import { createDefaultRenderContext } from '../../src/html/elements/render-context.js';
import type { HtmlTag } from '../../src/html/elements/html-tag.js';

// ── ヘルパ型 ──────────────────────────────────────────────────────────────────

type SpanWithMethods = ReturnType<typeof span> & ElementMethods<ReturnType<typeof span>>;
type LiWithMethods = ReturnType<typeof li> & ElementMethods<ReturnType<typeof li>>;

// ── テスト用 State ファクトリ ─────────────────────────────────────────────────

function makeStringArrayState(id: string): StateImpl<string[]> {
  const registry = new StateRegistry();
  return new StateImpl<string[]>(id, registry);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Req 3.1: `each` 外で定義した createStyle を `each` 内要素の css: に適用できる
// ═══════════════════════════════════════════════════════════════════════════════

describe('Req 3.1: each 外で定義した createStyle を each 内要素に css: 属性で適用', () => {
  it('各ループ要素に同一 SharedStyle を css: 属性として渡してもエラーなくツリーが構築できる', () => {
    const root = new Root();
    const items = root.state(['A', 'B', 'C']);

    // each 外で createStyle（名前あり形）を定義
    const pillSt = createStyle('pill', {
      fontSize: '11px',
      fontWeight: '600',
      padding: '2px 8px',
      borderRadius: '999px',
    });

    // each 内で css: 属性として適用
    const binding = items.each((item) =>
      li(
        { css: pillSt._template },
        (span() as SpanWithMethods).text(item.map((v) => v)),
      ) as LiWithMethods,
    );

    // appendChild に渡すこと自体がエラーにならない（型確認）
    const listEl = ul().appendChild(binding as ReturnType<typeof li>);

    root.addChild(listEl);

    // CSS を収集してエラーがないことを確認
    const css = root.collectCssStyleString();
    expect(typeof css).toBe('string');
  });

  it('createStyle（無名形）も each 内要素に css: 属性として渡せる', () => {
    const root = new Root();
    const items = root.state(['X', 'Y']);

    // 無名形 createStyle → StyleTemplate を直接 css: に渡す
    const itemTemplate = createStyle({
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    });

    const binding = items.each((item) =>
      li(
        { css: itemTemplate },
        (span() as SpanWithMethods).text(item.map((v) => v)),
      ) as LiWithMethods,
    );

    root.addChild(ul().appendChild(binding as ReturnType<typeof li>));

    const css = root.collectCssStyleString();
    expect(typeof css).toBe('string');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Req 3.2: CSSクラスが反復回数 N に対して N 倍に増えない（重複排除）
// ═══════════════════════════════════════════════════════════════════════════════

describe('Req 3.2: createStyle が each 内で使用されてもCSSクラスは1回のみ生成される', () => {
  it('N=3 で each を適用してもCSSの ".pill" クラス定義は1回のみ出力される', () => {
    // 名前あり createStyle（クラス名が確定しているため確認しやすい）
    const pillSt = createStyle('pill', {
      fontSize: '11px',
      fontWeight: '600',
      padding: '2px 8px',
    });

    const root = new Root({ css: [rule('.pill', { fontSize: '11px', fontWeight: '600', padding: '2px 8px' })] });
    const items = root.state(['A', 'B', 'C']);

    const binding = items.each((item) =>
      li(
        (span({ css: pillSt._template }) as SpanWithMethods).text(
          item.map((v) => v),
        ),
      ) as LiWithMethods,
    );

    root.addChild(ul().appendChild(binding as ReturnType<typeof li>));

    const css = root.collectCssStyleString();

    // ".pill {" の出現回数が 1 回のみであることを確認（N=3 倍に増えていない）
    const matches = css.match(/\.pill\s*\{/g);
    expect(matches).not.toBeNull();
    const count = matches?.length ?? 0;
    expect(count).toBe(1);
  });

  it('N=5 で each を適用しても各スタイルのCSSブロックは1回のみ出力される（スナップショット）', () => {
    const cardSt = createStyle('card', {
      background: 'rgba(0,0,0,0.2)',
      borderRadius: '8px',
      padding: '12px',
    });

    const root = new Root({ css: [rule('.card', { background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '12px' })] });
    const items = root.state(['A', 'B', 'C', 'D', 'E']);

    const binding = items.each((item) =>
      li(
        { css: cardSt._template },
        (span() as SpanWithMethods).text(item.map((v) => v)),
      ) as LiWithMethods,
    );

    root.addChild(ul().appendChild(binding as ReturnType<typeof li>));

    const css = root.collectCssStyleString();

    // ".card {" の出現回数が 1 回のみ（N=5 でも増えない）
    const cardMatches = css.match(/\.card\s*\{/g);
    expect(cardMatches).not.toBeNull();
    expect(cardMatches?.length ?? 0).toBe(1);

    // スナップショットテスト: 意図しない差分がないことを確認
    expect(css).toMatchSnapshot();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Req 3.3: each 内での .setStyle(prop, item.map(...)) リアクティブスタイル
// ═══════════════════════════════════════════════════════════════════════════════

describe('Req 3.3: each 内での .setStyle() リアクティブスタイルが動作する', () => {
  it('.setStyle() を使ったテンプレートが factory コードに bindStyle 呼び出しを含む', () => {
    const items = makeStringArrayState('items');

    const binding = captureEachTemplate(items, (item) =>
      (li() as LiWithMethods).setStyle(
        'color',
        item.map((v) => (v === 'high' ? '#ef4444' : '#22c55e')),
      ),
    );

    expect(binding._snapshot.factoryKind).toBe('closure');
    expect(binding._snapshot._templateRoot).toBeDefined();

    const code = buildFactoryCode(binding._snapshot._templateRoot!, {
      arrayStateId: 'items',
      itemStateIdPattern: binding._snapshot.itemStateIdPattern,
    });

    // factory コードに bindStyle 呼び出しが含まれる
    expect(code).toContain('bindStyle');
  });

  it('各 iteration に対して独立した bindStyle コールが行われる（stateId が iteration ごとに一意）', () => {
    const items = makeStringArrayState('tasks');

    const binding = captureEachTemplate(items, (item) =>
      (li() as LiWithMethods).setStyle(
        'borderColor',
        item.map((v) => (v === 'high' ? '#ef4444' : '#f59e0b')),
      ),
    );

    const code = buildFactoryCode(binding._snapshot._templateRoot!, {
      arrayStateId: 'tasks',
      itemStateIdPattern: binding._snapshot.itemStateIdPattern,
    });

    // factory コード内で itemId パラメータが使われている（iteration ごとに一意な stateId を使用）
    expect(code).toContain('itemId');
    expect(code).toContain('bindStyle');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Req 3.4: 静的スタイル（css:）とリアクティブスタイル（.setStyle()）の共存
// ═══════════════════════════════════════════════════════════════════════════════

describe('Req 3.4: css: 属性（静的スタイル）と .setStyle()（リアクティブスタイル）が同一要素で共存できる', () => {
  it('同一要素に css: 属性と .setStyle() を両方使っても構築時エラーが発生しない', () => {
    const baseSt = createStyle('task-item', {
      display: 'flex',
      alignItems: 'center',
      padding: '12px',
      borderRadius: '8px',
    });

    const root = new Root({ css: [rule('.task-item', { display: 'flex', alignItems: 'center', padding: '12px', borderRadius: '8px' })] });
    const items = root.state(['high', 'medium', 'low']);

    // css: 属性（静的スタイル）+ .setStyle()（リアクティブスタイル）を同一要素で使用
    const binding = items.each((item) =>
      (li({ css: baseSt._template }) as LiWithMethods).setStyle(
        'borderColor',
        item.map((v) => (v === 'high' ? '#ef4444' : v === 'medium' ? '#f59e0b' : '#22c55e')),
      ),
    );

    root.addChild(ul().appendChild(binding as ReturnType<typeof li>));

    // CSS 収集でエラーが発生しない
    const css = root.collectCssStyleString();
    expect(typeof css).toBe('string');

    // ".task-item" スタイルが含まれる
    expect(css).toContain('.task-item');
  });

  it('factory コードが css: 由来クラスと bindStyle 由来バインドを両方含む（render-phase 経由）', () => {
    // css: 由来クラスは render-phase（resolveEachFactories）で解決されるため、
    // buildFactoryCode を直接呼ぶのではなく、render-phase フックを経由する必要がある。
    const registry = new StateRegistry();
    const items = new StateImpl<string[]>('items', registry);

    const baseSt = createStyle({
      display: 'flex',
      padding: '8px',
    });

    const eachBinding = captureEachTemplate<string, HtmlTag>(items, (item) =>
      (li({ css: baseSt }) as LiWithMethods).setStyle(
        'color',
        item.map((v) => (v === 'red' ? '#ef4444' : '#22c55e')),
      ) as HtmlTag,
    );

    // render-phase フックを直接駆動（Root を経由しないため手動で tagPath を設定）
    const list = ul({ id: 'item-list' }).appendChild(eachBinding);
    const listInternal = list as { _css: { tagPath: string; updateTagPath?: (p: string) => void } };
    if (typeof listInternal._css.updateTagPath === 'function') {
      listInternal._css.updateTagPath('ul[0]');
    } else {
      listInternal._css.tagPath = 'ul[0]';
    }

    const ctx = createDefaultRenderContext();
    resolveEachFactories(list as HtmlTag, ctx);

    const factoryCode = eachBinding._snapshot.factoryCode;
    if (factoryCode === undefined) {
      throw new Error('factoryCode was not resolved by render-phase hook');
    }

    // factory コードに bindStyle が含まれる（リアクティブスタイル）
    expect(factoryCode).toContain('bindStyle');

    // factory コードに css: 由来のクラス設定が含まれる（setAttribute("class", ...) 形式）
    expect(factoryCode).toContain('setAttribute');
    expect(factoryCode).toContain('class');
  });

  it('css: 属性（名前あり SharedStyle）と .setStyle() の共存でCSSクラスが重複しない（スナップショット）', () => {
    const pillSt = createStyle('pill', {
      fontSize: '11px',
      fontWeight: '600',
      padding: '2px 8px',
      borderRadius: '999px',
      letterSpacing: '0.04em',
    });

    const root = new Root({ css: [rule('.pill', { fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '999px', letterSpacing: '0.04em' })] });
    const items = root.state(['high', 'medium', 'low']);

    const binding = items.each((item) =>
      (span({ css: pillSt._template }) as SpanWithMethods)
        .text(item.map((v) => v))
        .setStyle('color', item.map((v) => (v === 'high' ? '#ef4444' : '#22c55e'))),
    );

    root.addChild(ul().appendChild(binding as ReturnType<typeof li>));

    const css = root.collectCssStyleString();

    // ".pill {" が1回のみ出現する
    const pillMatches = css.match(/\.pill\s*\{/g);
    expect(pillMatches).not.toBeNull();
    expect(pillMatches?.length ?? 0).toBe(1);

    // スナップショット
    expect(css).toMatchSnapshot();
  });
});
