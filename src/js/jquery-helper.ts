import type { JQueryMethodType } from '../html/protocols/jquery-method-type.js';

/**
 * JQueryHelper - Tree-shaking対応の$()ヘルパー関数生成
 *
 * 使用されたjQueryメソッドのみを含む最小限の$()関数を生成し、
 * バンドルサイズを最適化します。
 *
 * @remarks
 * DraftOleの主要な機能の一つである**tree-shaking**を実現します。
 * JQueryManagerで使用されたメソッドのみを含む軽量な$()関数を動的に生成し、
 * 未使用のメソッドを含まないことでJavaScriptファイルサイズを削減します。
 *
 * ### Tree-shakingの仕組み
 * 1. {@link JQueryManager}が使用されたメソッドを`usedMethods`として追跡
 * 2. `JQueryHelper.generateHelper(usedMethods)`で必要なメソッドのみを含む$()関数を生成
 * 3. 出力されるJavaScriptは使用されたメソッドのみを含む
 *
 * ### jQueryとの違い
 * - フルサイズのjQueryライブラリ（約90KB minified）を避ける
 * - プロジェクトで実際に使用されるメソッドのみを含む（通常1-5KB）
 * - 依存関係なしで動作（Pure JavaScript）
 *
 * @example 基本的な使用方法
 * ```typescript
 * const usedMethods = new Set(['css', 'text', 'addClass']);
 * const helper = JQueryHelper.generateHelper(usedMethods);
 * // → css, text, addClassメソッドのみを持つ$()関数のJS文字列
 * ```
 *
 * @example JQueryManagerと組み合わせたtree-shaking
 * ```typescript
 * // 1. JQueryManagerで操作を記録
 * const jqm = new JQueryManager('my-element');
 * jqm.css({ color: 'red' });
 * jqm.addClass('active');
 *
 * // 2. 使用されたメソッドを取得
 * const usedMethods = jqm.usedMethods;
 * // → Set { 'css', 'addClass' }
 *
 * // 3. 必要最小限の$()関数を生成
 * const helper = JQueryHelper.generateHelper(usedMethods);
 *
 * // 4. 出力されるJavaScriptにはcssとaddClassのみが含まれる
 * // text, html, removeClassなどの未使用メソッドは含まれない
 * ```
 *
 * @example 複数のマネージャーからメソッドを集約
 * ```typescript
 * const managers = [
 *   new JQueryManager('element1'),
 *   new JQueryManager('element2'),
 *   new JQueryManager('element3'),
 * ];
 *
 * managers[0].css({ color: 'red' });
 * managers[1].text('Hello');
 * managers[2].addClass('active');
 *
 * // 全マネージャーの使用メソッドを集約
 * const allMethods = new Set<JQueryMethodType>();
 * managers.forEach(m => {
 *   m.usedMethods.forEach(method => allMethods.add(method));
 * });
 *
 * // 全体で使用されたメソッドのみを含む$()関数を生成
 * const helper = JQueryHelper.generateHelper(allMethods);
 * ```
 *
 * @example querySelectorAllサポート（$$.all）
 * ```typescript
 * const usedMethods = new Set(['css', 'addClass']);
 * const helper = JQueryHelper.generateHelperWithAll(usedMethods);
 *
 * // 生成されるコードの例:
 * // function $(...) { ... }
 * // const $$ = { all(selector) { return Array.from(document.querySelectorAll(selector)); } };
 * ```
 *
 * @public
 */
export class JQueryHelper {
  /**
   * 使用メソッドのみを含む$()ヘルパー関数を生成
   *
   * @param methods - 使用するJQueryMethodTypeのSet
   * @returns 生成されたJavaScript文字列（空Setの場合は空文字列）
   *
   * @remarks
   * 生成される$()関数は以下の特徴を持ちます:
   * - セレクタ文字列またはDOM要素を受け取る
   * - 指定されたメソッドのみを実装（未使用メソッドは含まれない）
   * - null要素に対しても安全に動作（メソッドチェーンを壊さない）
   * - メソッドチェーンをサポート（各メソッドはthisを返す）
   *
   * @example 最小限のバンドル（css, textのみ）
   * ```typescript
   * const methods = new Set(['css', 'text']);
   * const helper = JQueryHelper.generateHelper(methods);
   *
   * // 生成されるコード（簡略版）:
   * // function $(selectorOrEl) {
   * //   const el = typeof selectorOrEl === "string" ? document.querySelector(selectorOrEl) : selectorOrEl;
   * //   return {
   * //     css(props) { ... },
   * //     text(value) { ... }
   * //   };
   * // }
   * ```
   *
   * @example 空のSet（メソッド未使用時）
   * ```typescript
   * const methods = new Set<JQueryMethodType>();
   * const helper = JQueryHelper.generateHelper(methods);
   * console.log(helper); // → ""（空文字列）
   * ```
   *
   * @public
   */
  static generateHelper(methods: ReadonlySet<JQueryMethodType>): string {
    if (methods.size === 0) {
      return '';
    }

    const methodImplementations: string[] = [];

    if (methods.has('css')) {
      methodImplementations.push(`      css(props) {
        if (!el) return this;
        for (let prop in props) {
          el.style[prop] = props[prop];
        }
        return this;
      }`);
    }

    if (methods.has('height')) {
      methodImplementations.push(`      height(value) {
        if (!el) return this;
        el.style.height = typeof value === 'number' ? value + 'px' : value;
        return this;
      }`);
    }

    if (methods.has('on')) {
      methodImplementations.push(`      on(event, handler) {
        if (!el) return this;
        el.addEventListener(event, handler);
        return this;
      }`);
    }

    if (methods.has('text')) {
      methodImplementations.push(`      text(value) {
        if (!el) return this;
        if (value === undefined) {
          return el.textContent;
        }
        el.textContent = value;
        return this;
      }`);
    }

    if (methods.has('html')) {
      methodImplementations.push(`      html(value) {
        if (!el) return this;
        if (value === undefined) {
          return el.innerHTML;
        }
        el.innerHTML = value;
        return this;
      }`);
    }

    if (methods.has('addClass')) {
      methodImplementations.push(`      addClass(className) {
        if (!el) return this;
        el.classList.add(className);
        return this;
      }`);
    }

    if (methods.has('removeClass')) {
      methodImplementations.push(`      removeClass(className) {
        if (!el) return this;
        el.classList.remove(className);
        return this;
      }`);
    }

    if (methods.has('toggleClass')) {
      methodImplementations.push(`      toggleClass(className, force) {
        if (!el) return this;
        if (force === undefined) {
          el.classList.toggle(className);
        } else {
          el.classList.toggle(className, force);
        }
        return this;
      }`);
    }

    const helperFunction = `function $(selectorOrEl) {
  const el = typeof selectorOrEl === "string"
    ? document.querySelector(selectorOrEl)
    : selectorOrEl;

  if (!el) {
    return {
${methodImplementations.map(impl => impl.replace(/if \(!el\) return this;\n        /g, '')).join(',\n')}
    };
  }

  return {
${methodImplementations.join(',\n')}
  };
}`;

    return helperFunction;
  }

  /**
   * $()関数に加えて$$.all()関数も生成
   *
   * @param methods - 使用するJQueryMethodTypeのSet
   * @returns 生成されたJavaScript文字列（空Setの場合は空文字列）
   *
   * @remarks
   * `generateHelper()`に加えて、`$$.all(selector)`ヘルパーを追加します。
   * `$$.all()`は`document.querySelectorAll()`のラッパーで、配列として結果を返します。
   *
   * @example 複数要素の一括操作
   * ```typescript
   * const methods = new Set(['addClass']);
   * const helper = JQueryHelper.generateHelperWithAll(methods);
   *
   * // 生成されるコード（簡略版）:
   * // function $(...) { ... }
   * // const $$ = {
   * //   all(selector) {
   * //     return Array.from(document.querySelectorAll(selector));
   * //   }
   * // };
   *
   * // 使用例:
   * // $$.all('.item').forEach(el => $(el).addClass('active'));
   * ```
   *
   * @public
   */
  static generateHelperWithAll(methods: ReadonlySet<JQueryMethodType>): string {
    const helperFunction = this.generateHelper(methods);

    if (helperFunction.length === 0) {
      return '';
    }

    const allFunction = `
const $$ = {
  all(selector) {
    return Array.from(document.querySelectorAll(selector));
  }
};`;

    return helperFunction + '\n' + allFunction;
  }
}
