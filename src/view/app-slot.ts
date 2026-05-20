import type { RenderContext } from '../html/elements/render-context.js';
import type { StaticView } from './types.js';

/**
 * AppSlot — マウントポイントを表す StaticView プリミティブ。
 *
 * `data-draftole-mount` 属性を持つ `<div>` を生成し、
 * ランタイム系の App コンポーネントをマウントする際の
 * プレースホルダとして機能する。
 *
 * - `protoRender()` は `<div data-draftole-mount="${id}"></div>` を返す。
 * - `collectCssStyleString()` は空文字列を返す（CSS なし）。
 * - runtime メソッド（jqm / state / script 等）は持たない。
 * - `app/` モジュールへの依存を持たない。
 */
export interface AppSlotOptions {
  readonly id: string;
}

export function AppSlot(options: AppSlotOptions): StaticView;
export function AppSlot(id: string): StaticView;
export function AppSlot(optionsOrId: AppSlotOptions | string): StaticView {
  const id = typeof optionsOrId === 'string' ? optionsOrId : optionsOrId.id;

  if (id === '') {
    throw new Error('AppSlot id must be a non-empty string');
  }

  return {
    protoRender(_ctx?: RenderContext): string {
      return `<div data-draftole-mount="${id}"></div>`;
    },
    collectCssStyleString(): string {
      return '';
    },
  };
}
