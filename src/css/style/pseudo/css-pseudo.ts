/**
 * CSSPseudo — 疑似クラス（:hover / :focus / :active）スタイルを管理するクラス。
 *
 * `PseudoStyleBuilder` を受け取り、内部 Map にプロパティを格納する。
 * `renderForScope(scope)` でスコープクラス付き CSS ブロック配列を返す。
 *
 * Anti-Invariant:
 *   CSSPseudo は意図的に `Renderable` を実装しない。
 *   疑似クラスはプロパティ集合ではなく CSS ルールブロック（セレクタ付き）であり、
 *   HtmlStyle.render() の body-level 集約対象にしてはならない。
 *   CssManager.renderCss() から renderForScope(scopeClass) を直接呼び出すこと。
 */
import { renderCssProperties } from '../../utils/css-sanitizer.js';
import { guardDuplicateCssProperty } from '../../../utils/dev-guard.js';
import { PseudoStyleBuilder } from './pseudo-style-builder.js';

type PseudoName = 'hover' | 'focus' | 'active';

const PSEUDO_RENDER_ORDER: ReadonlyArray<PseudoName> = ['hover', 'focus', 'active'];

export class CSSPseudo {
  private _states: Partial<Record<PseudoName, Map<string, string>>> = {};

  setHover(builder: PseudoStyleBuilder): this {
    return this.applyBuilder('hover', builder);
  }

  setFocus(builder: PseudoStyleBuilder): this {
    return this.applyBuilder('focus', builder);
  }

  setActive(builder: PseudoStyleBuilder): this {
    return this.applyBuilder('active', builder);
  }

  hasAny(): boolean {
    return PSEUDO_RENDER_ORDER.some((name) => {
      const map = this._states[name];
      return map !== undefined && map.size > 0;
    });
  }

  renderForScope(scopeClass: string): string[] {
    const blocks: string[] = [];
    for (const name of PSEUDO_RENDER_ORDER) {
      const map = this._states[name];
      if (map === undefined || map.size === 0) continue;
      const body = renderCssProperties(map);
      if (body === '') continue;
      const indented = body
        .split('\n')
        .map((line) => `  ${line}`)
        .join('\n');
      blocks.push(`.${scopeClass}:${name} {\n${indented}\n}`);
    }
    return blocks;
  }

  private applyBuilder(pseudo: PseudoName, builder: PseudoStyleBuilder): this {
    const map = (this._states[pseudo] ??= new Map<string, string>());
    for (const [key, value] of builder.toMap()) {
      guardDuplicateCssProperty(map.get(key), key);
      map.set(key, value);
    }
    return this;
  }
}
