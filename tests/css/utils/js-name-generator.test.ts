/**
 * JsNameGeneratorTests (Task 6.1 — global-branch-90-percent)
 *
 * 対象モジュール: `src/css/utils/scoped-css-generator.ts`
 *   - spec 上では "js-name-generator.ts" と呼称されているが、実装ファイル名は
 *     `scoped-css-generator.ts`（djb2 ベースの JS スタイル CSS クラス名生成）。
 *   - 既存テスト `tests/css/utils/scoped-css-generator.test.ts` は変更しない。
 *     本ファイルは未到達分岐（minify × bodyHash × varName matrix の周縁）を
 *     追加カバーするための補足テストである。
 *
 * カバー対象の未到達分岐（事前計測時点）:
 *   - L168-171: `sanitizeVarNameForClass` の 24 文字切り詰め経路
 *   - L219-221: `generateScopedClassNameWithVarName` で sanitize 後空 → 委譲
 *   - L227-229: `generateScopedClassNameWithVarName` の prefix 空時の `_${var}__${hash}`
 *   - L273-275: `generateScopedClassNameWithVarNameAndHash` の minify true 経路
 *   - L278-280: `generateScopedClassNameWithVarNameAndHash` の空 varName 縮退
 *   - L282-287: 同 — sanitize 後空 varName 縮退 + prefix 空時の分岐
 *
 * Requirements: 4.1
 *
 * Boundary: JsNameGeneratorTests
 *   - 既存 tests/src の編集は行わない
 *   - tests/css/utils/js-name-generator.test.ts のみが本タスクの成果物
 */

import { describe, expect, it } from 'vitest';
import {
  djb2Hash,
  generateScopedClassName,
  generateScopedClassNameWithVarName,
  generateScopedClassNameWithVarNameAndHash,
} from '../../../src/css/utils/scoped-css-generator';

// ============================================================
// sanitizeVarNameForClass の 24 文字切り詰め経路（L168-171）
// （内部関数のため `generateScopedClassNameWithVarName` 越しに観測）
// ============================================================

describe('sanitizeVarNameForClass: 24 文字切り詰め経路（L168-171）', () => {
  it('varName が 24 文字を超える場合、フラグメントは先頭 24 文字に切り詰められる', () => {
    // 全 30 文字 — 先頭 24 文字までが残る想定
    const longVarName = 'abcdefghijklmnopqrstuvwxyzABCD'; // lower-case 化後 30 文字
    const result = generateScopedClassNameWithVarName('html>body>div', longVarName);
    // sanitize 後の varName 部 = 'abcdefghijklmnopqrstuvwx'（24 文字）
    expect(result).toContain('_abcdefghijklmnopqrstuvwx__');
    expect(result).toMatch(/^_[a-z0-9-]+_[a-z0-9-]{1,24}__[0-9a-f]{8}$/);
  });

  it('切り詰め後に末尾が `-` で終わる場合、末尾 `-` は除去される', () => {
    // 24 文字目が `-` になる入力: 23 文字の有効部 + `-` + 余剰
    // 'a'.repeat(23) + '-' + 'xxxxx' → sanitize 後 24 文字目が '-' → 除去で 23 文字
    const varName = `${'a'.repeat(23)}-xxxxx`;
    const result = generateScopedClassNameWithVarName('html>body>div', varName);
    // varName フラグメントは '-' で終わらない
    expect(result).not.toMatch(/-_[0-9a-f]{8}$/);
    // 切り詰め後 23 文字の 'a' が含まれる
    expect(result).toContain('_aaaaaaaaaaaaaaaaaaaaaaa__');
  });

  it('24 文字ちょうどの varName は切り詰められない', () => {
    const varName = 'a'.repeat(24);
    const result = generateScopedClassNameWithVarName('html>body>div', varName);
    expect(result).toContain(`_${varName}__`);
  });
});

// ============================================================
// generateScopedClassNameWithVarName: sanitize 後空 varName の委譲（L219-221）
// ============================================================

describe('generateScopedClassNameWithVarName: sanitize 後空 varName 委譲（L219-221）', () => {
  it('varName が無効文字のみで sanitize 後空になると generateScopedClassName に委譲される', () => {
    // '___' は trim 後非空だが sanitize で全て `-` に置換 → 連続 `-` 畳み → 端除去で空文字
    const tagPath = 'html>body>div';
    const result = generateScopedClassNameWithVarName(tagPath, '___');
    expect(result).toBe(generateScopedClassName(tagPath));
  });

  it('varName が記号のみでも委譲される（@#$ など）', () => {
    const tagPath = 'html>body>div';
    const result = generateScopedClassNameWithVarName(tagPath, '@#$');
    expect(result).toBe(generateScopedClassName(tagPath));
  });

  it('sanitize 後空 委譲は minify オプションも伝搬する', () => {
    const tagPath = 'html>body>div';
    const result = generateScopedClassNameWithVarName(tagPath, '___', {
      minify: true,
    });
    expect(result).toBe(generateScopedClassName(tagPath, { minify: true }));
    expect(result).toMatch(/^_[0-9a-f]{8}$/);
  });
});

// ============================================================
// generateScopedClassNameWithVarName: prefix 空時の出力形式（L227-229）
// ============================================================

describe('generateScopedClassNameWithVarName: prefix 空時の出力（L227-229）', () => {
  it('tagPath が無効文字のみで prefix 空になる場合、`_<sanitizedVar>__<hash>` 形式を返す', () => {
    // '>>>' のような無効文字のみの tagPath → prefix 正規化で空文字に縮退
    const result = generateScopedClassNameWithVarName('>>>', 'card');
    expect(result).toMatch(/^_card__[0-9a-f]{8}$/);
    // prefix 部のアンダースコア区切りが存在しない（`_card__hash` であって `_prefix_card__hash` ではない）
    const expectedHash = djb2Hash('>>>|card');
    expect(result).toBe(`_card__${expectedHash}`);
  });

  it('空文字 tagPath + varName でも `_<sanitizedVar>__<hash>` 形式', () => {
    const result = generateScopedClassNameWithVarName('', 'btn');
    expect(result).toBe(`_btn__${djb2Hash('|btn')}`);
  });

  it('prefix 空 + varName の minify true → `_<hash>` 縮退', () => {
    const result = generateScopedClassNameWithVarName('>>>', 'card', {
      minify: true,
    });
    expect(result).toMatch(/^_[0-9a-f]{8}$/);
    expect(result).toBe(`_${djb2Hash('>>>|card')}`);
  });
});

// ============================================================
// generateScopedClassNameWithVarNameAndHash: minify 経路（L273-275）
// ============================================================

describe('generateScopedClassNameWithVarNameAndHash: minify 経路（L273-275）', () => {
  it('minify true → `_<bodyHash>` のみを返す（prefix / varName は無視）', () => {
    const result = generateScopedClassNameWithVarNameAndHash(
      'html>body>div',
      'card',
      'deadbeef',
      { minify: true },
    );
    expect(result).toBe('_deadbeef');
  });

  it('minify true は varName 空でも bodyHash のみを返す', () => {
    const result = generateScopedClassNameWithVarNameAndHash(
      'html>body>div',
      '',
      'cafebabe',
      { minify: true },
    );
    expect(result).toBe('_cafebabe');
  });

  it('minify true は tagPath が空でも bodyHash のみを返す', () => {
    const result = generateScopedClassNameWithVarNameAndHash('', 'x', 'abc12345', {
      minify: true,
    });
    expect(result).toBe('_abc12345');
  });
});

// ============================================================
// generateScopedClassNameWithVarNameAndHash: 空 varName 縮退（L278-280）
// ============================================================

describe('generateScopedClassNameWithVarNameAndHash: 空 varName 縮退（L278-280）', () => {
  it('varName が空文字 + prefix 非空 → `_<prefix>__<bodyHash>` 形式', () => {
    const result = generateScopedClassNameWithVarNameAndHash(
      'html>body>div',
      '',
      'abc12345',
    );
    expect(result).toBe('_html-body-div__abc12345');
  });

  it('varName が空白のみ（trim 後空）+ prefix 非空 → bodyHash 経路に縮退', () => {
    const result = generateScopedClassNameWithVarNameAndHash(
      'html>body>div',
      '   ',
      'abc12345',
    );
    expect(result).toBe('_html-body-div__abc12345');
  });

  it('varName 空 + prefix 空（無効文字のみ tagPath） → `_<bodyHash>` 形式', () => {
    // tagPath '>>>' は sanitize 後空 prefix
    const result = generateScopedClassNameWithVarNameAndHash(
      '>>>',
      '',
      'abc12345',
    );
    expect(result).toBe('_abc12345');
  });

  it('varName 空 + 空文字 tagPath → `_<bodyHash>` 形式', () => {
    const result = generateScopedClassNameWithVarNameAndHash(
      '',
      '',
      'feedface',
    );
    expect(result).toBe('_feedface');
  });
});

// ============================================================
// generateScopedClassNameWithVarNameAndHash: sanitize 後空 varName 縮退（L282-284）
// ============================================================

describe('generateScopedClassNameWithVarNameAndHash: sanitize 後空 varName 縮退（L282-284）', () => {
  it('varName が無効文字のみで sanitize 後空 + prefix 非空 → bodyHash 経路', () => {
    const result = generateScopedClassNameWithVarNameAndHash(
      'html>body>div',
      '___',
      'abc12345',
    );
    expect(result).toBe('_html-body-div__abc12345');
  });

  it('varName が記号のみで sanitize 後空 + prefix 空 → `_<bodyHash>`', () => {
    const result = generateScopedClassNameWithVarNameAndHash(
      '>>>',
      '@@@',
      'abc12345',
    );
    expect(result).toBe('_abc12345');
  });

  it('varName が記号のみで sanitize 後空 + 空文字 tagPath → `_<bodyHash>`', () => {
    const result = generateScopedClassNameWithVarNameAndHash(
      '',
      '!!!',
      'cafefade',
    );
    expect(result).toBe('_cafefade');
  });
});

// ============================================================
// generateScopedClassNameWithVarNameAndHash: 通常経路 + prefix 空時の分岐（L285-287）
// ============================================================

describe('generateScopedClassNameWithVarNameAndHash: prefix 空時の通常経路（L285-287）', () => {
  it('prefix 空 + 有効 varName + bodyHash → `_<sanitizedVar>__<bodyHash>` 形式', () => {
    // tagPath '>>>' → prefix 空 / varName 'card' → sanitize 済み 'card' / bodyHash 'abc12345'
    const result = generateScopedClassNameWithVarNameAndHash(
      '>>>',
      'card',
      'abc12345',
    );
    expect(result).toBe('_card__abc12345');
  });

  it('prefix 非空 + 有効 varName + bodyHash → `_<prefix>_<sanitizedVar>__<bodyHash>`', () => {
    const result = generateScopedClassNameWithVarNameAndHash(
      'html>body>div',
      'card',
      'abc12345',
    );
    expect(result).toBe('_html-body-div_card__abc12345');
  });

  it('prefix 空 + varName 大文字 → 小文字化フラグメントを使用', () => {
    const result = generateScopedClassNameWithVarNameAndHash(
      '>>>',
      'BtnPrimary',
      'feedface',
    );
    expect(result).toBe('_btnprimary__feedface');
  });
});

// ============================================================
// 統合: minify × bodyHash × varName matrix 残余セル
// ============================================================

describe('minify × bodyHash × varName matrix 補完', () => {
  it('generateScopedClassNameWithVarName: minify true + 通常 varName → `_<hash>`', () => {
    // L223 を確実に通る経路（既存テストの補完）
    const result = generateScopedClassNameWithVarName('html>body>div', 'card', {
      minify: true,
    });
    expect(result).toMatch(/^_[0-9a-f]{8}$/);
    expect(result).toBe(`_${djb2Hash('html>body>div|card')}`);
  });

  it('generateScopedClassNameWithVarName: 空 varName + minify true → 委譲時も `_<hash>`', () => {
    const result = generateScopedClassNameWithVarName('html>body>div', '', {
      minify: true,
    });
    expect(result).toBe(generateScopedClassName('html>body>div', { minify: true }));
  });

  it('generateScopedClassNameWithVarNameAndHash: 全引数の決定性', () => {
    const a = generateScopedClassNameWithVarNameAndHash(
      'html>body>div',
      'card',
      'abc12345',
    );
    const b = generateScopedClassNameWithVarNameAndHash(
      'html>body>div',
      'card',
      'abc12345',
    );
    expect(a).toBe(b);
  });

  it('generateScopedClassNameWithVarNameAndHash: bodyHash が違えば別出力', () => {
    const a = generateScopedClassNameWithVarNameAndHash(
      'html>body>div',
      'card',
      'abc12345',
    );
    const b = generateScopedClassNameWithVarNameAndHash(
      'html>body>div',
      'card',
      'def67890',
    );
    expect(a).not.toBe(b);
  });
});
