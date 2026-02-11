/**
 * CSSモジュール
 *
 * TypeScript版DraftOleのCSSモジュール。HTML要素のスタイル管理、レイアウト配置、
 * スコープドCSS生成など、包括的なCSS操作機能を提供する。
 *
 * ## 主要コンポーネント
 *
 * ### マネージャー
 *
 * - {@link CssManager}: CSS中央管理（スタイル + レイアウト統合）
 * - {@link CssStyleManager}: スタイルプロパティ管理
 * - {@link DefaultCssManager}: デフォルト実装（no-op）
 *
 * ### スタイル
 *
 * - {@link HtmlStyle}: 13種類のプロパティクラス統合コンテナ
 * - **13プロパティクラス**:
 *   {@link CSSFont}, {@link CSSBackground}, {@link CSSSpacing}, {@link CSSBorder},
 *   {@link CSSFlex}, {@link CSSGrid}, {@link CSSVisual}, {@link CSSText},
 *   {@link CSSTransform}, {@link CSSAnimation}, {@link CSSTable}, {@link CSSList},
 *   {@link CSSVisibility}
 * - **色管理**: {@link CSSColor}, {@link CSSColorName}
 * - **プロパティキー**: {@link CSSPropertyKey}
 *
 * ### レイアウト
 *
 * - {@link CssPositionMaker}: 要素の配置管理（absolute, relative, fixed, static）
 * - {@link LazyLayoutManager}: 遅延レイアウト解決（依存関係の管理）
 *
 * ### 設定・ユーティリティ
 *
 * - {@link CssConfig}: CSS出力設定
 * - {@link generateScopedClassName}: スコープドCSSクラス名生成
 * - {@link djb2Hash}: ハッシュ関数
 *
 * ## 基本的な使用例
 *
 * @example
 * ```ts
 * // CSS管理の基本
 * const manager = new CssManager('html>body>div');
 *
 * // スタイル設定
 * manager.styleManager.style.font
 *   .setFontSize('16px')
 *   .setColor('#333');
 * manager.styleManager.style.spacing
 *   .setMarginTop('10px')
 *   .setPaddingLeft('20px');
 *
 * // レイアウト設定
 * manager.layout.placeAbsoluteWith(b => {
 *   b.top(0, 'px').left(0, 'px').width(200, 'px');
 * });
 *
 * // インラインスタイル出力
 * console.log(manager.render());
 *
 * // スコープドCSS出力
 * console.log(manager.renderCss());
 * // → "._a1b2c3d4 { color: #333; font-size: 16px; ... }"
 * ```
 *
 * @module css
 * @packageDocumentation
 */

// ── Manager ──
export type { CssManagerInstance } from './manager/index.js';
export { CssManager, CssStyleManager, DefaultCssManager } from './manager/index.js';

// ── Style: 統合コンテナ ──
export { HtmlStyle } from './style/html-style.js';

// ── Style: 13プロパティクラス ──
export { CSSFont } from './style/font/css-font.js';
export { CSSBackground } from './style/background/css-background.js';
export { CSSSpacing } from './style/spacing/css-spacing.js';
export { CSSBorder } from './style/border/css-border.js';
export { CSSFlex } from './style/flex/css-flex.js';
export { CSSGrid } from './style/grid/css-grid.js';
export { CSSVisual } from './style/visual/css-visual.js';
export { CSSText } from './style/text/css-text.js';
export { CSSTransform } from './style/transform/css-transform.js';
export { CSSAnimation } from './style/animation/css-animation.js';
export { CSSTable } from './style/table/css-table.js';
export { CSSList } from './style/list/css-list.js';
export { CSSVisibility } from './style/visibility/css-visibility.js';

// ── Style: プロパティキー ──
export { CSSPropertyKey } from './style/style-keys.js';

// ── Style: Color ──
export { CSSColor } from './style/color/css-color.js';
export { CSSColorName } from './style/color/css-color-name.js';

// ── Style: Types ──
export type { CssStyleManagerType, HtmlStyleType } from './style/css-style-manager-type.js';

// ── Layout: Position Maker ──
export { CssPositionMaker } from './layout/position-maker/css-position-maker.js';
export type { CssPositionMakerType } from './layout/position-maker/css-position-maker-type.js';

// ── Layout: Lazy Layout ──
export { LazyLayoutManager } from './layout/lazy-layout/lazy-layout-manager.js';
export type { LayoutRegisteredItem, LazyLayoutRegister } from './layout/lazy-layout/registered-item.js';

// ── Layout: Types ──
export type { CssPlaceDescription } from './layout/css-place-description.js';
export type { CssLayoutBuilder } from './layout/css-layout-builder.js';
export type { Positioning } from './layout/positioning.js';

// ── Config ──
export { CssConfig } from './config/css-config.js';
export type { CssConfigOutputMode, CssConfigOptions } from './config/css-config.js';

// ── Utils ──
export { generateScopedClassName, djb2Hash } from './utils/scoped-css-generator.js';
