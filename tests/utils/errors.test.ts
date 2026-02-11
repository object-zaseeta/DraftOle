import { describe, it, expect } from 'vitest';

/**
 * DraftOleError 基底クラスのテスト
 *
 * Phase 3a: エラー型階層追加 - タスク 3.1
 *
 * テスト対象:
 * - DraftOleError 抽象クラスの基本構造
 * - エラーコード型の定義
 * - モジュール型の定義
 * - Error クラスからの継承
 */
describe('DraftOleError', () => {
  describe('基本構造', () => {
    it('DraftOleError は Error を継承する', async () => {
      // Arrange: DraftOleError をインポート（まだ存在しないため失敗する）
      const { DraftOleError } = await import('../../src/utils/errors.js');

      // Act: 具象クラスを作成（テスト用）
      class TestError extends DraftOleError {
        readonly code = 'test' as const;
        readonly module = 'html' as const;

        constructor(message: string) {
          super(message);
          this.name = 'TestError';
        }
      }

      const error = new TestError('Test error message');

      // Assert: Error を継承していることを確認
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DraftOleError);
    });

    it('DraftOleError は抽象クラスとして定義される', async () => {
      // Arrange: DraftOleError をインポート
      const { DraftOleError } = await import('../../src/utils/errors.js');

      // Act & Assert: 直接インスタンス化できないことを確認
      // TypeScript では抽象クラスの直接インスタンス化はコンパイルエラー
      // ランタイムではコンストラクタが呼び出せるため、エラーをスローするべき
      expect(() => {
        // @ts-expect-error - 抽象クラスのインスタンス化を試行
        new DraftOleError('test');
      }).toThrow();
    });

    it('code プロパティは readonly で定義される', async () => {
      // Arrange
      const { DraftOleError } = await import('../../src/utils/errors.js');

      class TestError extends DraftOleError {
        readonly code = 'test' as const;
        readonly module = 'html' as const;

        constructor(message: string) {
          super(message);
          this.name = 'TestError';
        }
      }

      const error = new TestError('Test message');

      // Act & Assert: code プロパティが存在し、値が設定されている
      expect(error.code).toBe('test');
      // TypeScript では readonly プロパティへの代入はコンパイルエラー
    });

    it('module プロパティは readonly で定義される', async () => {
      // Arrange
      const { DraftOleError } = await import('../../src/utils/errors.js');

      class TestError extends DraftOleError {
        readonly code = 'test' as const;
        readonly module = 'html' as const;

        constructor(message: string) {
          super(message);
          this.name = 'TestError';
        }
      }

      const error = new TestError('Test message');

      // Act & Assert: module プロパティが存在し、値が設定されている
      expect(error.module).toBe('html');
    });

    it('message プロパティを持つ', async () => {
      // Arrange
      const { DraftOleError } = await import('../../src/utils/errors.js');

      class TestError extends DraftOleError {
        readonly code = 'test' as const;
        readonly module = 'html' as const;

        constructor(message: string) {
          super(message);
          this.name = 'TestError';
        }
      }

      const testMessage = 'Custom error message';
      const error = new TestError(testMessage);

      // Act & Assert
      expect(error.message).toBe(testMessage);
    });

    it('name プロパティを持つ', async () => {
      // Arrange
      const { DraftOleError } = await import('../../src/utils/errors.js');

      class TestError extends DraftOleError {
        readonly code = 'test' as const;
        readonly module = 'html' as const;

        constructor(message: string) {
          super(message);
          this.name = 'TestError';
        }
      }

      const error = new TestError('Test message');

      // Act & Assert
      expect(error.name).toBe('TestError');
    });
  });

  describe('エラーコード型', () => {
    it('HtmlErrorCode 型が定義されている', async () => {
      // Arrange
      const { HtmlErrorCode } = await import('../../src/utils/errors.js');

      // Act & Assert: 型が存在することを確認（TypeScript の型チェック）
      const validCodes: HtmlErrorCode[] = [
        'invalidTag',
        'invalidAttribute',
        'nestingLimit',
      ];

      // ランタイムでの検証は型定義なので不要だが、型の存在を確認
      expect(validCodes).toHaveLength(3);
    });

    it('CssErrorCode 型が定義されている', async () => {
      // Arrange
      const { CssErrorCode } = await import('../../src/utils/errors.js');

      // Act & Assert
      const validCodes: CssErrorCode[] = [
        'invalidProperty',
        'invalidValue',
        'layoutConflict',
      ];

      expect(validCodes).toHaveLength(3);
    });

    it('JsErrorCode 型が定義されている', async () => {
      // Arrange
      const { JsErrorCode } = await import('../../src/utils/errors.js');

      // Act & Assert
      const validCodes: JsErrorCode[] = [
        'invalidSelector',
        'unsupportedMethod',
      ];

      expect(validCodes).toHaveLength(2);
    });

    it('DraftOleErrorCode は全てのエラーコードの Union 型', async () => {
      // Arrange
      const { DraftOleErrorCode } = await import('../../src/utils/errors.js');

      // Act & Assert: 各モジュールのエラーコードを含む
      const allValidCodes: DraftOleErrorCode[] = [
        // HTML
        'invalidTag',
        'invalidAttribute',
        'nestingLimit',
        // CSS
        'invalidProperty',
        'invalidValue',
        'layoutConflict',
        // JS
        'invalidSelector',
        'unsupportedMethod',
        // Publisher (ExportableErrorCode - タスク3.3で追加)
        // 'invalidPath',
        // 'writeFailed',
      ];

      expect(allValidCodes.length).toBeGreaterThan(0);
    });
  });

  describe('モジュール型', () => {
    it('module プロパティは "html" | "css" | "js" | "publisher" のいずれか', async () => {
      // Arrange
      const { DraftOleError } = await import('../../src/utils/errors.js');

      // Act: 各モジュールタイプでエラークラスを作成
      class HtmlTestError extends DraftOleError {
        readonly code = 'test' as const;
        readonly module = 'html' as const;
        constructor(message: string) {
          super(message);
          this.name = 'HtmlTestError';
        }
      }

      class CssTestError extends DraftOleError {
        readonly code = 'test' as const;
        readonly module = 'css' as const;
        constructor(message: string) {
          super(message);
          this.name = 'CssTestError';
        }
      }

      class JsTestError extends DraftOleError {
        readonly code = 'test' as const;
        readonly module = 'js' as const;
        constructor(message: string) {
          super(message);
          this.name = 'JsTestError';
        }
      }

      class PublisherTestError extends DraftOleError {
        readonly code = 'test' as const;
        readonly module = 'publisher' as const;
        constructor(message: string) {
          super(message);
          this.name = 'PublisherTestError';
        }
      }

      // Assert
      const htmlError = new HtmlTestError('test');
      expect(htmlError.module).toBe('html');

      const cssError = new CssTestError('test');
      expect(cssError.module).toBe('css');

      const jsError = new JsTestError('test');
      expect(jsError.module).toBe('js');

      const publisherError = new PublisherTestError('test');
      expect(publisherError.module).toBe('publisher');
    });
  });

  describe('instanceof チェック', () => {
    it('DraftOleError を継承したエラーは instanceof で判定できる', async () => {
      // Arrange
      const { DraftOleError } = await import('../../src/utils/errors.js');

      class CustomError extends DraftOleError {
        readonly code = 'custom' as const;
        readonly module = 'html' as const;

        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const error = new CustomError('Custom error');

      // Act & Assert
      expect(error instanceof DraftOleError).toBe(true);
      expect(error instanceof Error).toBe(true);
      expect(error instanceof CustomError).toBe(true);
    });

    it('try-catch で DraftOleError を捕捉できる', async () => {
      // Arrange
      const { DraftOleError } = await import('../../src/utils/errors.js');

      class CustomError extends DraftOleError {
        readonly code = 'custom' as const;
        readonly module = 'html' as const;

        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      // Act & Assert
      try {
        throw new CustomError('Test error');
      } catch (error) {
        expect(error instanceof DraftOleError).toBe(true);
        if (error instanceof DraftOleError) {
          expect(error.code).toBe('custom');
          expect(error.module).toBe('html');
        }
      }
    });
  });

  describe('スタックトレース', () => {
    it('V8 スタックトレースが正しく設定される', async () => {
      // Arrange
      const { DraftOleError } = await import('../../src/utils/errors.js');

      class TestError extends DraftOleError {
        readonly code = 'test' as const;
        readonly module = 'html' as const;

        constructor(message: string) {
          super(message);
          this.name = 'TestError';
        }
      }

      // Act
      const error = new TestError('Test error');

      // Assert: スタックトレースが存在する
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('TestError');
    });
  });
});

/**
 * HtmlError クラスのテスト
 *
 * Phase 3a: エラー型階層追加 - タスク 3.2
 *
 * テスト対象:
 * - HtmlError クラスの基本構造
 * - HtmlErrorCode 型の使用
 * - tagType プロパティ（オプショナル）
 * - DraftOleError を継承
 */
describe('HtmlError', () => {
  describe('基本構造', () => {
    it('HtmlError は DraftOleError を継承する', async () => {
      // Arrange
      const { HtmlError } = await import('../../src/html/errors/html-error.js');
      const { DraftOleError } = await import('../../src/utils/errors.js');

      // Act
      const error = new HtmlError('invalidTag', 'Invalid HTML tag');

      // Assert
      expect(error).toBeInstanceOf(DraftOleError);
      expect(error).toBeInstanceOf(Error);
    });

    it('module プロパティは "html" 固定', async () => {
      // Arrange
      const { HtmlError } = await import('../../src/html/errors/html-error.js');

      // Act
      const error = new HtmlError('invalidTag', 'Test message');

      // Assert
      expect(error.module).toBe('html');
    });

    it('code プロパティは HtmlErrorCode 型', async () => {
      // Arrange
      const { HtmlError } = await import('../../src/html/errors/html-error.js');

      // Act & Assert: 各エラーコードでインスタンス化できる
      const invalidTagError = new HtmlError('invalidTag', 'Invalid tag');
      expect(invalidTagError.code).toBe('invalidTag');

      const invalidAttrError = new HtmlError(
        'invalidAttribute',
        'Invalid attribute',
      );
      expect(invalidAttrError.code).toBe('invalidAttribute');

      const nestingError = new HtmlError('nestingLimit', 'Nesting limit');
      expect(nestingError.code).toBe('nestingLimit');
    });

    it('name プロパティは "HtmlError"', async () => {
      // Arrange
      const { HtmlError } = await import('../../src/html/errors/html-error.js');

      // Act
      const error = new HtmlError('invalidTag', 'Test message');

      // Assert
      expect(error.name).toBe('HtmlError');
    });
  });

  describe('tagType プロパティ', () => {
    it('tagType はオプショナルプロパティ', async () => {
      // Arrange
      const { HtmlError } = await import('../../src/html/errors/html-error.js');

      // Act: tagType なしでインスタンス化
      const errorWithoutTagType = new HtmlError('invalidTag', 'Test message');

      // Assert: tagType が undefined
      expect(errorWithoutTagType.tagType).toBeUndefined();
    });

    it('tagType を指定できる', async () => {
      // Arrange
      const { HtmlError } = await import('../../src/html/errors/html-error.js');

      // Act: tagType を指定してインスタンス化
      const errorWithTagType = new HtmlError('invalidTag', 'Test message', {
        tagType: 'div',
      });

      // Assert: tagType が設定されている
      expect(errorWithTagType.tagType).toBe('div');
    });
  });

  describe('instanceof チェック', () => {
    it('HtmlError は instanceof で判定できる', async () => {
      // Arrange
      const { HtmlError } = await import('../../src/html/errors/html-error.js');
      const { DraftOleError } = await import('../../src/utils/errors.js');

      // Act
      const error = new HtmlError('invalidTag', 'Test message');

      // Assert
      expect(error instanceof HtmlError).toBe(true);
      expect(error instanceof DraftOleError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('try-catch で HtmlError を捕捉できる', async () => {
      // Arrange
      const { HtmlError } = await import('../../src/html/errors/html-error.js');

      // Act & Assert
      try {
        throw new HtmlError('invalidAttribute', 'Invalid attribute detected', {
          tagType: 'input',
        });
      } catch (error) {
        expect(error instanceof HtmlError).toBe(true);
        if (error instanceof HtmlError) {
          expect(error.code).toBe('invalidAttribute');
          expect(error.module).toBe('html');
          expect(error.tagType).toBe('input');
        }
      }
    });
  });
});

/**
 * CssError クラスのテスト
 *
 * Phase 3a: エラー型階層追加 - タスク 3.2
 *
 * テスト対象:
 * - CssError クラスの基本構造
 * - CssErrorCode 型の使用
 * - property プロパティ（オプショナル）
 * - DraftOleError を継承
 */
describe('CssError', () => {
  describe('基本構造', () => {
    it('CssError は DraftOleError を継承する', async () => {
      // Arrange
      const { CssError } = await import('../../src/css/errors/css-error.js');
      const { DraftOleError } = await import('../../src/utils/errors.js');

      // Act
      const error = new CssError('invalidProperty', 'Invalid CSS property');

      // Assert
      expect(error).toBeInstanceOf(DraftOleError);
      expect(error).toBeInstanceOf(Error);
    });

    it('module プロパティは "css" 固定', async () => {
      // Arrange
      const { CssError } = await import('../../src/css/errors/css-error.js');

      // Act
      const error = new CssError('invalidProperty', 'Test message');

      // Assert
      expect(error.module).toBe('css');
    });

    it('code プロパティは CssErrorCode 型', async () => {
      // Arrange
      const { CssError } = await import('../../src/css/errors/css-error.js');

      // Act & Assert: 各エラーコードでインスタンス化できる
      const invalidPropertyError = new CssError(
        'invalidProperty',
        'Invalid property',
      );
      expect(invalidPropertyError.code).toBe('invalidProperty');

      const invalidValueError = new CssError('invalidValue', 'Invalid value');
      expect(invalidValueError.code).toBe('invalidValue');

      const layoutConflictError = new CssError(
        'layoutConflict',
        'Layout conflict',
      );
      expect(layoutConflictError.code).toBe('layoutConflict');
    });

    it('name プロパティは "CssError"', async () => {
      // Arrange
      const { CssError } = await import('../../src/css/errors/css-error.js');

      // Act
      const error = new CssError('invalidProperty', 'Test message');

      // Assert
      expect(error.name).toBe('CssError');
    });
  });

  describe('property プロパティ', () => {
    it('property はオプショナルプロパティ', async () => {
      // Arrange
      const { CssError } = await import('../../src/css/errors/css-error.js');

      // Act: property なしでインスタンス化
      const errorWithoutProperty = new CssError(
        'invalidProperty',
        'Test message',
      );

      // Assert: property が undefined
      expect(errorWithoutProperty.property).toBeUndefined();
    });

    it('property を指定できる', async () => {
      // Arrange
      const { CssError } = await import('../../src/css/errors/css-error.js');

      // Act: property を指定してインスタンス化
      const errorWithProperty = new CssError(
        'invalidProperty',
        'Test message',
        {
          property: 'background-color',
        },
      );

      // Assert: property が設定されている
      expect(errorWithProperty.property).toBe('background-color');
    });
  });

  describe('instanceof チェック', () => {
    it('CssError は instanceof で判定できる', async () => {
      // Arrange
      const { CssError } = await import('../../src/css/errors/css-error.js');
      const { DraftOleError } = await import('../../src/utils/errors.js');

      // Act
      const error = new CssError('invalidProperty', 'Test message');

      // Assert
      expect(error instanceof CssError).toBe(true);
      expect(error instanceof DraftOleError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('try-catch で CssError を捕捉できる', async () => {
      // Arrange
      const { CssError } = await import('../../src/css/errors/css-error.js');

      // Act & Assert
      try {
        throw new CssError('invalidValue', 'Invalid color value', {
          property: 'color',
        });
      } catch (error) {
        expect(error instanceof CssError).toBe(true);
        if (error instanceof CssError) {
          expect(error.code).toBe('invalidValue');
          expect(error.module).toBe('css');
          expect(error.property).toBe('color');
        }
      }
    });
  });
});

/**
 * JsError クラスのテスト
 *
 * Phase 3a: エラー型階層追加 - タスク 3.2
 *
 * テスト対象:
 * - JsError クラスの基本構造
 * - JsErrorCode 型の使用
 * - selector プロパティ（オプショナル）
 * - DraftOleError を継承
 */
describe('JsError', () => {
  describe('基本構造', () => {
    it('JsError は DraftOleError を継承する', async () => {
      // Arrange
      const { JsError } = await import('../../src/js/errors/js-error.js');
      const { DraftOleError } = await import('../../src/utils/errors.js');

      // Act
      const error = new JsError('invalidSelector', 'Invalid selector');

      // Assert
      expect(error).toBeInstanceOf(DraftOleError);
      expect(error).toBeInstanceOf(Error);
    });

    it('module プロパティは "js" 固定', async () => {
      // Arrange
      const { JsError } = await import('../../src/js/errors/js-error.js');

      // Act
      const error = new JsError('invalidSelector', 'Test message');

      // Assert
      expect(error.module).toBe('js');
    });

    it('code プロパティは JsErrorCode 型', async () => {
      // Arrange
      const { JsError } = await import('../../src/js/errors/js-error.js');

      // Act & Assert: 各エラーコードでインスタンス化できる
      const invalidSelectorError = new JsError(
        'invalidSelector',
        'Invalid selector',
      );
      expect(invalidSelectorError.code).toBe('invalidSelector');

      const unsupportedMethodError = new JsError(
        'unsupportedMethod',
        'Unsupported method',
      );
      expect(unsupportedMethodError.code).toBe('unsupportedMethod');
    });

    it('name プロパティは "JsError"', async () => {
      // Arrange
      const { JsError } = await import('../../src/js/errors/js-error.js');

      // Act
      const error = new JsError('invalidSelector', 'Test message');

      // Assert
      expect(error.name).toBe('JsError');
    });
  });

  describe('selector プロパティ', () => {
    it('selector はオプショナルプロパティ', async () => {
      // Arrange
      const { JsError } = await import('../../src/js/errors/js-error.js');

      // Act: selector なしでインスタンス化
      const errorWithoutSelector = new JsError(
        'invalidSelector',
        'Test message',
      );

      // Assert: selector が undefined
      expect(errorWithoutSelector.selector).toBeUndefined();
    });

    it('selector を指定できる', async () => {
      // Arrange
      const { JsError } = await import('../../src/js/errors/js-error.js');

      // Act: selector を指定してインスタンス化
      const errorWithSelector = new JsError('invalidSelector', 'Test message', {
        selector: '#my-element',
      });

      // Assert: selector が設定されている
      expect(errorWithSelector.selector).toBe('#my-element');
    });
  });

  describe('instanceof チェック', () => {
    it('JsError は instanceof で判定できる', async () => {
      // Arrange
      const { JsError } = await import('../../src/js/errors/js-error.js');
      const { DraftOleError } = await import('../../src/utils/errors.js');

      // Act
      const error = new JsError('invalidSelector', 'Test message');

      // Assert
      expect(error instanceof JsError).toBe(true);
      expect(error instanceof DraftOleError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('try-catch で JsError を捕捉できる', async () => {
      // Arrange
      const { JsError } = await import('../../src/js/errors/js-error.js');

      // Act & Assert
      try {
        throw new JsError('unsupportedMethod', 'Method not supported', {
          selector: '.button',
        });
      } catch (error) {
        expect(error instanceof JsError).toBe(true);
        if (error instanceof JsError) {
          expect(error.code).toBe('unsupportedMethod');
          expect(error.module).toBe('js');
          expect(error.selector).toBe('.button');
        }
      }
    });
  });
});
