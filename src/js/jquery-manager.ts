import type { JQueryMethodType } from './jquery-method-type.js';
import type { JQueryManagerInstance } from '../html/protocols/jquery-manager-instance-type.js';

/**
 * 後方互換性のための re-export。
 * 定義は html/protocols/jquery-manager-instance-type.ts に移動。
 */
export type { JQueryManagerInstance } from '../html/protocols/jquery-manager-instance-type.js';

/**
 * JQueryManager - 要素ごとのjQuery風JavaScript操作を蓄積・生成
 *
 * DraftOleのHTML要素に対してjQuery風のDOM操作を記録し、
 * JavaScript文字列として出力するマネージャークラスです。
 *
 * @remarks
 * - 各メソッドは操作をキューに追加し、render()で全操作を出力
 * - usedMethodsプロパティで使用されたメソッドを追跡（tree-shaking用）
 * - メソッドチェーンの代わりに、連続呼び出しで操作を蓄積
 * - Swift版JQueryManagerと互換性のある動作を実現
 *
 * @example 基本的な使用方法
 * ```typescript
 * const jqm = new JQueryManager('root-0-html-0-body');
 * jqm.css({ 'font-size': '10px' });
 * jqm.text('Hello World');
 * jqm.addClass('active');
 *
 * const js = jqm.render();
 * // → "$('.root-0-html-0-body').css({'font-size': '10px'});\n..."
 * ```
 *
 * @example tree-shaking用のメソッド追跡
 * ```typescript
 * const jqm = new JQueryManager('element');
 * jqm.css({ color: 'blue' });
 * jqm.text('Text');
 *
 * const methods = jqm.usedMethods;
 * // → Set { 'css', 'text' }
 *
 * // JQueryHelperと組み合わせて最小限の$()関数を生成
 * const helper = JQueryHelper.generateHelper(methods);
 * ```
 *
 * @example イベントハンドリング
 * ```typescript
 * const jqm = new JQueryManager('button-element');
 * jqm.click('handleClick');
 * jqm.keydown('handleKeyDown');
 *
 * console.log(jqm.render());
 * // → "$('.button-element').on('click', handleClick);\n$('.button-element').on('keydown', handleKeyDown)"
 * ```
 *
 * @example パスの動的更新
 * ```typescript
 * const jqm = new JQueryManager('old-path');
 * jqm.css({ color: 'red' });
 *
 * jqm.updatePath('new-path');
 * jqm.text('Updated');
 *
 * // 既存の操作は古いパスを保持し、新しい操作は新しいパスを使用
 * ```
 *
 * @public
 */
export class JQueryManager implements JQueryManagerInstance {
  private _path: string;
  private readonly _content: string[] = [];
  private readonly _usedMethods: Set<JQueryMethodType> = new Set();

  constructor(path: string = '') {
    this._path = path;
  }

  get path(): string {
    return this._path;
  }

  get usedMethods(): ReadonlySet<JQueryMethodType> {
    return this._usedMethods;
  }

  /**
   * CSSプロパティ操作のJS文を生成
   * @param properties - CSS propertyのキーバリューマップ
   * @returns 生成されたJS文字列
   */
  css(properties: Record<string, string>): string {
    this._usedMethods.add('css');

    const propsStr = Object.entries(properties)
      .map(([key, value]) => `'${key}': '${value}'`)
      .join(', ');

    const statement = `$('.${this._path}').css({${propsStr}})`;
    this._content.push(statement);
    return statement;
  }

  /**
   * 高さ操作のJS文を生成
   * @param value - 高さの値
   * @param unit - 単位（'px', 'vh'等、指定しない場合は数値のみ）
   * @returns 生成されたJS文字列
   */
  height(value: number, unit?: string): string {
    this._usedMethods.add('height');

    const valueStr = unit ? `'${value}${unit}'` : value.toString();
    const statement = `$('.${this._path}').height(${valueStr})`;
    this._content.push(statement);
    return statement;
  }

  /**
   * 汎用イベントバインディングのJS文を生成
   * @param eventType - イベント種別（'click', 'keydown'等）
   * @param handler - ハンドラ関数名
   * @returns 生成されたJS文字列（空ハンドラの場合は空文字列）
   */
  on(eventType: string, handler: string): string {
    if (handler.length === 0) {
      return '';
    }

    this._usedMethods.add('on');
    const statement = `$('.${this._path}').on('${eventType}', ${handler})`;
    this._content.push(statement);
    return statement;
  }

  /**
   * clickイベントハンドラのJS文を生成
   * @param handler - ハンドラ関数名
   * @returns 生成されたJS文字列
   */
  click(handler: string): string {
    return this.on('click', handler);
  }

  /**
   * keydownイベントハンドラのJS文を生成
   * @param handler - ハンドラ関数名
   * @returns 生成されたJS文字列
   */
  keydown(handler: string): string {
    return this.on('keydown', handler);
  }

  /**
   * keyupイベントハンドラのJS文を生成
   * @param handler - ハンドラ関数名
   * @returns 生成されたJS文字列
   */
  keyup(handler: string): string {
    return this.on('keyup', handler);
  }

  /**
   * テキストコンテンツ操作のJS文を生成
   * @param value - テキスト値または変数名
   * @param isVariable - trueの場合、変数名として扱う（クォートなし）
   * @returns 生成されたJS文字列
   */
  text(value: string, isVariable: boolean = false): string {
    this._usedMethods.add('text');

    const valueStr = isVariable ? value : `'${value}'`;
    const statement = `$('.${this._path}').text(${valueStr})`;
    this._content.push(statement);
    return statement;
  }

  /**
   * innerHTML操作のJS文を生成
   * @param value - HTML文字列
   * @returns 生成されたJS文字列
   */
  html(value: string): string {
    this._usedMethods.add('html');

    const statement = `$('.${this._path}').html('${value}')`;
    this._content.push(statement);
    return statement;
  }

  /**
   * クラス追加のJS文を生成
   * @param className - 追加するクラス名
   * @returns 生成されたJS文字列
   */
  addClass(className: string): string {
    this._usedMethods.add('addClass');

    const statement = `$('.${this._path}').addClass('${className}')`;
    this._content.push(statement);
    return statement;
  }

  /**
   * クラス削除のJS文を生成
   * @param className - 削除するクラス名
   * @returns 生成されたJS文字列
   */
  removeClass(className: string): string {
    this._usedMethods.add('removeClass');

    const statement = `$('.${this._path}').removeClass('${className}')`;
    this._content.push(statement);
    return statement;
  }

  /**
   * クラストグルのJS文を生成
   * @param className - トグルするクラス名
   * @param force - true/falseで強制的に追加/削除
   * @returns 生成されたJS文字列
   */
  toggleClass(className: string, force?: boolean): string {
    this._usedMethods.add('toggleClass');

    const forceStr = force !== undefined ? `, ${force}` : '';
    const statement = `$('.${this._path}').toggleClass('${className}'${forceStr})`;
    this._content.push(statement);
    return statement;
  }

  /**
   * ヘルパー関数が必要かどうかを判定
   * @returns usedMethodsが空でない場合true
   */
  needsHelper(): boolean {
    return this._usedMethods.size > 0;
  }

  /**
   * パスを更新
   * @param newPath - 新しいCSSセレクタパス
   */
  updatePath(newPath: string): void {
    this._path = newPath;
  }

  /**
   * 蓄積されたJS文を ";\n" で結合して返す
   * @returns 統合されたJavaScript文字列（空の場合は空文字列）
   */
  render(): string {
    if (this._content.length === 0) {
      return '';
    }
    return this._content.join(';\n');
  }
}
