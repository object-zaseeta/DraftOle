import { afterEach, describe, expect, it } from 'vitest';
import {
  ExportableError,
  type ExportableErrorCode,
} from '../../src/publisher/exportable-error.js';

describe('ExportableError', () => {
  describe('invalidPath エラー', () => {
    it('エラーコードとファイルパスを保持する', () => {
      const error = new ExportableError('invalidPath', '/invalid/path');

      expect(error.code).toBe('invalidPath');
      expect(error.filePath).toBe('/invalid/path');
      expect(error.name).toBe('ExportableError');
      expect(error instanceof Error).toBe(true);
    });

    it('デフォルトのエラーメッセージを生成する', () => {
      const error = new ExportableError('invalidPath', '/invalid/path');

      expect(error.message).toContain('/invalid/path');
      expect(error.message).toContain('invalidPath');
    });

    it('カスタムエラーメッセージを設定できる', () => {
      const error = new ExportableError(
        'invalidPath',
        '/test/path',
        'Custom error message',
      );

      expect(error.message).toBe('Custom error message');
      expect(error.code).toBe('invalidPath');
      expect(error.filePath).toBe('/test/path');
    });
  });

  describe('writeFailed エラー', () => {
    it('エラーコードとファイルパスを保持する', () => {
      const error = new ExportableError('writeFailed', '/output/file.html');

      expect(error.code).toBe('writeFailed');
      expect(error.filePath).toBe('/output/file.html');
      expect(error.name).toBe('ExportableError');
    });

    it('デフォルトのエラーメッセージを生成する', () => {
      const error = new ExportableError('writeFailed', '/output/file.html');

      expect(error.message).toContain('/output/file.html');
      expect(error.message).toContain('writeFailed');
    });

    it('カスタムエラーメッセージを設定できる', () => {
      const error = new ExportableError(
        'writeFailed',
        '/output/file.html',
        'Disk full: Cannot write to file',
      );

      expect(error.message).toBe('Disk full: Cannot write to file');
      expect(error.code).toBe('writeFailed');
    });
  });

  describe('Error 継承', () => {
    it('Error クラスを継承している', () => {
      const error = new ExportableError('invalidPath', '/path');

      expect(error instanceof Error).toBe(true);
      expect(error instanceof ExportableError).toBe(true);
    });

    it('スタックトレースを持つ', () => {
      const error = new ExportableError('writeFailed', '/path');

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });

    it('try-catch でキャッチできる', () => {
      const throwError = () => {
        throw new ExportableError('invalidPath', '/path');
      };

      expect(throwError).toThrow(ExportableError);
      expect(throwError).toThrow('invalidPath');
    });
  });

  describe('型安全性', () => {
    it('有効なエラーコードを受け入れる', () => {
      const codes: ExportableErrorCode[] = ['invalidPath', 'writeFailed'];

      codes.forEach(code => {
        const error = new ExportableError(code, '/path');
        expect(error.code).toBe(code);
      });
    });

    // TypeScriptの型チェックでコンパイルエラーになる
    // it('無効なエラーコードはコンパイルエラー', () => {
    //   const error = new ExportableError('invalidCode', '/path'); // コンパイルエラー
    // });
  });

  describe('DraftOleError 継承（タスク3.3）', () => {
    it('ExportableError は DraftOleError を継承する', async () => {
      // Arrange
      const { DraftOleError } = await import('../../src/utils/errors.js');

      // Act
      const error = new ExportableError('invalidPath', '/test/path');

      // Assert
      expect(error).toBeInstanceOf(DraftOleError);
      expect(error).toBeInstanceOf(Error);
    });

    it('module プロパティは "publisher" 固定', () => {
      // Act
      const error = new ExportableError('writeFailed', '/output/file.html');

      // Assert
      expect(error.module).toBe('publisher');
    });

    it('DraftOleError 型として扱える', async () => {
      // Arrange
      const { DraftOleError } = await import('../../src/utils/errors.js');

      // Act
      const error = new ExportableError('invalidPath', '/test/path');

      // Assert: DraftOleError として型チェックできる
      if (error instanceof DraftOleError) {
        expect(error.code).toBe('invalidPath');
        expect(error.module).toBe('publisher');
        expect(error.message).toContain('/test/path');
      }
    });

    it('try-catch で DraftOleError として捕捉できる', async () => {
      // Arrange
      const { DraftOleError } = await import('../../src/utils/errors.js');

      // Act & Assert
      try {
        throw new ExportableError('writeFailed', '/output/file.html');
      } catch (error) {
        expect(error instanceof DraftOleError).toBe(true);
        expect(error instanceof ExportableError).toBe(true);
        if (error instanceof ExportableError) {
          expect(error.code).toBe('writeFailed');
          expect(error.module).toBe('publisher');
          expect(error.filePath).toBe('/output/file.html');
        }
      }
    });
  });

  describe('エラーメッセージの可読性（タスク3.3）', () => {
    it('デフォルトメッセージにエラーコードが含まれる', () => {
      // Act
      const error = new ExportableError('invalidPath', '/test/path');

      // Assert
      expect(error.message).toContain('invalidPath');
    });

    it('デフォルトメッセージにファイルパスが含まれる', () => {
      // Act
      const error = new ExportableError('writeFailed', '/output/file.html');

      // Assert
      expect(error.message).toContain('/output/file.html');
    });

    it('エラーメッセージが可読性高く構造化されている', () => {
      // Act
      const error = new ExportableError('invalidPath', '/invalid/path');

      // Assert: エラーメッセージに必要な情報が含まれている
      expect(error.message).toBeTruthy();
      expect(error.message.length).toBeGreaterThan(0);
      // code と filePath が含まれることを確認済み（上記テストで保証）
    });

    it('カスタムメッセージでも code と filePath にアクセス可能', () => {
      // Act
      const error = new ExportableError(
        'writeFailed',
        '/output/file.html',
        'Custom error: Disk full',
      );

      // Assert: カスタムメッセージを使用していても、code と filePath は保持される
      expect(error.message).toBe('Custom error: Disk full');
      expect(error.code).toBe('writeFailed');
      expect(error.filePath).toBe('/output/file.html');
      expect(error.module).toBe('publisher');
    });

    it('エラー情報が構造化されており、プログラマティックに取得可能', () => {
      // Act
      const error = new ExportableError('invalidPath', '/test/path');

      // Assert: エラー情報が構造化されたプロパティとして取得可能
      const errorInfo = {
        name: error.name,
        code: error.code,
        module: error.module,
        filePath: error.filePath,
        message: error.message,
      };

      expect(errorInfo.name).toBe('ExportableError');
      expect(errorInfo.code).toBe('invalidPath');
      expect(errorInfo.module).toBe('publisher');
      expect(errorInfo.filePath).toBe('/test/path');
      expect(errorInfo.message).toBeTruthy();
    });
  });

  describe('Error.captureStackTrace 不在 fallback (Req 5.3)', () => {
    // 前 spec task 2.1 (errors.ts) の precedent を流用:
    // Object.defineProperty で Error.captureStackTrace を undefined に差し替え、
    // afterEach で元の値に復元することで、テスト間の独立性を保証する。
    const originalCaptureStackTrace = Error.captureStackTrace;

    afterEach(() => {
      Object.defineProperty(Error, 'captureStackTrace', {
        value: originalCaptureStackTrace,
        configurable: true,
        writable: true,
      });
    });

    it('Error.captureStackTrace が定義されている環境では ExportableError を構築できる（baseline）', () => {
      // Arrange: captureStackTrace は元のまま（function）
      expect(typeof Error.captureStackTrace).toBe('function');

      // Act
      const error = new ExportableError('invalidPath', '/baseline/path');

      // Assert: 通常通り構築できる
      expect(error).toBeInstanceOf(ExportableError);
      expect(error.code).toBe('invalidPath');
      expect(error.filePath).toBe('/baseline/path');
      expect(error.stack).toBeDefined();
    });

    it('Error.captureStackTrace が undefined でも ExportableError は例外を投げずに構築できる', () => {
      // Arrange: captureStackTrace を undefined に差し替え（非 Node.js 環境を模擬）
      Object.defineProperty(Error, 'captureStackTrace', {
        value: undefined,
        configurable: true,
        writable: true,
      });
      expect(Error.captureStackTrace).toBeUndefined();

      // Act & Assert: captureStackTrace 不在でも throw しない
      expect(
        () => new ExportableError('invalidPath', '/fallback/path'),
      ).not.toThrow();

      const error = new ExportableError(
        'writeFailed',
        '/fallback/path',
        'fallback message',
      );
      expect(error).toBeInstanceOf(ExportableError);
      expect(error.code).toBe('writeFailed');
      expect(error.filePath).toBe('/fallback/path');
      expect(error.module).toBe('publisher');
      expect(error.message).toBe('fallback message');
    });

    it('teardown 後は Error.captureStackTrace が復元されている', () => {
      // afterEach の復元が機能していることを最後に確認
      expect(Error.captureStackTrace).toBe(originalCaptureStackTrace);
    });
  });
});
