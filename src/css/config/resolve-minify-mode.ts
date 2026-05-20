/**
 * `minify` オプションの解決ロジック（純関数）
 *
 * CssConfig の `minify` オプションと `NODE_ENV` 環境変数を入力として、
 * 最終的なミニファイ有効/無効値を決定する。
 *
 * ## 解決ルール
 *
 * 1. `option === true` → `true`（明示的に有効化）
 * 2. `option === false` → `false`（明示的に無効化）
 * 3. `option === undefined` かつ `nodeEnv === 'production'` → `true`（本番自動有効化）
 * 4. それ以外 → `false`（既定で無効）
 *
 * 本関数は副作用を持たず、`process.env` を直接参照しない。
 * 呼び出し側が `process.env.NODE_ENV` を読み取って渡すこと。
 *
 * @param option - CssConfig に渡された `minify` オプション値
 * @param nodeEnv - `process.env.NODE_ENV` の値
 * @returns ミニファイを有効化すべきかどうか
 *
 * @example
 * ```ts
 * resolveMinifyMode(true, undefined);          // → true
 * resolveMinifyMode(false, 'production');      // → false
 * resolveMinifyMode(undefined, 'production');  // → true
 * resolveMinifyMode(undefined, 'development'); // → false
 * resolveMinifyMode(undefined, undefined);     // → false
 * ```
 */
export function resolveMinifyMode(
	option: boolean | undefined,
	nodeEnv: string | undefined,
): boolean {
	if (option === true) return true;
	if (option === false) return false;
	return nodeEnv === 'production';
}
