/**
 * JQueryManagerInstance インターフェース
 *
 * HtmlTag が保持する jQuery マネージャーのコンポジション型。
 * Renderable を拡張し、jQuery風DOM操作コードの蓄積・出力を提供する。
 *
 * 依存方向: html/protocols/ が定義を所有し、js/ が実装する。
 */
import type { Renderable } from '../../utils/renderable.js';
import type { JQueryMethodType } from './jquery-method-type.js';

export interface JQueryManagerInstance extends Renderable {
  readonly path: string;
  readonly usedMethods: ReadonlySet<JQueryMethodType>;

  css(properties: Record<string, string>): string;
  height(value: number, unit?: string): string;
  on(eventType: string, handler: string): string;
  click(handler: string): string;
  keydown(handler: string): string;
  keyup(handler: string): string;
  text(value: string, isVariable?: boolean): string;
  html(value: string): string;
  addClass(className: string): string;
  removeClass(className: string): string;
  toggleClass(className: string, force?: boolean): string;
  needsHelper(): boolean;

  updatePath(newPath: string): void;
  render(): string;
}
