/**
 * THEMECLASS-3: debuggable class name のテスト
 *
 * djb2 ハッシュ計算 (`djb2Hash`) と、新フォーマットの
 * スコープドCSSクラス名生成 (`generateScopedClassName`) を検証する。
 *
 * 新フォーマット契約:
 *   - 非空 prefix: `_<prefix>__<hash>` ( /^_[a-z0-9-]+__[0-9a-f]{8}$/ )
 *   - 空 prefix:   `_<hash>`           ( /^_[0-9a-f]{8}$/ )
 *   - prefix は tagPath を lower-case kebab に正規化、最大 32 文字、末尾要素を優先して残す。
 *   - 連結子は二重アンダースコア `__`。
 *   - djb2Hash の数値計算結果は不変（戻り値末尾 8 桁として常に含まれる）。
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.6, 4.1, 4.3
 *
 * 回帰検出点 (Task 4.1):
 *   - Req 1.4 衝突耐性  → describe 'prefix 切り詰め境界での衝突耐性'
 *   - Req 2.1 無効文字   → describe '無効文字・区切り文字の正規化'
 *   - Req 2.3 prefix 切り詰めでの一意性 → describe 'prefix 切り詰め境界での衝突耐性'
 *   - Req 2.4 空 prefix 縮退 → describe '空 prefix 縮退'
 *   - Req 3.6 djb2Hash 数値不変 → describe 'djb2Hash' 全 describe（出力フォーマット・決定性・一意性・特殊文字）
 *   これらの describe を統合・削除する場合は本 spec の回帰検出契約を壊す。
 */
import { describe, it, expect } from 'vitest';
import {
  djb2Hash,
  generateScopedClassName,
  generateScopedClassNameWithVarName,
} from '../../../src/css/utils/scoped-css-generator.js';

// 新フォーマットの prefix 部最大長（design.md "prefix 正規化ルール" より）
const PREFIX_MAX_LEN = 32;

// ============================================================
// djb2Hash （Requirement 3.6 不変）
// ============================================================

describe('djb2Hash', () => {
  // ── 決定性検証 ──

  describe('決定性', () => {
    it('同一入力に対して常に同一出力を返す', () => {
      const input = 'html>body>div';
      const result1 = djb2Hash(input);
      const result2 = djb2Hash(input);
      expect(result1).toBe(result2);
    });

    it('複数回呼び出しても結果が変わらない', () => {
      const input = 'html>body>div>p>span';
      const results = Array.from({ length: 100 }, () => djb2Hash(input));
      const allSame = results.every((r) => r === results[0]);
      expect(allSame).toBe(true);
    });
  });

  // ── 出力フォーマット ──

  describe('出力フォーマット', () => {
    it('8文字の16進数文字列を返す', () => {
      const result = djb2Hash('test');
      expect(result).toMatch(/^[0-9a-f]{8}$/);
    });

    it('空文字列入力でも8文字の16進数を返す', () => {
      const result = djb2Hash('');
      expect(result).toMatch(/^[0-9a-f]{8}$/);
    });

    it('長い文字列でも8文字の16進数を返す', () => {
      const longInput = 'a'.repeat(1000);
      const result = djb2Hash(longInput);
      expect(result).toMatch(/^[0-9a-f]{8}$/);
    });
  });

  // ── 異なる入力での一意性 ──

  describe('一意性', () => {
    it('異なる入力に対して異なる出力を返す', () => {
      const hash1 = djb2Hash('html>body>div');
      const hash2 = djb2Hash('html>body>span');
      expect(hash1).not.toBe(hash2);
    });

    it('類似した入力でも異なるハッシュを生成する', () => {
      const hash1 = djb2Hash('div1');
      const hash2 = djb2Hash('div2');
      expect(hash1).not.toBe(hash2);
    });

    it('複数の異なるパスに対してユニークなハッシュを生成する', () => {
      const paths = [
        'html>body>div',
        'html>body>span',
        'html>body>div>p',
        'html>body>div>h1',
        'html>body>section>article',
      ];
      const hashes = paths.map((p) => djb2Hash(p));
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(paths.length);
    });
  });

  // ── 特殊文字 ──

  describe('特殊文字', () => {
    it('Unicode文字を含む入力を処理できる', () => {
      const result = djb2Hash('日本語テスト');
      expect(result).toMatch(/^[0-9a-f]{8}$/);
    });

    it('記号を含む入力を処理できる', () => {
      const result = djb2Hash('html>body>div.class#id');
      expect(result).toMatch(/^[0-9a-f]{8}$/);
    });
  });
});

// ============================================================
// generateScopedClassName — 新フォーマット契約
// ============================================================

describe('generateScopedClassName', () => {
  // ── 新フォーマット形状 (Requirement 1.1, 1.2, 3.6) ──

  describe('新フォーマット形状', () => {
    it('非空 tagPath で `_<prefix>__<hash>` 形状を返す (Req 1.1, 1.2)', () => {
      const result = generateScopedClassName('html>body>div>p>span');
      expect(result).toMatch(/^_[a-z0-9-]+__[0-9a-f]{8}$/);
    });

    it('戻り値末尾 8 桁が djb2Hash(tagPath) と一致する (Req 3.6)', () => {
      const tagPath = 'html>body>div>p>span';
      const expectedHash = djb2Hash(tagPath);
      const className = generateScopedClassName(tagPath);
      expect(className.endsWith(expectedHash)).toBe(true);
      expect(className.slice(-8)).toBe(expectedHash);
    });

    it('`__` (二重アンダースコア) で prefix と hash を区切る (Req 1.1)', () => {
      const tagPath = 'html>body>div';
      const className = generateScopedClassName(tagPath);
      // 末尾は __<hash>
      expect(className).toMatch(/__[0-9a-f]{8}$/);
      // 全体は単一の `__` 区切り（先頭 `_` を除いた本体中の `__` は 1 度のみ）
      const body = className.slice(1); // strip leading `_`
      const doubleUnderscoreCount = body.split('__').length - 1;
      expect(doubleUnderscoreCount).toBe(1);
    });
  });

  // ── 空 prefix 縮退 (Requirement 2.4) ──

  describe('空 prefix 縮退', () => {
    it('空 tagPath で `_<hash>` 形状に縮退する (Req 2.4)', () => {
      const result = generateScopedClassName('');
      expect(result).toMatch(/^_[0-9a-f]{8}$/);
      // `__` 区切りを含まない
      expect(result).not.toContain('__');
    });

    it('空 tagPath の戻り値末尾 8 桁が djb2Hash("") と一致する (Req 3.6)', () => {
      const result = generateScopedClassName('');
      expect(result).toBe(`_${djb2Hash('')}`);
    });

    it('全文字が無効な tagPath でも `_<hash>` 縮退で例外化しない (Req 2.4)', () => {
      // `>` のみで構成された tagPath は正規化後 prefix が空になる想定
      const result = generateScopedClassName('>>>');
      expect(result).toMatch(/^_[0-9a-f]{8}$/);
      expect(result).not.toContain('__');
      expect(result.slice(-8)).toBe(djb2Hash('>>>'));
    });
  });

  // ── prefix lower-case 統一 (Requirement 2.5) ──

  describe('prefix lower-case 統一', () => {
    it('大文字を含む tagPath でも prefix が lower-case 統一される (Req 2.5)', () => {
      const result = generateScopedClassName('HTML>BODY>DIV');
      expect(result).toMatch(/^_[a-z0-9-]+__[0-9a-f]{8}$/);
      // prefix 部 (先頭 `_` と `__<hash>` を除いた部分) に大文字が含まれない
      const prefixMatch = result.match(/^_([a-z0-9-]+)__[0-9a-f]{8}$/);
      expect(prefixMatch).not.toBeNull();
      const prefix = prefixMatch?.[1] ?? '';
      expect(prefix).toBe(prefix.toLowerCase());
    });

    it('大小ゆらぎが同一入力に対する決定性を破らない (Req 1.3, 2.5)', () => {
      const a = generateScopedClassName('Html>Body>Div');
      const b = generateScopedClassName('Html>Body>Div');
      expect(a).toBe(b);
    });
  });

  // ── 無効文字・区切り文字の正規化 (Requirement 2.1, 1.2) ──

  describe('無効文字・区切り文字の正規化', () => {
    it('`>` を `-` に正規化する (Req 2.1)', () => {
      const result = generateScopedClassName('html>body>div');
      // prefix 部に `>` を含まない
      expect(result).not.toContain('>');
      // prefix 部に `-` 区切りが含まれる
      expect(result).toMatch(/^_[a-z0-9-]+__[0-9a-f]{8}$/);
    });

    it('CSS 識別子として無効な文字 (`.`, `#`, ` `, `/` 等) を `-` に正規化する (Req 2.1, 1.2)', () => {
      const result = generateScopedClassName('html>body>div.cls#id /x');
      // 全体が新フォーマット (lower-case kebab + hash) に収まる
      expect(result).toMatch(/^_[a-z0-9-]+__[0-9a-f]{8}$/);
      // 無効文字が prefix に漏れていない
      expect(result).not.toMatch(/[.#/ ]/);
    });

    it('連続する `-` を 1 個に畳む (Req 2.1)', () => {
      // `>>` のような連続区切りや `>.>` のような無効文字混在で `--` 以上が出ない
      const result = generateScopedClassName('html>>body>>>div');
      expect(result).toMatch(/^_[a-z0-9-]+__[0-9a-f]{8}$/);
      const prefixMatch = result.match(/^_([a-z0-9-]+)__[0-9a-f]{8}$/);
      const prefix = prefixMatch?.[1] ?? '';
      expect(prefix).not.toMatch(/--/);
    });

    it('先頭・末尾の `-` を除去する (Req 2.1, 1.2)', () => {
      const result = generateScopedClassName('>html>body>');
      expect(result).toMatch(/^_[a-z0-9-]+__[0-9a-f]{8}$/);
      const prefixMatch = result.match(/^_([a-z0-9-]+)__[0-9a-f]{8}$/);
      const prefix = prefixMatch?.[1] ?? '';
      expect(prefix.startsWith('-')).toBe(false);
      expect(prefix.endsWith('-')).toBe(false);
    });
  });

  // ── prefix 長上限・末尾要素優先 (Requirement 2.2, 1.5) ──

  describe('prefix 長上限と末尾要素優先', () => {
    it('50 階層長大 tagPath でも prefix が 32 文字以下に収まる (Req 2.2)', () => {
      const longPath = Array.from({ length: 50 }, (_, i) => `div${i}`).join('>');
      const result = generateScopedClassName(longPath);
      expect(result).toMatch(/^_[a-z0-9-]+__[0-9a-f]{8}$/);
      const prefixMatch = result.match(/^_([a-z0-9-]+)__[0-9a-f]{8}$/);
      const prefix = prefixMatch?.[1] ?? '';
      expect(prefix.length).toBeLessThanOrEqual(PREFIX_MAX_LEN);
    });

    it('50 階層長大 tagPath で末尾要素 (最深要素) が prefix に残る (Req 1.5, 2.2)', () => {
      const longPath = Array.from({ length: 50 }, (_, i) => `div${i}`).join('>');
      // 末尾は `div49`
      const result = generateScopedClassName(longPath);
      const prefixMatch = result.match(/^_([a-z0-9-]+)__[0-9a-f]{8}$/);
      const prefix = prefixMatch?.[1] ?? '';
      expect(prefix.includes('div49')).toBe(true);
    });

    it('長大 tagPath でも戻り値末尾 8 桁は djb2Hash と一致する (Req 3.6, 2.2)', () => {
      const longPath = Array.from({ length: 50 }, (_, i) => `div${i}`).join('>');
      const result = generateScopedClassName(longPath);
      expect(result.slice(-8)).toBe(djb2Hash(longPath));
    });
  });

  // ── prefix 切り詰め境界での衝突耐性 (Requirement 1.4, 2.3) ──

  describe('prefix 切り詰め境界での衝突耐性', () => {
    it('prefix が同一に切り詰まっても tagPath が異なれば戻り値全体が一致しない (Req 1.4, 2.3)', () => {
      // 末尾 32 文字部分が一致するように設計した 2 つの異なる長大 tagPath。
      // 先頭側に異なる prefix-only 要素を置き、末尾は同一にする。
      const tail = Array.from({ length: 20 }, (_, i) => `node${i}`).join('>');
      const pathA = `aaaaaaaaaaaa>${tail}`;
      const pathB = `bbbbbbbbbbbb>${tail}`;
      const a = generateScopedClassName(pathA);
      const b = generateScopedClassName(pathB);
      // djb2Hash は tagPath 全体に対する関数なので、tagPath が異なれば hash も異なる
      expect(djb2Hash(pathA)).not.toBe(djb2Hash(pathB));
      // よって prefix が同じに切り詰められても全体は一致しない
      expect(a).not.toBe(b);
    });
  });

  // ── 決定性 (Requirement 1.3) ──

  describe('決定性', () => {
    it('同一 tagPath に対して常に同一クラス名を返す (Req 1.3)', () => {
      const tagPath = 'html>body>div>p';
      const result1 = generateScopedClassName(tagPath);
      const result2 = generateScopedClassName(tagPath);
      expect(result1).toBe(result2);
    });

    it('100 回呼び出しても結果が変わらない (Req 1.3)', () => {
      const tagPath = 'html>body>section>article>p';
      const results = Array.from({ length: 100 }, () =>
        generateScopedClassName(tagPath),
      );
      const allSame = results.every((r) => r === results[0]);
      expect(allSame).toBe(true);
    });
  });

  // ── 異なるパスでの一意性 (Requirement 1.4) ──

  describe('異なるパスでの一意性', () => {
    it('異なる tagPath に対して異なるクラス名を返す (Req 1.4)', () => {
      const class1 = generateScopedClassName('html>body>div');
      const class2 = generateScopedClassName('html>body>span');
      expect(class1).not.toBe(class2);
    });
  });

  // ── 既存フォーマット回帰（class-name-varname-extraction Task 2.2 (d)） ──

  describe('既存フォーマット回帰（varName 拡張による副作用なし）', () => {
    it('generateScopedClassName("html>body>div>p>span") が新フォーマット形状を維持する', () => {
      // varName 拡張（generateScopedClassNameWithVarName 追加）による副作用が
      // 既存 generateScopedClassName の出力に影響していないことの回帰チェック。
      const tagPath = 'html>body>div>p>span';
      const result = generateScopedClassName(tagPath);
      expect(result).toMatch(/^_[a-z0-9-]+__[0-9a-f]{8}$/);
      expect(result.slice(-8)).toBe(djb2Hash(tagPath));
    });
  });
});

// ============================================================
// generateScopedClassNameWithVarName — class-name-varname-extraction
// ============================================================

describe('generateScopedClassNameWithVarName', () => {
  it('形状: `_<prefix>_<varName>__<hash>` にマッチする', () => {
    const result = generateScopedClassNameWithVarName('html>body>div', 'card');
    expect(result).toMatch(/^_[a-z0-9-]+_card__[0-9a-f]{8}$/);
  });

  it('同 tagPath / 異 varName → 異クラス名（hash 部も異なる）', () => {
    const a = generateScopedClassNameWithVarName('p', 'a');
    const b = generateScopedClassNameWithVarName('p', 'b');
    expect(a).not.toBe(b);
    // hash 部（末尾 8 桁）も異なる
    expect(a.slice(-8)).not.toBe(b.slice(-8));
  });

  it('空 varName → generateScopedClassName(tagPath) と byte-equivalent', () => {
    const tagPath = 'html>body>div';
    expect(generateScopedClassNameWithVarName(tagPath, '')).toBe(
      generateScopedClassName(tagPath),
    );
  });
});

describe('minify モード（class-name-minify）', () => {
  describe('generateScopedClassName', () => {
    it('options 未指定 → 現行 byte-equivalent', () => {
      const tagPath = 'html>body>div';
      expect(generateScopedClassName(tagPath)).toBe(
        generateScopedClassName(tagPath, { minify: false }),
      );
    });

    it('minify: false → 現行 debuggable と byte-equivalent', () => {
      const tagPath = 'html>body>div';
      const baseline = generateScopedClassName(tagPath);
      expect(generateScopedClassName(tagPath, { minify: false })).toBe(baseline);
    });

    it('minify: true → /^_[0-9a-f]{8}$/', () => {
      expect(generateScopedClassName('html>body>div', { minify: true })).toMatch(
        /^_[0-9a-f]{8}$/,
      );
    });

    it('minify: true → hash は djb2Hash(tagPath) と一致', () => {
      const tagPath = 'html>body>div>p>span';
      const minified = generateScopedClassName(tagPath, { minify: true });
      expect(minified).toBe(`_${djb2Hash(tagPath)}`);
    });
  });

  describe('generateScopedClassNameWithVarName', () => {
    it('options 未指定 → 現行 byte-equivalent', () => {
      expect(generateScopedClassNameWithVarName('html>body>div', 'card')).toBe(
        generateScopedClassNameWithVarName('html>body>div', 'card', {
          minify: false,
        }),
      );
    });

    it('minify: true → /^_[0-9a-f]{8}$/', () => {
      expect(
        generateScopedClassNameWithVarName('html>body>div', 'card', {
          minify: true,
        }),
      ).toMatch(/^_[0-9a-f]{8}$/);
    });

    it('minify: true で空 varName でも `_<8hex>` を返す', () => {
      expect(
        generateScopedClassNameWithVarName('html>body>div', '', {
          minify: true,
        }),
      ).toMatch(/^_[0-9a-f]{8}$/);
    });
  });
});
