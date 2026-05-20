/**
 * Task 1.4: CssConfig のテスト
 *
 * TDD RED phase: CSS出力設定モデルの振る舞いを検証する。
 * - デフォルト値の検証
 * - コンストラクタオプションの検証
 * - 設定変更の反映
 * - 引数なしコンストラクタ
 */
import { describe, it, expect, afterEach } from 'vitest';
import { CssConfig } from '../../../src/css/config/css-config.js';
import type { CssConfigOptions } from '../../../src/css/config/css-config.js';

describe('CssConfig', () => {
  // ── ファクトリ ──

  function makeSUT(options?: Partial<CssConfigOptions>): CssConfig {
    return new CssConfig(options);
  }

  // ── デフォルト値の検証 ──

  describe('デフォルト値', () => {
    it('scopedCssEnabled がデフォルトで true である', () => {
      const sut = makeSUT();
      expect(sut.scopedCssEnabled).toBe(true);
    });

    it('outputMode がデフォルトで "inline" である', () => {
      const sut = makeSUT();
      expect(sut.outputMode).toBe('inline');
    });
  });

  // ── 引数なしコンストラクタ ──

  describe('引数なしコンストラクタ', () => {
    it('引数なしでインスタンスを生成できる', () => {
      const sut = new CssConfig();
      expect(sut).toBeInstanceOf(CssConfig);
    });

    it('引数なしでデフォルト値が設定される', () => {
      const sut = new CssConfig();
      expect(sut.scopedCssEnabled).toBe(true);
      expect(sut.outputMode).toBe('inline');
    });
  });

  // ── コンストラクタオプション ──

  describe('コンストラクタオプション', () => {
    it('scopedCssEnabled: false を設定できる', () => {
      const sut = makeSUT({ scopedCssEnabled: false });
      expect(sut.scopedCssEnabled).toBe(false);
    });

    it('outputMode: "external" を設定できる', () => {
      const sut = makeSUT({ outputMode: 'external' });
      expect(sut.outputMode).toBe('external');
    });

    it('scopedCssEnabled のみ指定した場合、outputMode はデフォルト値', () => {
      const sut = makeSUT({ scopedCssEnabled: false });
      expect(sut.scopedCssEnabled).toBe(false);
      expect(sut.outputMode).toBe('inline');
    });

    it('outputMode のみ指定した場合、scopedCssEnabled はデフォルト値', () => {
      const sut = makeSUT({ outputMode: 'external' });
      expect(sut.scopedCssEnabled).toBe(true);
      expect(sut.outputMode).toBe('external');
    });

    it('全オプションを指定できる', () => {
      const sut = makeSUT({ scopedCssEnabled: false, outputMode: 'external' });
      expect(sut.scopedCssEnabled).toBe(false);
      expect(sut.outputMode).toBe('external');
    });

    it('undefined を渡した場合、デフォルト値が使用される', () => {
      const sut = makeSUT(undefined);
      expect(sut.scopedCssEnabled).toBe(true);
      expect(sut.outputMode).toBe('inline');
    });
  });

  // ── 設定変更の反映 ──

  describe('設定変更の反映', () => {
    it('scopedCssEnabled を変更して反映される', () => {
      const sut = makeSUT();
      expect(sut.scopedCssEnabled).toBe(true);

      sut.scopedCssEnabled = false;
      expect(sut.scopedCssEnabled).toBe(false);
    });

    it('outputMode を変更して反映される', () => {
      const sut = makeSUT();
      expect(sut.outputMode).toBe('inline');

      sut.outputMode = 'external';
      expect(sut.outputMode).toBe('external');
    });

    it('scopedCssEnabled を false から true に戻せる', () => {
      const sut = makeSUT({ scopedCssEnabled: false });
      expect(sut.scopedCssEnabled).toBe(false);

      sut.scopedCssEnabled = true;
      expect(sut.scopedCssEnabled).toBe(true);
    });

    it('outputMode を external から inline に戻せる', () => {
      const sut = makeSUT({ outputMode: 'external' });
      expect(sut.outputMode).toBe('external');

      sut.outputMode = 'inline';
      expect(sut.outputMode).toBe('inline');
    });
  });

  // ── minifyClassNames ──

  describe('minifyClassNames', () => {
    const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
    afterEach(() => {
      process.env.NODE_ENV = ORIGINAL_NODE_ENV;
    });

    it('明示 true を指定すると minifyClassNames === true', () => {
      delete process.env.NODE_ENV;
      const sut = makeSUT({ minifyClassNames: true });
      expect(sut.minifyClassNames).toBe(true);
    });

    it('明示 false を指定すると minifyClassNames === false', () => {
      process.env.NODE_ENV = 'production';
      const sut = makeSUT({ minifyClassNames: false });
      expect(sut.minifyClassNames).toBe(false);
    });

    it('未指定 + NODE_ENV=production → true', () => {
      process.env.NODE_ENV = 'production';
      const sut = makeSUT();
      expect(sut.minifyClassNames).toBe(true);
    });

    it('未指定 + NODE_ENV=development → false', () => {
      process.env.NODE_ENV = 'development';
      const sut = makeSUT();
      expect(sut.minifyClassNames).toBe(false);
    });

    it('未指定 + NODE_ENV 未定義 → false', () => {
      delete process.env.NODE_ENV;
      const sut = makeSUT();
      expect(sut.minifyClassNames).toBe(false);
    });

    it('デフォルトでは false（NODE_ENV !== production）', () => {
      process.env.NODE_ENV = 'test';
      const sut = makeSUT();
      expect(sut.minifyClassNames).toBe(false);
    });
  });

  // ── CssConfigOptions 型の検証 ──

  describe('CssConfigOptions 型', () => {
    it('完全なオプションオブジェクトを受け取れる', () => {
      const options: CssConfigOptions = {
        scopedCssEnabled: false,
        outputMode: 'external',
      };
      const sut = new CssConfig(options);
      expect(sut.scopedCssEnabled).toBe(false);
      expect(sut.outputMode).toBe('external');
    });
  });
});
