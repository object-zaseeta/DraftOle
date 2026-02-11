/**
 * Reset CSS
 *
 * 基本的なブラウザスタイルをリセットするCSS定数です。
 *
 * Eric Meyer's Reset CSS（簡略版）をベースにしており、
 * {@link FileExporter}の`includeResetCss: true`オプションで自動的に挿入されます。
 *
 * @remarks
 * ### 目的
 * ブラウザ間のデフォルトスタイルの差異を吸収し、
 * 一貫したベースラインからスタイリングを開始できるようにします。
 *
 * ### リセット内容
 * - マージン・パディング・ボーダーを0にリセット
 * - フォントサイズとline-heightをリセット
 * - リスト（ol/ul）のスタイルを削除
 * - テーブルのborder-collapseを設定
 * - HTML5要素のdisplayプロパティを設定
 *
 * @example FileExporterでの使用
 * ```typescript
 * const exporter = new FileExporter({
 *   includeResetCss: true,
 * });
 * exporter.export(html, css, js, './output');
 * ```
 *
 * @example 直接使用
 * ```typescript
 * import { RESET_CSS } from 'draftole';
 * const myCustomCss = RESET_CSS + '\n\nbody { margin: 20px; }';
 * ```
 *
 * @public
 */
export const RESET_CSS = `/* Reset CSS */
html, body, div, span, applet, object, iframe,
h1, h2, h3, h4, h5, h6, p, blockquote, pre,
a, abbr, acronym, address, big, cite, code,
del, dfn, em, img, ins, kbd, q, s, samp,
small, strike, strong, sub, sup, tt, var,
b, u, i, center,
dl, dt, dd, ol, ul, li,
fieldset, form, label, legend,
table, caption, tbody, tfoot, thead, tr, th, td,
article, aside, canvas, details, embed,
figure, figcaption, footer, header, hgroup,
menu, nav, output, ruby, section, summary,
time, mark, audio, video {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 100%;
  font: inherit;
  vertical-align: baseline;
}

/* HTML5 display-role reset for older browsers */
article, aside, details, figcaption, figure,
footer, header, hgroup, menu, nav, section {
  display: block;
}

body {
  line-height: 1;
}

ol, ul {
  list-style: none;
}

blockquote, q {
  quotes: none;
}

blockquote:before, blockquote:after,
q:before, q:after {
  content: '';
  content: none;
}

table {
  border-collapse: collapse;
  border-spacing: 0;
}
`;
