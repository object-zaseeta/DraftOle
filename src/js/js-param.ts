/**
 * JsParam — jsTemplate 用変数参照マーカー型と sentinel エンコーディング
 *
 * factories.ts と js-template.ts の両方が共通して参照する。
 * 循環依存を防ぐため、依存関係のない独立したモジュールとして定義する。
 */

// ============================================================
// JsParam 型
// ============================================================

/**
 * jsTemplate で使う変数参照マーカー。
 * param('text') により生成され、属性値として渡された際に
 * 文字列リテラルではなく変数名として JS コードに展開される。
 */
export interface JsParam {
  readonly __jsParam: true;
  readonly name: string;
}

/**
 * JsParam の sentinel エンコード文字列プレフィックス。
 * AttributeMap を経由して HtmlAttribute に JsParam を埋め込む際に使用する。
 * 通常のコンテンツには含まれない null byte ベースのプレフィックス。
 * @internal
 */
export const JSPARAM_SENTINEL_PREFIX = '\x00jsparam\x00:';

/**
 * 値が JsParam マーカーかどうかを判定する型ガード。
 *
 * @param value - チェックする値
 * @returns value が JsParam の場合 true
 */
export function isJsParam(value: unknown): value is JsParam {
  return (
    typeof value === 'object'
    && value !== null
    && (value as Record<string, unknown>)['__jsParam'] === true
    && typeof (value as Record<string, unknown>)['name'] === 'string'
  );
}

/**
 * JsParam マーカーを sentinel 文字列にエンコードする。
 * @internal
 */
export function encodeJsParam(p: JsParam): string {
  return `${JSPARAM_SENTINEL_PREFIX}${p.name}`;
}

/**
 * sentinel 文字列を JsParam 名にデコードする。
 * sentinel でない場合は null を返す。
 * @internal
 */
export function decodeJsParamSentinel(value: string): string | null {
  if (value.startsWith(JSPARAM_SENTINEL_PREFIX)) {
    return value.slice(JSPARAM_SENTINEL_PREFIX.length);
  }
  return null;
}
