/**
 * Task 1.2: createDefaultRenderContext の単体テスト
 *
 * `createDefaultRenderContext(options?)` が cssConfig.minifyClassNames に応じて
 * minify-aware resolver を構築することを検証する。
 *
 * Requirements: 3.1, 3.2, 3.3, 7.1
 */
import { afterEach, describe, expect, it } from 'vitest';
import { createDefaultRenderContext } from '../../../src/html/elements/render-context.js';
import { CssConfig } from '../../../src/css/config/css-config.js';
import { defaultIdentifierResolver } from '../../../src/css/utils/identifier-resolver.js';

describe('createDefaultRenderContext', () => {
  const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  });

  it('引数省略 → resolver === defaultIdentifierResolver（既存挙動）', () => {
    const ctx = createDefaultRenderContext();
    expect(ctx.resolver).toBe(defaultIdentifierResolver);
  });

  it('cssConfig: new CssConfig()（NODE_ENV=development）→ resolver class 名が default と byte-equivalent', () => {
    process.env.NODE_ENV = 'development';
    const ctx = createDefaultRenderContext({ cssConfig: new CssConfig() });
    // minifyClassNames=false なので default resolver と同じ出力
    const tagPath = 'html>body>div';
    expect(ctx.resolver.resolveClassName(tagPath)).toBe(
      defaultIdentifierResolver.resolveClassName(tagPath),
    );
  });

  it('cssConfig: new CssConfig({ minifyClassNames: true }) → resolver class 名が `/^_[0-9a-f]{8}$/`', () => {
    const ctx = createDefaultRenderContext({
      cssConfig: new CssConfig({ minifyClassNames: true }),
    });
    expect(ctx.resolver.resolveClassName('html>body>div')).toMatch(
      /^_[0-9a-f]{8}$/,
    );
  });

  it('registry は毎回新規インスタンス', () => {
    const a = createDefaultRenderContext();
    const b = createDefaultRenderContext();
    expect(a.registry).not.toBe(b.registry);
  });
});
