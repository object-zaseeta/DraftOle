/**
 * スコープドCSSクラス名生成ユーティリティ
 *
 * タグパスから決定的なハッシュを生成し、デバッグ可能なユニークCSSクラス名を作成する。
 * djb2 アルゴリズムによりタグパス全体の衝突耐性を担保しつつ、
 * タグパスを正規化した人間可読 prefix を組み合わせる。
 *
 * ## 出力フォーマット (新フォーマット)
 *
 * - 非空 prefix: `_<prefix>__<hash>` (例: `_html-body-div-p-span__a1b2c3d4`)
 * - 空 prefix:   `_<hash>`           (例: `_a1b2c3d4`)
 *
 * prefix は tagPath を lower-case kebab に正規化したもの。最大 32 文字、
 * 末尾要素を優先して残す。連結子は二重アンダースコア `__`。
 *
 * ## 特徴
 *
 * - **決定的**: 同じ入力に対して常に同じ出力
 * - **デバッグ可能**: prefix から元のタグパス末尾を視認できる
 * - **衝突耐性**: djb2 ハッシュは tagPath 全体に対して計算するため、
 *   prefix が同一に切り詰まっても全体クラス名は衝突しない
 *
 * @module scoped-css-generator
 */

/**
 * prefix 部の最大長 (文字数)。
 * design.md "prefix 正規化ルール" より固定値。外部公開しない。
 */
const PREFIX_MAX_LEN = 32;

/**
 * tagPath を CSS クラス prefix 用に正規化する (module-private)。
 *
 * design.md の正規化 6 ステップを厳密に実装する:
 *   1. lower-case 化
 *   2. `[a-z0-9-]` 以外を `-` に置換
 *   3. 連続する `-` を 1 個に畳む
 *   4. 先頭・末尾の `-` を除去
 *   5. 32 文字を超える場合は末尾から 32 文字を残す
 *      (トリム後に先頭が `-` で始まる場合は除去)
 *   6. 結果が空ならそのまま空文字を返す
 *
 * @param tagPath - 任意のタグパス文字列
 * @returns 正規化済み prefix (空文字許容)
 */
function sanitizeTagPathForClassPrefix(tagPath: string): string {
  // Step 1: lower-case 化
  let s = tagPath.toLowerCase();
  // Step 2: 無効文字を `-` に置換
  s = s.replace(/[^a-z0-9-]/g, '-');
  // Step 3: 連続する `-` を 1 個に畳む
  s = s.replace(/-+/g, '-');
  // Step 4: 端の `-` を除去
  s = s.replace(/^-+/, '').replace(/-+$/, '');
  // Step 5: 末尾優先で 32 文字に切り詰め
  if (s.length > PREFIX_MAX_LEN) {
    s = s.slice(s.length - PREFIX_MAX_LEN);
    // 切り詰め境界が `-` の途中になった場合、先頭の `-` を除去
    s = s.replace(/^-+/, '');
  }
  // Step 6: 空文字許容 (そのまま返す)
  return s;
}

/**
 * djb2ハッシュアルゴリズム
 *
 * Dan Bernstein のハッシュ関数。文字列から32ビットの符号なし整数ハッシュを計算し、
 * 8文字の16進数文字列として返す。
 *
 * ## アルゴリズムの詳細
 *
 * 1. 初期値 5381 から開始
 * 2. 各文字に対して: `hash = (hash << 5) + hash + charCode`
 * 3. 符号なし32ビット整数に変換（`>>> 0`）
 * 4. 16進数8桁の文字列に変換
 *
 * @param str - ハッシュ対象の文字列
 * @returns 8文字の16進数文字列
 *
 * @example
 * ```ts
 * djb2Hash('html>body>div');
 * // → "a1b2c3d4" (例)
 *
 * djb2Hash('html>body>span');
 * // → "e5f6a7b8" (例、異なる値)
 * ```
 */
export function djb2Hash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * スコープドCSSクラス名を生成する (新フォーマット)
 *
 * tagPath を正規化した prefix と djb2 ハッシュを組み合わせ、
 * デバッグ可能かつ衝突耐性のあるクラス名を返す。
 *
 * ## 出力仕様
 *
 * - 非空 prefix: `_<prefix>__<hash>` (例: `_html-body-div-p-span__a1b2c3d4`)
 * - 空 prefix:   `_<hash>`           (例: `_a1b2c3d4`)
 *
 * prefix は最大 32 文字、末尾要素を優先して残す。連結子は二重アンダースコア `__`。
 * 正規化結果が空文字になった場合は `__` ごと省略し従来形式に縮退する。
 *
 * @param tagPath - タグの階層パス（例: 'html>body>div'）
 * @returns スコープドCSSクラス名
 *
 * @example
 * ```ts
 * generateScopedClassName('html>body>div>p>span');
 * // → "_html-body-div-p-span__a1b2c3d4"
 *
 * generateScopedClassName('');
 * // → "_a1b2c3d4" (空 prefix 縮退)
 *
 * generateScopedClassName('>>>');
 * // → "_xxxxxxxx" (全文字無効 → 空 prefix 縮退)
 * ```
 */
export function generateScopedClassName(
  tagPath: string,
  options?: { minify?: boolean },
): string {
  const hash = djb2Hash(tagPath);
  if (options?.minify === true) {
    return `_${hash}`;
  }
  const prefix = sanitizeTagPathForClassPrefix(tagPath);
  return prefix.length === 0 ? `_${hash}` : `_${prefix}__${hash}`;
}

/**
 * varName 部の最大長 (文字数)。
 * requirements.md 1.4 より固定値。外部公開しない。
 */
const VARNAME_MAX_LEN = 24;

/**
 * varName を CSS クラスの varName フラグメント用に正規化する (module-private)。
 *
 * `sanitizeTagPathForClassPrefix` と同じ文字クラスルールを適用し、
 * 末尾を 24 文字までに切り詰める。
 *
 *   1. lower-case 化
 *   2. `[a-z0-9-]` 以外を `-` に置換
 *   3. 連続する `-` を 1 個に畳む
 *   4. 先頭・末尾の `-` を除去
 *   5. 24 文字を超える場合は先頭から 24 文字を残す
 *      (切り詰め後に末尾が `-` の場合は除去)
 *   6. 結果が空ならそのまま空文字を返す
 *
 * @param varName - 任意の変数名文字列
 * @returns 正規化済み varName フラグメント (空文字許容)
 */
function sanitizeVarNameForClass(varName: string): string {
  let s = varName.toLowerCase();
  s = s.replace(/[^a-z0-9-]/g, '-');
  s = s.replace(/-+/g, '-');
  s = s.replace(/^-+/, '').replace(/-+$/, '');
  if (s.length > VARNAME_MAX_LEN) {
    s = s.slice(0, VARNAME_MAX_LEN);
    s = s.replace(/-+$/, '');
  }
  return s;
}

/**
 * varName 付きスコープドCSSクラス名を生成する
 *
 * tagPath を正規化した prefix と varName を正規化したフラグメントを組み合わせ、
 * djb2 ハッシュには `tagPath + '|' + varName` を入力することで、
 * 同一 tagPath 上の異なる varName が常に異なるハッシュを得るようにする。
 *
 * ## 出力仕様
 *
 * - 通常: `_<sanitizedTagPath>_<sanitizedVarName>__<hash>`
 *   (prefix と varName 間は単一 `_`、hash 前は二重 `__`)
 * - `varName` が空 (または trim 後に空) → `generateScopedClassName(tagPath)` に委譲
 * - `sanitizeVarNameForClass(varName)` が空 → `generateScopedClassName(tagPath)` に委譲
 *
 * varName フラグメントは最大 24 文字。ハッシュ入力にはサニタイズ前の
 * 生の `tagPath` と `varName` をそのまま使用するため、見た目が同じでも
 * 原文字列が異なれば衝突しない。
 *
 * @param tagPath - タグの階層パス（例: 'html>body>div'）
 * @param varName - 変数名（例: 'card'）
 * @returns varName 付きスコープドCSSクラス名
 *
 * @example
 * ```ts
 * generateScopedClassNameWithVarName('html>body>div', 'card');
 * // → "_html-body-div_card__a1b2c3d4"
 *
 * generateScopedClassNameWithVarName('html>body>div', '');
 * // → "_html-body-div__<hash>" (generateScopedClassName に委譲)
 *
 * generateScopedClassNameWithVarName('html>body>div', '___');
 * // → "_html-body-div__<hash>" (サニタイズ後空のため委譲)
 * ```
 */
export function generateScopedClassNameWithVarName(
  tagPath: string,
  varName: string,
  options?: { minify?: boolean },
): string {
  // 空 varName は委譲
  if (varName.trim().length === 0) {
    return generateScopedClassName(tagPath, options);
  }
  const sanitizedVar = sanitizeVarNameForClass(varName);
  if (sanitizedVar.length === 0) {
    return generateScopedClassName(tagPath, options);
  }
  const hash = djb2Hash(`${tagPath}|${varName}`);
  if (options?.minify === true) {
    return `_${hash}`;
  }
  const prefix = sanitizeTagPathForClassPrefix(tagPath);
  return prefix.length === 0
    ? `_${sanitizedVar}__${hash}`
    : `_${prefix}_${sanitizedVar}__${hash}`;
}

/**
 * varName + 既知 bodyHash 付きスコープドCSSクラス名を生成する
 *
 * `generateScopedClassNameWithVarName` と同形式の出力を返すが、
 * ハッシュ部にはここで djb2 を再計算せず、呼び出し側が既に保持している
 * `bodyHash` 文字列をそのまま採用する。
 *
 * これは `CssManager.registerTemplate` 経路用の特殊化版で、
 * `StyleTemplate.bodyHash`（既にスタイル本体に対する一意ハッシュ）を
 * 視覚的フラグメントとして varName と組み合わせるために用いる。
 * djb2 を再計算しないことで、同一 bodyHash を持つ別 varName が
 * 同じハッシュ尾を共有し、出力 CSS のグルーピング視認性を保つ。
 *
 * ## 出力仕様
 *
 * - 通常: `_<sanitizedTagPath>_<sanitizedVarName>__<bodyHash>`
 * - prefix 空: `_<sanitizedVarName>__<bodyHash>`
 * - `varName` が空 (または trim/サニタイズ後に空) → bodyHash 経路に縮退:
 *   - prefix 非空: `_<prefix>__<bodyHash>`
 *   - prefix 空:   `_<bodyHash>`
 *
 * @param tagPath - タグの階層パス
 * @param varName - 変数名（空文字許容、空時は縮退）
 * @param bodyHash - スタイル本体ハッシュ（再ハッシュせずそのまま採用）
 * @returns varName + bodyHash 付きスコープドCSSクラス名
 *
 * @example
 * ```ts
 * generateScopedClassNameWithVarNameAndHash('html>body>div', 'card', 'abc12345');
 * // → "_html-body-div_card__abc12345"
 *
 * generateScopedClassNameWithVarNameAndHash('html>body>div', '', 'abc12345');
 * // → "_html-body-div__abc12345" (bodyHash 経路に縮退)
 * ```
 */
export function generateScopedClassNameWithVarNameAndHash(
  tagPath: string,
  varName: string,
  bodyHash: string,
  options?: { minify?: boolean },
): string {
  if (options?.minify === true) {
    return `_${bodyHash}`;
  }
  const prefix = sanitizeTagPathForClassPrefix(tagPath);
  // varName が空 (または trim 後に空) の場合は bodyHash 経路に縮退
  if (varName.trim().length === 0) {
    return prefix.length === 0 ? `_${bodyHash}` : `_${prefix}__${bodyHash}`;
  }
  const sanitizedVar = sanitizeVarNameForClass(varName);
  if (sanitizedVar.length === 0) {
    return prefix.length === 0 ? `_${bodyHash}` : `_${prefix}__${bodyHash}`;
  }
  return prefix.length === 0
    ? `_${sanitizedVar}__${bodyHash}`
    : `_${prefix}_${sanitizedVar}__${bodyHash}`;
}
