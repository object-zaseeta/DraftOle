import type { Root } from '../html/elements/root.js';
import type { HtmlTag } from '../html/elements/html-tag.js';
import { body, head, html, meta, title } from '../html/tags/index.js';
import type { PageOptions } from '../view/types.js';

/**
 * `Root` に html/head/(meta×N + title)/body を組み立てる純関数ヘルパー。
 *
 * - `body` は **空のまま** 返す（`app()` 用途は SPA なので `<main>` で包まない）
 * - `page()` の DOM 構築ロジックと同等の meta 生成を行う
 *
 * Requirements: 1.4, 3.4
 * Boundary: src/app/build-document-skeleton.ts
 */
export function buildDocumentSkeleton(
  root: Root,
  options: PageOptions,
): { bodyEl: HtmlTag } {
  root.setDoctype(true);

  const charsetMeta = meta({ charset: options.charset ?? 'UTF-8' });

  const viewportMeta =
    options.viewport !== undefined
      ? meta({ name: 'viewport', content: options.viewport })
      : undefined;

  const descriptionMeta =
    options.description !== undefined
      ? meta({ name: 'description', content: options.description })
      : undefined;

  const titleEl = title(options.title ?? '');

  const metaList = [charsetMeta, viewportMeta, descriptionMeta, titleEl].filter(
    (el): el is NonNullable<typeof el> => el !== undefined,
  );

  const headEl = head(...metaList);
  const bodyEl = body();

  const htmlEl =
    options.lang !== undefined
      ? html({ lang: options.lang }, headEl, bodyEl)
      : html(headEl, bodyEl);

  root.addChild(htmlEl);

  return { bodyEl: bodyEl as unknown as HtmlTag };
}
