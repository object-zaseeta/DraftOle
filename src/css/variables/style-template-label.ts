/**
 * StyleTemplate デバッグ変数名ラベル付けランタイムヘルパー
 *
 * ビルド時トランスフォーマー（AST変換）が `createStyle(...)` 呼び出しを
 * `__draftole_label__(createStyle(...), '<varName>')` の形にラップするために
 * 使用するランタイム関数。
 *
 * - 渡された値が `StyleTemplate` らしき形状（`_kind === 'styleTemplate'` かつ
 *   `bodyHash` プロパティを持つ）であれば、`debugVarName` を付与した
 *   `Object.freeze` 済みコピーを返す。元の `StyleTemplate` は frozen のため
 *   ミューテートしない。
 * - それ以外の値（プリミティブ、関数、StyleTemplate 以外のオブジェクトなど）は
 *   そのまま返す（防御的 no-op）。
 *
 * 型シグネチャは `<T>(value: T, debugVarName: string): T` で、型システム上は
 * identity（透過）として振る舞う。これにより、ラップ前後で型が変化せず、
 * 既存のコード補完・型推論に影響を与えない。
 *
 * @module css/variables/style-template-label
 */

/**
 * StyleTemplate に `debugVarName` を付与するビルド時トランスフォーマー用ラッパー。
 * StyleTemplate 以外の入力に対しては型透過な identity として動作する。
 *
 * @typeParam T - 入力値の型（出力もそのまま `T`）
 * @param value - ラップ対象の値（通常は `createStyle(...)` の戻り値）
 * @param debugVarName - 付与するデバッグ用変数名（ビルド時に AST から抽出）
 * @returns StyleTemplate ならば `debugVarName` を付与した frozen コピー、
 *          それ以外は `value` をそのまま返す
 */
export function __draftole_label__<T>(value: T, debugVarName: string): T {
  if (
    typeof value === 'object' &&
    value !== null &&
    (value as { _kind?: unknown })._kind === 'styleTemplate' &&
    'bodyHash' in (value as object)
  ) {
    return Object.freeze({ ...(value as object), debugVarName }) as unknown as T;
  }
  return value;
}
