/**
 * jsTemplate: HTMLTagProtocol ツリーから DOM 生成 JavaScript コードを生成する
 *
 * param() でマーカーオブジェクトを作成し、jsTemplate() でタグツリーを走査して
 * document.createElement / appendChild を使った JS 関数コードを出力する。
 */
import type { HTMLTagProtocol } from '../html/protocols/html-tag-protocol.js';
import type { HtmlAttributeShape } from '../html/protocols/html-tag-protocol.js';
import { TextType } from '../html/elements/text-type.js';
import type { JsParam } from './js-param.js';
import { decodeJsParamSentinel } from './js-param.js';

// JsParam, isJsParam, param は js-param.ts から再エクスポート
export type { JsParam } from './js-param.js';
export { isJsParam, encodeJsParam, decodeJsParamSentinel, JSPARAM_SENTINEL_PREFIX } from './js-param.js';

// ============================================================
// param() ファクトリ関数
// ============================================================

/**
 * JsParam マーカーオブジェクトを作成する。
 *
 * jsTemplate() に渡すタグツリー内の属性値として使用することで、
 * 生成される JS コード内で文字列リテラルではなく変数参照になる。
 *
 * @param name - JS 関数の引数名
 * @returns JsParam マーカーオブジェクト
 *
 * @example
 * ```typescript
 * const result = jsTemplate('createLabel', ['text'],
 *   span({ textContent: param('text') })
 * );
 * result.render();
 * // → "el0.textContent = text;" (クォートなし)
 * ```
 */
export function param(name: string): JsParam {
  return { __jsParam: true, name };
}

// ============================================================
// DOM プロパティマッピング
// ============================================================

/**
 * HTML 属性キー → DOM プロパティ名のマッピング。
 * このマップにある属性は el.propName = value の形式で出力される。
 * マップにない属性は el.setAttribute("key", "value") にフォールバックする。
 */
const DOM_PROPERTY_MAP: Readonly<Record<string, string>> = {
  'className': 'className',
  'class': 'className',
  'textContent': 'textContent',
  'id': 'id',
  'type': 'type',
  'value': 'value',
  'href': 'href',
  'src': 'src',
  'alt': 'alt',
  'title': 'title',
  'placeholder': 'placeholder',
  'name': 'name',
  'disabled': 'disabled',
  'checked': 'checked',
  'selected': 'selected',
  'readonly': 'readOnly',
  'hidden': 'hidden',
};

// ============================================================
// JsTemplateResult — render() インターフェース
// ============================================================

/**
 * jsTemplate() の戻り値。name・params・render() を持つ。
 */
export interface JsTemplateResult {
  /** 生成する JS 関数名 */
  readonly name: string;
  /** JS 関数の引数名リスト */
  readonly params: readonly string[];
  /** JS コード文字列を生成する */
  render(): string;
}

// ============================================================
// 内部ユーティリティ
// ============================================================

/**
 * 属性の文字列値を JS コード用に整形する。
 * sentinel (JsParam) → 変数参照（クォートなし）
 * 通常文字列 → "value"（JSON エンコード済みダブルクォート）
 */
function renderAttrValue(raw: string): string {
  const paramName = decodeJsParamSentinel(raw);
  if (paramName !== null) {
    return paramName; // 変数参照（クォートなし）
  }
  return JSON.stringify(raw); // "value"
}

/**
 * HtmlAttributeShape から JS コードの行を生成する。
 */
function attrToJsLines(varName: string, attr: HtmlAttributeShape): string[] {
  const key = attr.key;
  const attrValue = attr.attributeValue;

  // boolean 属性 → el.propName = true
  if (attrValue.type === 'boolean') {
    const prop = DOM_PROPERTY_MAP[key] ?? key;
    return [`${varName}.${prop} = true;`];
  }

  // custom (data-*) → setAttribute("data-name", value)
  if (attrValue.type === 'custom') {
    const dataKey = `data-${attrValue.name}`;
    const rawValue = attrValue.value;
    const paramName = decodeJsParamSentinel(rawValue);
    if (paramName !== null) {
      return [`${varName}.setAttribute("${dataKey}", ${paramName});`];
    }
    return [`${varName}.setAttribute("${dataKey}", ${JSON.stringify(rawValue)});`];
  }

  // keyValue
  if (attrValue.type === 'keyValue') {
    const rawValue = attrValue.value;

    // class → className DOM プロパティ
    if (key === 'class') {
      return [`${varName}.className = ${renderAttrValue(rawValue)};`];
    }

    // DOM プロパティにマッピングされるキー
    const domProp = DOM_PROPERTY_MAP[key];
    if (domProp !== undefined) {
      return [`${varName}.${domProp} = ${renderAttrValue(rawValue)};`];
    }

    // aria-* / その他 → setAttribute
    const paramName = decodeJsParamSentinel(rawValue);
    if (paramName !== null) {
      return [`${varName}.setAttribute("${key}", ${paramName});`];
    }
    return [`${varName}.setAttribute("${key}", ${JSON.stringify(rawValue)});`];
  }

  return [];
}

/**
 * タグツリーを再帰的に走査して JS コード行を生成する。
 *
 * @param node - 現在のノード
 * @param counter - 変数カウンタ（共有オブジェクト、インクリメントしながら使う）
 * @param lines - 出力行リスト（破壊的追加）
 * @returns このノードに割り当てた変数名
 */
function walkNode(
  node: HTMLTagProtocol,
  counter: { value: number },
  lines: string[],
): string {
  const varName = `el${counter.value++}`;
  const tagType = node.tagType;

  // createElement
  lines.push(`const ${varName} = document.createElement("${tagType}");`);

  // 属性の出力
  for (const attr of node.attributes) {
    const attrLines = attrToJsLines(varName, attr);
    for (const line of attrLines) {
      lines.push(line);
    }
  }

  // 子要素の出力
  for (const child of node.children) {
    if (child instanceof TextType) {
      // テキストノード → textContent として設定
      const content = child.content;
      const paramName = decodeJsParamSentinel(content);
      if (paramName !== null) {
        lines.push(`${varName}.textContent = ${paramName};`);
      } else {
        lines.push(`${varName}.textContent = ${JSON.stringify(content)};`);
      }
    } else {
      // 要素ノード → 再帰してから appendChild
      const childVar = walkNode(child, counter, lines);
      lines.push(`${varName}.appendChild(${childVar});`);
    }
  }

  return varName;
}

// ============================================================
// jsTemplate
// ============================================================

/**
 * HTMLTagProtocol タグツリーから DOM 生成 JS 関数を生成する。
 *
 * @param name - 生成する JS 関数名
 * @param params - 関数引数名のリスト
 * @param rootElement - DraftOle タグツリーのルート要素
 * @returns render() メソッドを持つ JsTemplateResult
 *
 * @example
 * ```typescript
 * const result = jsTemplate('createBox', [], div({ className: 'box' }));
 * console.log(result.render());
 * // function createBox() {
 * //   const el0 = document.createElement("div");
 * //   el0.className = "box";
 * //   return el0;
 * // }
 * ```
 */
export function jsTemplate(
  name: string,
  params: string[],
  rootElement: HTMLTagProtocol,
): JsTemplateResult {
  return {
    name,
    params: [...params],
    render(): string {
      const bodyLines: string[] = [];
      const counter = { value: 0 };
      const rootVarName = walkNode(rootElement, counter, bodyLines);

      const paramsStr = params.join(', ');
      const indented = bodyLines.map(l => `  ${l}`).join('\n');

      return [
        `function ${name}(${paramsStr}) {`,
        indented,
        `  return ${rootVarName};`,
        `}`,
      ].join('\n');
    },
  };
}
