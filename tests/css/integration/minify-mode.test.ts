/**
 * class-name-minify 統合テスト
 *
 * `CssConfig.minifyClassNames` と `createIdentifierResolver` の合成経路を検証する。
 *
 * Requirements: 1.2, 1.3, 2.1, 2.2, 2.3, 5.1
 */
import { afterEach, describe, expect, it } from 'vitest';
import { CssConfig } from '../../../src/css/config/css-config.js';
import {
  createIdentifierResolver,
  defaultIdentifierResolver,
} from '../../../src/css/utils/identifier-resolver.js';

describe('class-name-minify 統合', () => {
  const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  });

  it('明示 minifyClassNames: true → IdentifierResolver が `_<8hex>` 形式を返す', () => {
    delete process.env.NODE_ENV;
    const cfg = new CssConfig({ minifyClassNames: true });
    const resolver = createIdentifierResolver({ minify: cfg.minifyClassNames });
    expect(resolver.resolveClassName('html>body>div')).toMatch(/^_[0-9a-f]{8}$/);
    expect(
      resolver.resolveClassName('html>body>div', undefined, 'card'),
    ).toMatch(/^_[0-9a-f]{8}$/);
    expect(resolver.resolveClassName('html>body>div', 'abc12345')).toMatch(
      /^_[0-9a-f]{8}$/,
    );
  });

  it('NODE_ENV=production + デフォルトコンストラクタ → minify ON 同等', () => {
    process.env.NODE_ENV = 'production';
    const cfg = new CssConfig();
    expect(cfg.minifyClassNames).toBe(true);
    const resolver = createIdentifierResolver({ minify: cfg.minifyClassNames });
    expect(resolver.resolveClassName('html>body>div')).toMatch(/^_[0-9a-f]{8}$/);
  });

  it('NODE_ENV=development + デフォルト → debuggable 形式を維持（既存と byte-equivalent）', () => {
    process.env.NODE_ENV = 'development';
    const cfg = new CssConfig();
    expect(cfg.minifyClassNames).toBe(false);
    const resolver = createIdentifierResolver({ minify: cfg.minifyClassNames });
    const tagPath = 'html>body>div';
    expect(resolver.resolveClassName(tagPath)).toBe(
      defaultIdentifierResolver.resolveClassName(tagPath),
    );
  });
});
