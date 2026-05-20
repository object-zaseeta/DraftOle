import type { HtmlTag } from '../html/elements/html-tag.js';
import type { RenderContext } from '../html/elements/render-context.js';

export type View = HtmlTag;

/**
 * `page` 公開面で受け付ける静的ビューの narrow interface（design.md §6.1）。
 *
 * `HtmlTag` を直接 `View` として再エクスポートせず、静的レンダリングに必要な
 * 能力のみを露出する。`HtmlTag` は構造的部分型としてこの interface を満たすため
 * `VStack()` / `Page()` / `div()` 等の戻り値はそのまま `StaticView` に代入可能だが、
 * `StaticView` 経由で取り出せるシンボルは static 系メソッドのみとなり、
 * `jqm` / `state` / `script` / `$` / `$$` 等の runtime 面は型レベルで不可達となる。
 *
 * 対応 requirement: 1.1, 1.2, 6.1, 6.2 (page-runtime-separation-spec)
 */
export interface StaticView {
  /** 内部実装が静的 HTML をレンダリングするための最小契約 */
  protoRender(ctx?: RenderContext): string;
  /** 静的 CSS の収集（runtime JS 収集系は意図的に含めない） */
  collectCssStyleString(): string;
}

export interface PageOptions {
  lang?: string;
  title?: string;
  description?: string;
  viewport?: string;
  charset?: string;
}

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface LinkOptions {
  href: string;
  target?: '_blank' | '_self';
  rel?: string;
}

export interface ButtonOptions {
  type?: 'button' | 'submit' | 'reset';
}
