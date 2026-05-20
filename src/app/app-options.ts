import type { GlobalCss } from '../css/variables/global-css.js';
import type { PageOptions } from '../view/types.js';
import type { CssConfig } from '../css/config/css-config.js';

/**
 * `app()` ファクトリに渡すオプション。
 *
 * `PageOptions`（title / lang / description / viewport / charset）の全フィールドを包含し、
 * インタラクティブアプリ固有の `wrapDOMReady` を追加する。
 *
 * デフォルト値は `app()` ファクトリ側で適用される:
 * - `charset`: `"UTF-8"`
 * - `lang`: `"en"`
 * - `wrapDOMReady`: `false`
 *
 * Requirements: 1.1, 1.2, 3.2
 */
export interface AppOptions extends PageOptions {
  /** 生成 JS を `DOMContentLoaded` イベントリスナでラップするか（デフォルト: `false`） */
  readonly wrapDOMReady?: boolean;
  /**
   * scoped style より前に注入されるグローバル CSS。
   * `GlobalCss` または `GlobalCss` 配列で複数の rule を一括登録できる
   * （例: theme 変数の `:root` ブロック、CSS リセット、要素セレクタ等）。
   */
  readonly css?: GlobalCss | readonly GlobalCss[];

  /**
   * CSS 出力設定（minify モード等）。
   *
   * `new CssConfig({ minifyClassNames: true })` で scoped CSS のクラス名を
   * `_<8hex>` 形式に圧縮できる。省略時は default `CssConfig`（NODE_ENV fallback 適用）。
   *
   * 注意: `Root` constructor 時点で `process.env.NODE_ENV` が読み取られ
   * `minifyClassNames` が確定する。production ビルドでは `NODE_ENV='production'`
   * を `app()` 呼び出し**前**に設定すること。
   *
   * @see CssConfig
   */
  readonly cssConfig?: CssConfig;
}
