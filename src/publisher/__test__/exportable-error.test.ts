import { describe, it, expect } from 'vitest';
import { ExportableError } from '../errors/ExportableError.js';

describe('ExportableError', () => {
  describe('DraftOleError 継承', () => {
    it('ExportableError は DraftOleError を継承する', async () => {
      // Arrange
      const { DraftOleError } = await import('../../utils/errors.js');

      // Act
      const error = new ExportableError('invalidPath', '/test/path');

      // Assert
      expect(error).toBeInstanceOf(DraftOleError);
      expect(error).toBeInstanceOf(Error);
    });

    it('module プロパティは "publisher" 固定', () => {
      const error = new ExportableError('writeFailed', '/output/file.html');

      expect(error.module).toBe('publisher');
    });

    it('DraftOleError 型として扱える', async () => {
      const { DraftOleError } = await import('../../utils/errors.js');

      const error = new ExportableError('invalidPath', '/test/path');

      if (error instanceof DraftOleError) {
        expect(error.code).toBe('invalidPath');
        expect(error.module).toBe('publisher');
        expect(error.message).toContain('/test/path');
      }
    });
  });
});
