/**
 * 識別子リゾルバ（IdentifierResolver）
 *
 * 構造パス（tagPath）から CSS クラス名と HTML id を決定的に生成する純関数群。
 * 同じ入力に対して常に同じ出力を返し、副作用を持たない（ビルド間で安定）。
 *
 * ## 設計方針
 *
 * - **バイト等価（受動追従）**: `resolveClassName(tagPath)` の bodyHash 省略経路は
 *   `generateScopedClassName(tagPath)` の出力に **バイト等価** な値を返す。
 *   THEMECLASS-3 で `generateScopedClassName` が debuggable prefix 形式
 *   （例: `_body-div-header__a1b2c3d4`）に拡張された場合、本関数は委譲によって
 *   受動的に新フォーマットへ追従する（自関数内で prefix 生成ロジックを持たない）。
 * - **bodyHash 付き経路の据え置き**: `bodyHash` 指定時は現フォーマット
 *   `_<djb2(tagPath)>_<djb2(bodyHash)>` を維持する。本経路は THEMECLASS-3 の
 *   debuggable prefix 適用対象外（本 spec のスコープ外）であり、新 prefix は
 *   付与しない。
 * - **id 生成**: `resolveId(tagPath)` は `_id_<djb2(tagPath)>` 形式を返し、
 *   クラス名空間とは `_id_` プレフィックスで名前空間が分離される（要件 3.5）。
 *
 * 要件: 1.2, 1.3, 2.3, 3.1, 3.3, 3.4, 3.5, 3.6, 3.7, 5.1, 5.2
 *
 * @module identifier-resolver
 */

import {
  djb2Hash,
  generateScopedClassName,
  generateScopedClassNameWithVarName,
  generateScopedClassNameWithVarNameAndHash,
} from './scoped-css-generator';

/**
 * 識別子リゾルバのインターフェース
 *
 * tagPath からクラス名・ID を決定的に生成する責務を持つ。
 * 純関数の集合体としてふるまい、状態を持たない。
 */
export interface IdentifierResolver {
  /**
   * tagPath（と任意の bodyHash, varName）から CSS クラス名を解決する。
   *
   * @param tagPath - 要素の構造パス（例: `'html>body>div'`）
   * @param bodyHash - スタイル本体の djb2 ハッシュ（省略可）
   * @param varName - `theme.class()` 呼び出し由来の変数名（省略可）。
   *   `bodyHash === undefined && varName !== undefined && varName !== ''` の場合のみ
   *   `generateScopedClassNameWithVarName(tagPath, varName)` 経路に分岐する。
   */
  resolveClassName(
    tagPath: string,
    bodyHash?: string,
    varName?: string,
  ): string;

  /**
   * tagPath から HTML id 文字列を解決する。
   *
   * @param tagPath - 要素の構造パス
   */
  resolveId(tagPath: string): string;
}

/**
 * tagPath が空でないことを保証する内部ガード。
 *
 * 空文字列は意味的に無効（root 要素自身は対象外）であるため、
 * プログラミングエラーとして例外をスローする。
 */
function assertTagPath(tagPath: string): void {
  if (tagPath === '') {
    throw new Error(
      'IdentifierResolver: tagPath は非空文字列でなければなりません',
    );
  }
}

/**
 * tagPath と任意の bodyHash から CSS クラス名を生成する純関数。
 *
 * ## 3 つの経路
 *
 * - **varName 経路（class-name-varname-extraction）**: `bodyHash === undefined`
 *   かつ `varName !== undefined && varName !== ''` の場合、
 *   `generateScopedClassNameWithVarName(tagPath, varName)` に委譲する。
 *   `theme.class()` 呼び出しから抽出された変数名をクラス名フラグメントに
 *   埋め込むことで、出力 CSS/HTML 上で意味的識別子を視認可能にする。
 * - **bodyHash 省略経路（debuggable / 受動追従）**: `generateScopedClassName(tagPath)`
 *   へ委譲し、その戻り値を **バイト等価** で返す（要件 3.3, 3.6, 3.7）。
 *   THEMECLASS-3 によって `generateScopedClassName` が debuggable prefix 形式
 *   （タグパス由来の可読 prefix + djb2 ハッシュサフィックス）へ拡張された場合、
 *   本経路は自動的に新フォーマットへ追従する。本関数内で prefix 生成・正規化を
 *   独自に再実装してはならない（単一情報源の維持、要件 5.1）。
 * - **bodyHash 指定経路（legacy / debuggable 非対象）**: `_<djb2(tagPath)>_<djb2(bodyHash)>`
 *   形式を返す（要件 1.2, 1.3, 2.3, 3.4）。本経路は THEMECLASS-3 の debuggable
 *   prefix 適用対象外であり（本 spec のスコープ外、要件 5.2）、新 prefix は
 *   付与しない。同一 tagPath でもスタイル本体が異なれば bodyHash 部によって
 *   別クラス名となり、衝突を回避する。
 *   なお `bodyHash` が指定された場合、`varName` は無視される（後方互換維持）。
 *
 * @param tagPath - 要素の構造パス
 * @param bodyHash - スタイル本体ハッシュ（省略可）
 * @param varName - `theme.class()` 由来の変数名（省略可）。
 *   `bodyHash === undefined && varName !== undefined && varName !== ''` のときのみ
 *   varName 経路に分岐する。
 * @returns CSS クラス名
 *
 * @example
 * ```ts
 * // bodyHash 省略経路: generateScopedClassName と常にバイト等価
 * resolveClassName('html>body>div');
 *
 * // varName 経路: generateScopedClassNameWithVarName に委譲
 * resolveClassName('html>body>div', undefined, 'card');
 *
 * // bodyHash 指定経路: legacy 形式を維持（debuggable prefix なし）
 * resolveClassName('html>body>div', 'flex-gap-12');
 * // → '_<djb2(tagPath)>_<djb2(bodyHash)>'
 * ```
 */
export function resolveClassName(
  tagPath: string,
  bodyHash?: string,
  varName?: string,
  options?: { minify?: boolean },
): string {
  assertTagPath(tagPath);
  const minify = options?.minify === true;
  if (bodyHash === undefined) {
    if (varName !== undefined && varName !== '') {
      return generateScopedClassNameWithVarName(tagPath, varName, { minify });
    }
    return generateScopedClassName(tagPath, { minify });
  }
  // bodyHash 指定経路:
  // - minify 有効時は `_<djb2(tagPath + bodyHash)>` の合成ハッシュへ縮退
  // - varName 併用時: `_<prefix>_<sanitizedVarName>__<bodyHash>` 形式
  //   （bodyHash をハッシュ尾に流用し、視覚的に varName を埋め込む）
  // - varName なし: legacy `_<djb2(tagPath)>_<djb2(bodyHash)>` 形式を維持
  if (minify) {
    return `_${djb2Hash(`${tagPath}|${bodyHash}`)}`;
  }
  if (varName !== undefined && varName !== '') {
    return generateScopedClassNameWithVarNameAndHash(
      tagPath,
      varName,
      bodyHash,
    );
  }
  return `_${djb2Hash(tagPath)}_${djb2Hash(bodyHash)}`;
}

/**
 * minify オプション付きで `IdentifierResolver` を生成するファクトリ。
 *
 * `CssConfig.minifyClassNames` を伝搬するために、構築時に minify モードを
 * 固定した IdentifierResolver を返す。`resolveId` は minify モードの影響を
 * 受けないため、デフォルトと同じ実装を共有する。
 *
 * @param options - `{ minify?: boolean }`（省略時は `minify: false`）
 * @returns minify モードを内包した IdentifierResolver
 *
 * @example
 * ```ts
 * const resolver = createIdentifierResolver({ minify: true });
 * resolver.resolveClassName('html>body>div'); // → "_<8hex>"
 * ```
 */
export function createIdentifierResolver(
  options?: { minify?: boolean },
): IdentifierResolver {
  const minify = options?.minify === true;
  return {
    resolveClassName(tagPath, bodyHash, varName) {
      return resolveClassName(tagPath, bodyHash, varName, { minify });
    },
    resolveId,
  };
}

/**
 * tagPath から HTML id 文字列を生成する純関数。
 *
 * `_id_<djb2(tagPath)>` 形式を返す（要件 3.1, 3.6, 3.7）。
 *
 * ## 名前空間分離の契約（要件 3.5）
 *
 * id 文字列は **常に `_id_` プレフィックスで始まる** ことにより、クラス名空間と
 * id 名前空間が文字列レベルで分離される。クラス名側は（debuggable prefix 形式
 * へ拡張された後も）`_id_` プレフィックスを生成しないため、同一 tagPath から
 * 派生したクラス名文字列と id 文字列を相互に誤って解釈することはできない。
 * THEMECLASS-3 によるクラス名フォーマット変更は本契約に影響しない。
 *
 * @param tagPath - 要素の構造パス
 * @returns HTML id 文字列（必ず `_id_` プレフィックスで始まる）
 *
 * @example
 * ```ts
 * resolveId('html>body>div');
 * // → '_id_<djb2(tagPath)>'  （例: '_id_a1b2c3d4'）
 * ```
 */
export function resolveId(tagPath: string): string {
  assertTagPath(tagPath);
  return `_id_${djb2Hash(tagPath)}`;
}

/**
 * デフォルトの IdentifierResolver 実装。
 *
 * 純関数 `resolveClassName` / `resolveId` をインターフェース経由で
 * 利用したい呼び出し側のためのシングルトンラッパー。
 */
export const defaultIdentifierResolver: IdentifierResolver = {
  resolveClassName,
  resolveId,
};
