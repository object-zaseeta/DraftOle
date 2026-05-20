/**
 * IdentifierResolver の単体テスト
 *
 * 構造パス（tagPath）からクラス名・ID を決定的に生成する純関数群を検証する。
 */

import { describe, expect, it } from 'vitest';
import {
  createIdentifierResolver,
  defaultIdentifierResolver,
  resolveClassName,
  resolveId,
} from '../../../src/css/utils/identifier-resolver';
import {
  djb2Hash,
  generateScopedClassName,
  generateScopedClassNameWithVarName,
} from '../../../src/css/utils/scoped-css-generator';

describe('resolveClassName', () => {
  it('bodyHash 省略時は generateScopedClassName と同一値を返す（後方互換）', () => {
    const tagPath = 'html>body>div';
    expect(resolveClassName(tagPath)).toBe(generateScopedClassName(tagPath));
  });

  it('bodyHash 省略時の出力は generateScopedClassName と同じ新フォーマット形状（_<prefix>__<8hex> または _<8hex>）', () => {
    // 要件 3.6, 3.7: bodyHash 省略経路は generateScopedClassName と同一の形状を維持する。
    // 新フォーマット（THEMECLASS-3 Task 1.2 で導入された prefix 付与）にも、
    // prefix が空のケース（_<hash> のみ）にも追従できる正規表現で形状を検証する。
    const result = resolveClassName('html>body>header');
    expect(result).toMatch(/^_(?:[a-z0-9-]+__)?[0-9a-f]{8}$/);
  });

  it('bodyHash あり時は _<djb2(tagPath)>_<djb2(bodyHash)> と完全一致し、新 prefix フォーマットを含まない（要件 3.3, 3.5）', () => {
    // 要件 3.3: bodyHash 経路は現状維持（旧フォーマット `_<hash>_<hash>` を厳密に守る）。
    // 要件 3.5: bodyHash 経路に新 prefix フォーマット（`__` ダブルアンダースコア区切り）が混入していないこと。
    const tagPath = 'html>body>div';
    const bodyHash = 'abc123';
    const expected = `_${djb2Hash(tagPath)}_${djb2Hash(bodyHash)}`;
    const actual = resolveClassName(tagPath, bodyHash);
    expect(actual).toBe(expected);
    // 新 prefix フォーマット（`__` ダブルアンダースコア区切り）が混入していないことを明示的に検証。
    expect(actual).not.toMatch(/__/);
  });

  it('同一 tagPath でも bodyHash が異なれば別クラス名（衝突回避）', () => {
    const tagPath = 'html>body>div';
    const a = resolveClassName(tagPath, 'hashA');
    const b = resolveClassName(tagPath, 'hashB');
    expect(a).not.toBe(b);
  });

  it('純関数性: 同入力に対し常に同出力', () => {
    expect(resolveClassName('a>b>c')).toBe(resolveClassName('a>b>c'));
    expect(resolveClassName('a>b>c', 'h')).toBe(resolveClassName('a>b>c', 'h'));
  });

  it('空 tagPath は例外をスローする', () => {
    expect(() => resolveClassName('')).toThrow();
  });

  // ── class-name-varname-extraction Task 2.4 ──

  it('varName 経路: resolveClassName(tagPath, undefined, "card") は generateScopedClassNameWithVarName と byte-equivalent', () => {
    const tagPath = 'html>body>div';
    expect(resolveClassName(tagPath, undefined, 'card')).toBe(
      generateScopedClassNameWithVarName(tagPath, 'card'),
    );
  });

  it('bodyHash 経路は varName 拡張後も byte-equivalent を維持する（回帰）', () => {
    // varName 拡張による副作用が bodyHash 経路に及んでいないことの回帰チェック。
    const tagPath = 'html>body>div';
    const bodyHash = 'someHash';
    const expected = `_${djb2Hash(tagPath)}_${djb2Hash(bodyHash)}`;
    expect(resolveClassName(tagPath, bodyHash)).toBe(expected);
  });
});

describe('resolveId', () => {
  it('_id_<djb2(tagPath)> 形式を返す', () => {
    const tagPath = 'html>body>div';
    expect(resolveId(tagPath)).toBe(`_id_${djb2Hash(tagPath)}`);
  });

  it('出力は _id_<8文字hex> 形式', () => {
    expect(resolveId('html>body>span')).toMatch(/^_id_[0-9a-f]{8}$/);
  });

  it('純関数性: 同入力に対し常に同出力', () => {
    expect(resolveId('a>b>c')).toBe(resolveId('a>b>c'));
  });

  it('異なる tagPath は異なる id を返す', () => {
    expect(resolveId('a>b>c')).not.toBe(resolveId('a>b>d'));
  });

  it('空 tagPath は例外をスローする', () => {
    expect(() => resolveId('')).toThrow();
  });

  it('同一 tagPath での resolveId と resolveClassName は異なり、resolveId は _id_ プレフィックスで名前空間を識別できる（要件 3.4）', () => {
    // 要件 3.4: 同一 tagPath に対しても id とクラス名は別名前空間（`_id_` プレフィックスで分離）。
    const tagPath = 'html>body>div';
    const idValue = resolveId(tagPath);
    const classValue = resolveClassName(tagPath);
    expect(idValue).not.toBe(classValue);
    expect(idValue.startsWith('_id_')).toBe(true);
  });
});

describe('defaultIdentifierResolver', () => {
  it('IdentifierResolver インターフェースを満たす', () => {
    expect(typeof defaultIdentifierResolver.resolveClassName).toBe('function');
    expect(typeof defaultIdentifierResolver.resolveId).toBe('function');
  });

  it('純関数のラッパーとして同じ結果を返す', () => {
    const tagPath = 'html>body>section';
    expect(defaultIdentifierResolver.resolveClassName(tagPath)).toBe(
      resolveClassName(tagPath),
    );
    expect(defaultIdentifierResolver.resolveClassName(tagPath, 'h')).toBe(
      resolveClassName(tagPath, 'h'),
    );
    expect(defaultIdentifierResolver.resolveId(tagPath)).toBe(
      resolveId(tagPath),
    );
  });
});

describe('minify モード（class-name-minify）', () => {
  it('options 未指定 → 現行 byte-equivalent（bodyHash 省略経路）', () => {
    const tagPath = 'html>body>div';
    expect(resolveClassName(tagPath)).toBe(
      resolveClassName(tagPath, undefined, undefined, { minify: false }),
    );
  });

  it('resolveClassName(tagPath, minify: true) → /^_[0-9a-f]{8}$/', () => {
    expect(
      resolveClassName('html>body>div', undefined, undefined, {
        minify: true,
      }),
    ).toMatch(/^_[0-9a-f]{8}$/);
  });

  it('resolveClassName(tagPath, bodyHash, varName, minify: true) でも /^_[0-9a-f]{8}$/', () => {
    expect(
      resolveClassName('html>body>div', undefined, 'card', { minify: true }),
    ).toMatch(/^_[0-9a-f]{8}$/);
  });

  it('bodyHash 経路でも minify が反映される（合成ハッシュ）', () => {
    const minified = resolveClassName('html>body>div', 'abc12345', undefined, {
      minify: true,
    });
    expect(minified).toMatch(/^_[0-9a-f]{8}$/);
    // 異なる tagPath / bodyHash で異クラス名
    const other = resolveClassName('html>body>p', 'abc12345', undefined, {
      minify: true,
    });
    expect(minified).not.toBe(other);
  });
});

describe('createIdentifierResolver', () => {
  it('minify: false（既定）→ defaultIdentifierResolver と byte-equivalent', () => {
    const r = createIdentifierResolver();
    const tagPath = 'html>body>div';
    expect(r.resolveClassName(tagPath)).toBe(
      defaultIdentifierResolver.resolveClassName(tagPath),
    );
    expect(r.resolveClassName(tagPath, 'h')).toBe(
      defaultIdentifierResolver.resolveClassName(tagPath, 'h'),
    );
    expect(r.resolveId(tagPath)).toBe(
      defaultIdentifierResolver.resolveId(tagPath),
    );
  });

  it('minify: true → resolveClassName 全シグネチャで `_<8hex>` を返す', () => {
    const r = createIdentifierResolver({ minify: true });
    expect(r.resolveClassName('html>body>div')).toMatch(/^_[0-9a-f]{8}$/);
    expect(r.resolveClassName('html>body>div', undefined, 'card')).toMatch(
      /^_[0-9a-f]{8}$/,
    );
    expect(r.resolveClassName('html>body>div', 'abc12345')).toMatch(
      /^_[0-9a-f]{8}$/,
    );
    expect(r.resolveClassName('html>body>div', 'abc12345', 'card')).toMatch(
      /^_[0-9a-f]{8}$/,
    );
  });

  it('minify: true でも resolveId は `_id_` プレフィックスを保つ', () => {
    const r = createIdentifierResolver({ minify: true });
    expect(r.resolveId('html>body>div').startsWith('_id_')).toBe(true);
  });
});
