/**
 * Task 5.1: varName 経由でクラス名が HTML/CSS に反映される統合テスト
 *
 * `StyleTemplate.debugVarName` をビルド時 transformer 相当の後段状態として
 * 直接埋め込み（`__draftole_label__`）、`el.div({ css: template })` 経由で
 * Root にぶら下げ、render() / collectCssStyleString() で出力された
 * HTML と CSS の双方に varName を含むクラス名が現れることを確認する。
 *
 * Boundary: 本テストは transformer 経路を経由しない（4.8 が担う）。
 * 代わりに `StyleTemplate.debugVarName` をすでに付与された状態を
 * `__draftole_label__` で構築し、render パイプライン下流のみを検証する。
 *
 * Requirements: 1.x, 2.x, 3.x, 4.3, 5.1
 */
import { describe, it, expect } from 'vitest';
import { Root } from '../../../src/html/elements/root.js';
import { div } from '../../../src/html/tags/factories.js';
import { createStyleTemplate } from '../../../src/css/variables/style-template.js';
import { __draftole_label__ } from '../../../src/css/variables/style-template-label.js';

// ============================================================
// 結合テスト: debugVarName 付き StyleTemplate を render する
// ============================================================

describe('varName 付き StyleTemplate の HTML/CSS 反映', () => {
  it('debugVarName: "card" を付与した template を div に css: 適用すると HTML/CSS の双方に varName 含むクラス名が現れる', () => {
    const root = new Root();

    // transformer 後段相当: __draftole_label__ で debugVarName を付与
    const cardTpl = __draftole_label__(
      createStyleTemplate({
        properties: { display: 'flex', gap: '8px' },
      }),
      'card',
    );

    // sanity: ラベルが付与されている
    expect(cardTpl.debugVarName).toBe('card');

    root.addChild(div({ css: cardTpl }, 'content'));

    const html = root.render();
    const css = root.collectCssStyleString();

    // 期待クラス名形状: `_<sanitized-tagPath>_card__<8 hex bodyHash>`
    const classRegex = /_[a-z0-9-]+_card__[0-9a-f]{8}/;

    expect(html).toMatch(classRegex);
    expect(css).toMatch(classRegex);

    // HTML と CSS で同一クラス名が使われていることを確認
    const htmlMatch = html.match(classRegex);
    const cssMatch = css.match(classRegex);
    expect(htmlMatch).not.toBeNull();
    expect(cssMatch).not.toBeNull();
    expect(htmlMatch![0]).toBe(cssMatch![0]);

    // CSS ルール本体が含まれていることを確認
    expect(css).toContain('display: flex');
    expect(css).toContain('gap: 8px');
    expect(css).toContain(`.${cssMatch![0]}`);

    // HTML 側は class 属性で参照されている
    expect(html).toContain(`class="${htmlMatch![0]}"`);
  });

  it('debugVarName 未設定の template（既存挙動）はクラス名に varName フラグメントを持たない', () => {
    const root = new Root();

    // 通常の createStyleTemplate: debugVarName を付与しない
    const plainTpl = createStyleTemplate({
      properties: { color: 'red', padding: '4px' },
    });
    expect(plainTpl.debugVarName).toBeUndefined();

    root.addChild(div({ css: plainTpl }, 'plain'));

    const html = root.render();
    const css = root.collectCssStyleString();

    // バイト等価維持: varName 区切り `_<word>_<word>__<hash>` 形は出現しない。
    // 既存の template 経路は `_<prefix>__<bodyHash>` または legacy
    // `_<djb2(tagPath)>_<djb2(bodyHash)>` 形式（identifier-resolver の
    // bodyHash 指定経路）。本テストでは varName セグメントが含まれない
    // ことを negative assertion で確認する。
    expect(html).not.toMatch(/_[a-z0-9-]+_card__[0-9a-f]{8}/);
    expect(css).not.toMatch(/_[a-z0-9-]+_card__[0-9a-f]{8}/);

    // CSS ルール本体は出力されている
    expect(css).toContain('color: red');
    expect(css).toContain('padding: 4px');
  });

  it('複数階層: 親 (debugVarName: "panel") と子 (debugVarName: "btn") の双方で varName 付きクラス名が出力される', () => {
    const root = new Root();

    const panelTpl = __draftole_label__(
      createStyleTemplate({
        properties: { display: 'block', padding: '10px' },
      }),
      'panel',
    );
    const btnTpl = __draftole_label__(
      createStyleTemplate({
        properties: { cursor: 'pointer', color: 'blue' },
      }),
      'btn',
    );

    root.addChild(
      div(
        { css: panelTpl },
        div({ css: btnTpl }, 'click'),
      ),
    );

    const html = root.render();
    const css = root.collectCssStyleString();

    const panelRegex = /_[a-z0-9-]+_panel__[0-9a-f]{8}/;
    const btnRegex = /_[a-z0-9-]+_btn__[0-9a-f]{8}/;

    expect(html).toMatch(panelRegex);
    expect(html).toMatch(btnRegex);
    expect(css).toMatch(panelRegex);
    expect(css).toMatch(btnRegex);

    // CSS ルールに各 varName 付きクラス名のセレクタが存在する
    const panelClass = css.match(panelRegex)![0];
    const btnClass = css.match(btnRegex)![0];
    expect(css).toContain(`.${panelClass}`);
    expect(css).toContain(`.${btnClass}`);
    expect(panelClass).not.toBe(btnClass);
  });
});
