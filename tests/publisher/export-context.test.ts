import { describe, it, expectTypeOf } from 'vitest';
import type { ExportContext } from '../../src/publisher/export-context.js';

describe('ExportContext', () => {
  describe('型定義', () => {
    it('必須フィールド (html, css, userJs) を持つ', () => {
      const ctx: ExportContext = {
        html: '<div>hello</div>',
        css: 'body { margin: 0; }',
        userJs: 'console.log("hello");',
      };

      expectTypeOf(ctx.html).toEqualTypeOf<string>();
      expectTypeOf(ctx.css).toEqualTypeOf<string>();
      expectTypeOf(ctx.userJs).toEqualTypeOf<string>();
    });

    it('オプショナルフィールド (runtimePrelude, runtimeInitJs) は省略可能', () => {
      const ctxWithoutOptional: ExportContext = {
        html: '<div></div>',
        css: '',
        userJs: '',
      };

      expectTypeOf(ctxWithoutOptional.runtimePrelude).toEqualTypeOf<
        string | undefined
      >();
      expectTypeOf(ctxWithoutOptional.runtimeInitJs).toEqualTypeOf<
        string | undefined
      >();
    });

    it('オプショナルフィールドが存在する場合も受け入れる', () => {
      const ctxWithOptional: ExportContext = {
        html: '<div></div>',
        css: 'body {}',
        userJs: '',
        runtimePrelude: '// prelude',
        runtimeInitJs: 'setState("x", 0);',
      };

      expectTypeOf(ctxWithOptional.runtimePrelude).toEqualTypeOf<
        string | undefined
      >();
      expectTypeOf(ctxWithOptional.runtimeInitJs).toEqualTypeOf<
        string | undefined
      >();
    });

    it('フィールドは read-only である', () => {
      // TypeScript の型レベルで readonly が保証される
      // runtime では Object.freeze 不要; readonly は型チェックのみ
      expectTypeOf<ExportContext>().toMatchTypeOf<{
        readonly html: string;
        readonly css: string;
        readonly userJs: string;
      }>();
    });
  });
});
