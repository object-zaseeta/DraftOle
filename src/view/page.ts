import { Root } from '../html/elements/root.js';
import { HtmlTag } from '../html/elements/html-tag.js';
import { TextType } from '../html/elements/text-type.js';
import { body, head, html, main, meta, title } from '../html/tags/index.js';
import { StaticPageWriter, type StaticExportOptions } from './static-page-writer.js';
import type { PageOptions, StaticView } from './types.js';

export type { StaticExportOptions } from './static-page-writer.js';

/**
 * 静的ページの境界オブジェクト。
 *
 * 内部で {@link Root} を保持するが外部 API では露出しない。
 * `render()` は HTML + inline CSS を返し、`export()` は {@link StaticPageWriter} に委譲する。
 *
 * design.md §6.3 / requirements.md 4.2, 5.1, 5.2 に対応。
 *
 * 構築時 pure validation を {@link page} ファクトリで 1 度だけ実施するため、
 * `render()` / `export()` 側では再検証しない（冪等性）。
 */
export class PageDocument {
  private readonly _root: Root;

  /**
   * @internal `page()` ファクトリからのみ呼び出されることを想定する。
   *           外部から直接構築すると静的性検証を素通りするため非推奨。
   */
  constructor(root: Root) {
    this._root = root;
  }

  render(): string {
    const htmlStr = this._root.render();
    const css = this._root.collectCssStyleString();
    if (css.length === 0) return htmlStr;
    const styleTag = `<style>\n${css}\n</style>`;
    const insertPoint = htmlStr.indexOf('</head>');
    if (insertPoint === -1) return htmlStr;
    return `${htmlStr.slice(0, insertPoint)}${styleTag}\n${htmlStr.slice(insertPoint)}`;
  }

  export(outputPath: string, options?: StaticExportOptions): void {
    new StaticPageWriter().write(this._root, outputPath, options);
  }
}

/**
 * `arg` が `PageOptions` かどうかを判別する内部型ガード。
 *
 * `StaticView` は `protoRender` プロパティを持つ（design.md §6.1）ため、
 * `protoRender` が存在しないオブジェクトを `PageOptions` として扱う。
 */
function isPageOptions(arg: unknown): arg is PageOptions {
  return typeof arg === 'object' && arg !== null && !('protoRender' in arg);
}

/**
 * 静的ページのファクトリ。
 *
 * design.md §6.2 に準拠し `StaticView` を受け取り {@link PageDocument} を返す。
 *
 * **レイアウト契約**: 渡した StaticView は `<main>` の直接の子として縦方向に積まれる（ブロックフロー）。
 * ページルート自体のレイアウト変更は不可。横並び等が必要な場合は View 側でコンテナを組むこと。
 *
 * 構築時 pure validation:
 * - 新規 `Root` 構築直後に `_root.collectUsedMethods()` / `_root.collectJsContent()`
 *   を 1 回だけ読み取り専用 walk として実行する。
 * - いずれかが非空なら `Error('page surface does not allow runtime content: <hint>')`
 *   を throw し、`PageDocument` は生成されない（requirements.md 3.2）。
 * - `protoRender()` は呼ばないため `RenderContext.registry.reset()` 等の
 *   レンダー副作用は発生しない（design.md §6.3 冪等性）。
 */
// View のみ（options なし）
export function page(...views: StaticView[]): PageDocument;
// Views + options（末尾）
export function page(...args: [...StaticView[], PageOptions]): PageDocument;
export function page(...args: (StaticView | PageOptions)[]): PageDocument {
  const lastArg = args[args.length - 1];
  const options = args.length > 0 && isPageOptions(lastArg) ? (lastArg as PageOptions) : undefined;
  const views = options !== undefined ? (args.slice(0, -1) as StaticView[]) : (args as StaticView[]);
  const root = new Root();
  root.setDoctype(true);

  const charsetMeta = meta({ charset: options?.charset ?? 'UTF-8' });

  const viewportMeta = options?.viewport !== undefined
    ? meta({ name: 'viewport', content: options.viewport })
    : undefined;

  const descriptionMeta = options?.description !== undefined
    ? meta({ name: 'description', content: options.description })
    : undefined;

  const titleEl = title(options?.title ?? '');

  const metaList = [charsetMeta, viewportMeta, descriptionMeta, titleEl]
    .filter((el): el is NonNullable<typeof el> => el !== undefined);

  const headEl = head(...metaList);
  // `StaticView` は narrow interface（design.md §6.1）であり、`HtmlTag`
  // が構造的にこれを満たす。`main(...)` / `body(...)` はタグ構築側の `ChildArg` 型を
  // 期待するため、ここで `unknown` 経由のキャストでブリッジする（design.md §6.2）。
  // `HtmlTag` インスタンスでない純粋な `StaticView`（AppSlot 等）は
  // `TextType.raw(protoRender())` でラップしてから渡す。
  const resolvedViews = views.map((v) =>
    v instanceof HtmlTag ? v : TextType.raw(v.protoRender()),
  );
  const mainEl = main(...(resolvedViews as unknown as Parameters<typeof main>));
  const bodyEl = body(mainEl as unknown as Parameters<typeof body>[0]);
  const htmlEl = options?.lang !== undefined
    ? html({ lang: options.lang }, headEl, bodyEl)
    : html(headEl, bodyEl);

  root.addChild(htmlEl);

  // 構築時 pure validation: runtime 担持を 1 回だけ検査（読み取り専用 walk）。
  const usedMethods = root.collectUsedMethods();
  const jsContent = root.collectJsContent();
  if (usedMethods.size > 0 || jsContent.length > 0) {
    const hints: string[] = [];
    if (usedMethods.size > 0) {
      hints.push(`jQuery methods=[${Array.from(usedMethods).join(',')}]`);
    }
    if (jsContent.length > 0) {
      hints.push('inline js content');
    }
    throw new Error(
      `page surface does not allow runtime content: ${hints.join('; ')}`,
    );
  }

  return new PageDocument(root);
}
