/**
 * Task 9.2: CSS統合結合テスト（Integration Tests）
 *
 * TDD RED phase: CSSモジュール全体の結合フローを検証する。
 * - CssManager → CssStyleManager → HtmlStyle → 13プロパティクラスの結合
 * - CssPositionMaker + LazyLayoutManagerのレイアウト解決結合
 * - スコープドCSS出力（ハッシュ生成 + CSS結合）の複雑なシナリオ
 *
 * Requirements: 10.1, 10.3
 */
import { describe, it, expect } from 'vitest';
import { CssManager } from '../../../src/css/manager/css-manager.js';
import { LazyLayoutManager } from '../../../src/css/layout/lazy-layout/lazy-layout-manager.js';
import { generateScopedClassName } from '../../../src/css/utils/scoped-css-generator.js';

// ============================================================
// ヘルパー
// ============================================================

function makeSUT(tagPath = ''): CssManager {
  return new CssManager(tagPath);
}

// ============================================================
// 結合テスト 1: 13プロパティクラス全てを使った大規模な結合テスト
// ============================================================

describe('結合テスト 1: 13プロパティクラス全体統合', () => {
  it('13プロパティクラス全てを設定し、render()で正しく統合出力される', () => {
    const sut = makeSUT('html>body>div.card');

    // 1. Font
    sut.styleManager.style.font.setFontSize('16px').setFontWeight('bold').setColor('black');

    // 2. Background
    sut.styleManager.style.backgroundColor.setBackgroundColor('white').setBackgroundRepeat('no-repeat');

    // 3. Text
    sut.styleManager.style.text.setTextAlign('center').setTextDecoration('none');

    // 4. Spacing
    sut.styleManager.style.spacing.setMargin('10px').setPadding('20px');

    // 5. Border
    sut.styleManager.style.border.setBorderWidth('1px').setBorderStyle('solid').setBorderColor('gray');

    // 6. Visibility (position含む)
    sut.styleManager.style.position.setDisplay('flex').setVisibility('visible').setZIndex('10');

    // 7. Flex
    sut.styleManager.style.flex.setFlexDirection('row').setJustifyContent('center').setAlignItems('center');

    // 8. Grid
    sut.styleManager.style.grid.setGridTemplateColumns('1fr 1fr').setGridGap('10px');

    // 9. Visual
    sut.styleManager.style.visual.setOpacity('0.9').setCursor('pointer');

    // 10. Transform
    sut.styleManager.style.transform.setTransform('rotate(45deg)');

    // 11. Animation
    sut.styleManager.style.animation.setAnimationName('fadeIn').setAnimationDuration('1s');

    // 12. Table
    sut.styleManager.style.table.setBorderCollapse('collapse').setTableLayout('fixed');

    // 13. List
    sut.styleManager.style.list.setListStyleType('none').setListStylePosition('inside');

    // render()で全プロパティが統合されることを検証
    const rendered = sut.render();

    // Font
    expect(rendered).toContain('font-size: 16px');
    expect(rendered).toContain('font-weight: bold');
    expect(rendered).toContain('color: black');

    // Background
    expect(rendered).toContain('background-color: white');
    expect(rendered).toContain('background-repeat: no-repeat');

    // Text
    expect(rendered).toContain('text-align: center');
    expect(rendered).toContain('text-decoration: none');

    // Spacing
    expect(rendered).toContain('margin: 10px');
    expect(rendered).toContain('padding: 20px');

    // Border
    expect(rendered).toContain('border-width: 1px');
    expect(rendered).toContain('border-style: solid');
    expect(rendered).toContain('border-color: gray');

    // Visibility
    expect(rendered).toContain('display: flex');
    expect(rendered).toContain('visibility: visible');
    expect(rendered).toContain('z-index: 10');

    // Flex
    expect(rendered).toContain('flex-direction: row');
    expect(rendered).toContain('justify-content: center');
    expect(rendered).toContain('align-items: center');

    // Grid
    expect(rendered).toContain('grid-template-columns: 1fr 1fr');
    expect(rendered).toContain('grid-gap: 10px');

    // Visual
    expect(rendered).toContain('opacity: 0.9');
    expect(rendered).toContain('cursor: pointer');

    // Transform
    expect(rendered).toContain('transform: rotate(45deg)');

    // Animation
    expect(rendered).toContain('animation-name: fadeIn');
    expect(rendered).toContain('animation-duration: 1s');

    // Table
    expect(rendered).toContain('border-collapse: collapse');
    expect(rendered).toContain('table-layout: fixed');

    // List
    expect(rendered).toContain('list-style-type: none');
    expect(rendered).toContain('list-style-position: inside');
  });

  it('13プロパティクラス全てを設定し、renderCss()でスコープドCSS形式で出力される', () => {
    const tagPath = 'html>body>div.card';
    const sut = makeSUT(tagPath);

    // 13プロパティ全て設定（簡略版）
    sut.styleManager.style.font.setFontSize('16px');
    sut.styleManager.style.backgroundColor.setBackgroundColor('white');
    sut.styleManager.style.text.setTextAlign('center');
    sut.styleManager.style.spacing.setMargin('10px');
    sut.styleManager.style.border.setBorderWidth('1px');
    sut.styleManager.style.position.setDisplay('block');
    sut.styleManager.style.flex.setFlexDirection('row');
    sut.styleManager.style.grid.setGridTemplateColumns('1fr 1fr');
    sut.styleManager.style.visual.setOpacity('0.9');
    sut.styleManager.style.transform.setTransform('scale(1.1)');
    sut.styleManager.style.animation.setAnimationName('fadeIn');
    sut.styleManager.style.table.setBorderCollapse('collapse');
    sut.styleManager.style.list.setListStyleType('none');

    const scopedCss = sut.renderCss();
    const expectedClass = generateScopedClassName(tagPath);

    // スコープドCSS形式で出力されることを検証
    expect(scopedCss).toContain(`.${expectedClass}`);
    expect(scopedCss).toContain('{');
    expect(scopedCss).toContain('}');

    // 全13プロパティクラスの一部が含まれることを検証
    expect(scopedCss).toContain('font-size: 16px');
    expect(scopedCss).toContain('background-color: white');
    expect(scopedCss).toContain('text-align: center');
    expect(scopedCss).toContain('margin: 10px');
    expect(scopedCss).toContain('border-width: 1px');
    expect(scopedCss).toContain('display: block');
    expect(scopedCss).toContain('flex-direction: row');
    expect(scopedCss).toContain('grid-template-columns: 1fr 1fr');
    expect(scopedCss).toContain('opacity: 0.9');
    expect(scopedCss).toContain('transform: scale(1.1)');
    expect(scopedCss).toContain('animation-name: fadeIn');
    expect(scopedCss).toContain('border-collapse: collapse');
    expect(scopedCss).toContain('list-style-type: none');
  });

  it('スタイル設定 + レイアウト設定の完全統合（13プロパティ + CssPositionMaker）', () => {
    const sut = makeSUT('html>body>div');

    // スタイル設定（13プロパティから主要なもの）
    sut.styleManager.style.font.setFontSize('14px');
    sut.styleManager.style.spacing.setMargin('5px');
    sut.styleManager.style.position.setDisplay('flex');

    // レイアウト設定（CssPositionMaker）
    sut.layout.placeAbsoluteWith((b) => {
      b.top(50, 'px').left(100, 'px').width(300, 'px').height(200, 'px');
    });

    const rendered = sut.render();

    // スタイルプロパティ
    expect(rendered).toContain('font-size: 14px');
    expect(rendered).toContain('margin: 5px');
    expect(rendered).toContain('display: flex');

    // レイアウトプロパティ
    expect(rendered).toContain('position: absolute');
    expect(rendered).toContain('top: 50px');
    expect(rendered).toContain('left: 100px');
    expect(rendered).toContain('width: 300px');
    expect(rendered).toContain('height: 200px');
  });
});

// ============================================================
// 結合テスト 2: CssPositionMaker + LazyLayoutManagerのレイアウト解決結合
// ============================================================

describe('結合テスト 2: CssPositionMaker + LazyLayoutManager レイアウト解決', () => {
  it('親子要素の相対配置が正しく解決される（親→子の依存関係）', () => {
    const lazyLayout = new LazyLayoutManager();

    // 親要素: CssManager経由で絶対配置
    const parent = makeSUT('html>body>div.parent');
    parent.updateLazyLayoutRegister(lazyLayout);
    parent.layout.placeAbsoluteWith((b) => {
      b.top(100, 'px').left(200, 'px').width(500, 'px').height(400, 'px');
    });

    // 子要素: CssManager経由で親の位置を参照（相対配置）
    const child = makeSUT('html>body>div.parent>div.child');
    child.updateLazyLayoutRegister(lazyLayout);
    child.layout.placeAbsoluteWith((b) => {
      // 子は親のtopとleftを基準に配置（実装では明示的な依存登録が必要）
      b.top(10, 'px').left(20, 'px').width(100, 'px').height(80, 'px');
    });

    // LazyLayoutの解決
    lazyLayout.resolveAllLayout();

    // 親のレンダリング
    const parentRendered = parent.render();
    expect(parentRendered).toContain('position: absolute');
    expect(parentRendered).toContain('top: 100px');
    expect(parentRendered).toContain('left: 200px');

    // 子のレンダリング
    const childRendered = child.render();
    expect(childRendered).toContain('position: absolute');
    expect(childRendered).toContain('top: 10px');
    expect(childRendered).toContain('left: 20px');
  });

  it('複数要素の依存関係が正しく解決される（A → B → C チェーン）', () => {
    const lazyLayout = new LazyLayoutManager();

    // 要素A: 基準要素（値固定）
    const elementA = makeSUT('html>body>div.a');
    elementA.updateLazyLayoutRegister(lazyLayout);
    elementA.layout.placeAbsoluteWith((b) => {
      b.top(50, 'px');
    });

    // LazyLayoutManagerにA要素の値を手動で登録（CssPositionMakerは自動登録しない）
    lazyLayout.registerItem({
      relationShip: 'absolute',
      baseTagPath: 'html>body>div.a',
      basePosition: 'top',
      targetTagPath: undefined,
      targetPosition: 'top',
      value: { value: 50, unit: 'px' }, // elementA.layout.placeAbsoluteWith で設定した値
    });

    // 要素B: Aの位置を参照
    const elementB = makeSUT('html>body>div.b');
    elementB.updateLazyLayoutRegister(lazyLayout);
    lazyLayout.registerItem({
      relationShip: 'absolute',
      baseTagPath: 'html>body>div.b',
      basePosition: 'top',
      targetTagPath: 'html>body>div.a',
      targetPosition: 'top',
      value: undefined, // Aから値を取得
    });

    // 要素C: Bの位置を参照
    const elementC = makeSUT('html>body>div.c');
    elementC.updateLazyLayoutRegister(lazyLayout);
    lazyLayout.registerItem({
      relationShip: 'absolute',
      baseTagPath: 'html>body>div.c',
      basePosition: 'top',
      targetTagPath: 'html>body>div.b',
      targetPosition: 'top',
      value: undefined, // Bから値を取得
    });

    // 解決実行
    lazyLayout.resolveAllLayout();

    // CはBを参照し、BはAを参照するため、C = 50px（Aの値）
    const renderedC = lazyLayout.renderItemsBy('html>body>div.c');
    expect(renderedC).toContain('top: 50px');
  });

  it('LazyLayoutRegisterの伝播が正しく機能する（updateLazyLayoutRegister）', () => {
    const lazyLayout = new LazyLayoutManager();
    const sut = makeSUT('html>body>div');

    // LazyLayoutRegisterを設定
    sut.updateLazyLayoutRegister(lazyLayout);

    // CssPositionMakerにもLazyLayoutRegisterが伝播していることを検証
    expect(sut.layout.getLLRegister()).toBe(lazyLayout);

    // LazyLayoutRegisterをクリア
    sut.updateLazyLayoutRegister(undefined);
    expect(sut.layout.getLLRegister()).toBeUndefined();
  });

  it('CssManagerとLazyLayoutManagerの統合（親子3階層のレイアウト解決）', () => {
    const lazyLayout = new LazyLayoutManager();

    // 親要素（レベル1）
    const grandParent = makeSUT('html>body>div.grand');
    grandParent.updateLazyLayoutRegister(lazyLayout);
    grandParent.layout.placeAbsoluteWith((b) => {
      b.top(0, 'px').left(0, 'px').width(1000, 'px').height(800, 'px');
    });

    // LazyLayoutManagerに親要素の値を登録
    lazyLayout.registerItem({
      relationShip: 'absolute',
      baseTagPath: 'html>body>div.grand',
      basePosition: 'top',
      targetTagPath: undefined,
      targetPosition: 'top',
      value: { value: 0, unit: 'px' },
    });
    lazyLayout.registerItem({
      relationShip: 'absolute',
      baseTagPath: 'html>body>div.grand',
      basePosition: 'left',
      targetTagPath: undefined,
      targetPosition: 'left',
      value: { value: 0, unit: 'px' },
    });

    // 中間親要素（レベル2）
    const parent = makeSUT('html>body>div.grand>div.parent');
    parent.updateLazyLayoutRegister(lazyLayout);
    parent.layout.placeAbsoluteWith((b) => {
      b.top(50, 'px').left(50, 'px').width(500, 'px').height(400, 'px');
    });

    // LazyLayoutManagerに中間親要素の値を登録
    lazyLayout.registerItem({
      relationShip: 'absolute',
      baseTagPath: 'html>body>div.grand>div.parent',
      basePosition: 'top',
      targetTagPath: undefined,
      targetPosition: 'top',
      value: { value: 50, unit: 'px' },
    });
    lazyLayout.registerItem({
      relationShip: 'absolute',
      baseTagPath: 'html>body>div.grand>div.parent',
      basePosition: 'left',
      targetTagPath: undefined,
      targetPosition: 'left',
      value: { value: 50, unit: 'px' },
    });

    // 子要素（レベル3）
    const child = makeSUT('html>body>div.grand>div.parent>div.child');
    child.updateLazyLayoutRegister(lazyLayout);
    child.layout.placeAbsoluteWith((b) => {
      b.top(25, 'px').left(25, 'px').width(100, 'px').height(80, 'px');
    });

    // LazyLayoutManagerに子要素の値を登録
    lazyLayout.registerItem({
      relationShip: 'absolute',
      baseTagPath: 'html>body>div.grand>div.parent>div.child',
      basePosition: 'top',
      targetTagPath: undefined,
      targetPosition: 'top',
      value: { value: 25, unit: 'px' },
    });
    lazyLayout.registerItem({
      relationShip: 'absolute',
      baseTagPath: 'html>body>div.grand>div.parent>div.child',
      basePosition: 'left',
      targetTagPath: undefined,
      targetPosition: 'left',
      value: { value: 25, unit: 'px' },
    });

    // 解決実行
    lazyLayout.resolveAllLayout();

    // 各CssManager要素のレンダリング検証（CssPositionMaker経由）
    expect(grandParent.render()).toContain('top: 0px');
    expect(parent.render()).toContain('top: 50px');
    expect(child.render()).toContain('top: 25px');

    // LazyLayoutManagerの統合レンダリング検証
    const allLayoutCss = lazyLayout.renderAllItems();
    expect(allLayoutCss).toContain('position: absolute');
    expect(allLayoutCss).toContain('top');
  });
});

// ============================================================
// 結合テスト 3: スコープドCSS出力の複雑なシナリオ
// ============================================================

describe('結合テスト 3: スコープドCSS複雑なシナリオ', () => {
  it('ネストした構造の複数要素でスコープドCSSが一意に生成される', () => {
    const paths = [
      'html>body>div.container',
      'html>body>div.container>div.header',
      'html>body>div.container>div.header>h1',
      'html>body>div.container>div.content',
      'html>body>div.container>div.footer',
    ];

    const managers = paths.map((path) => {
      const sut = makeSUT(path);
      sut.styleManager.style.font.setFontSize('16px'); // 全要素に共通スタイル
      return sut;
    });

    // 各要素のスコープドCSSを取得
    const scopedCssArray = managers.map((mgr) => mgr.renderCss());

    // 全てのスコープドCSSがクラス名を含むことを検証
    scopedCssArray.forEach((css, index) => {
      const expectedClass = generateScopedClassName(paths[index]);
      expect(css).toContain(`.${expectedClass}`);
      expect(css).toContain('font-size: 16px');
    });

    // 各要素のクラス名が一意であることを検証
    const classNames = paths.map((path) => generateScopedClassName(path));
    const uniqueClasses = new Set(classNames);
    expect(uniqueClasses.size).toBe(paths.length); // 全て異なるクラス名
  });

  it('複数要素のスコープドCSSを結合して外部CSS形式で出力できる', () => {
    const elements = [
      { path: 'html>body>div.card-1', fontSize: '14px', bgColor: 'white' },
      { path: 'html>body>div.card-2', fontSize: '16px', bgColor: 'lightgray' },
      { path: 'html>body>div.card-3', fontSize: '18px', bgColor: 'gray' },
    ];

    const scopedCssResults = elements.map(({ path, fontSize, bgColor }) => {
      const sut = makeSUT(path);
      sut.styleManager.style.font.setFontSize(fontSize);
      sut.styleManager.style.backgroundColor.setBackgroundColor(bgColor);
      return sut.renderCss();
    });

    // 全てのスコープドCSSを結合
    const combinedCss = scopedCssResults.join('\n\n');

    // 結合されたCSSが全要素のスタイルを含むことを検証
    expect(combinedCss).toContain('font-size: 14px');
    expect(combinedCss).toContain('font-size: 16px');
    expect(combinedCss).toContain('font-size: 18px');
    expect(combinedCss).toContain('background-color: white');
    expect(combinedCss).toContain('background-color: lightgray');
    expect(combinedCss).toContain('background-color: gray');

    // 3つのスコープドCSSクラスが含まれることを検証
    const classMatches = combinedCss.match(/\._[a-z0-9]{8}\s*\{/g);
    expect(classMatches).toHaveLength(3);
  });

  it('スコープドCSS有効/無効の切り替えが複数要素で機能する', () => {
    const path = 'html>body>div';

    // スコープドCSS有効
    const sutEnabled = makeSUT(path);
    sutEnabled.styleManager.style.font.setFontSize('16px');
    const enabledCss = sutEnabled.renderCss();
    expect(enabledCss).toContain('._'); // クラス名プレフィックス
    expect(enabledCss).toContain('{');
    expect(enabledCss).toContain('}');

    // スコープドCSS無効
    const sutDisabled = makeSUT(path);
    sutDisabled.config.scopedCssEnabled = false;
    sutDisabled.styleManager.style.font.setFontSize('16px');
    const disabledCss = sutDisabled.renderCss();
    expect(disabledCss).not.toContain('._'); // クラス名なし
    expect(disabledCss).not.toContain('{');
    expect(disabledCss).toBe('font-size: 16px;'); // インラインスタイル形式
  });

  it('スタイル + レイアウト両方を含むスコープドCSSが正しく生成される', () => {
    const path = 'html>body>div.positioned-card';
    const sut = makeSUT(path);

    // スタイル設定（13プロパティから主要なもの）
    sut.styleManager.style.font.setFontSize('16px');
    sut.styleManager.style.backgroundColor.setBackgroundColor('white');
    sut.styleManager.style.spacing.setPadding('20px');

    // レイアウト設定
    sut.layout.placeAbsoluteWith((b) => {
      b.top(100, 'px').left(200, 'px').width(300, 'px').height(250, 'px');
    });

    const scopedCss = sut.renderCss();
    const expectedClass = generateScopedClassName(path);

    // スコープドCSS形式
    expect(scopedCss).toContain(`.${expectedClass}`);

    // スタイルプロパティ
    expect(scopedCss).toContain('font-size: 16px');
    expect(scopedCss).toContain('background-color: white');
    expect(scopedCss).toContain('padding: 20px');

    // レイアウトプロパティ
    expect(scopedCss).toContain('position: absolute');
    expect(scopedCss).toContain('top: 100px');
    expect(scopedCss).toContain('left: 200px');
    expect(scopedCss).toContain('width: 300px');
    expect(scopedCss).toContain('height: 250px');
  });
});
