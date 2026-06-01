import { describe, it, expect, afterEach } from 'vitest';
import { guardDuplicateCssProperty } from '../../src/utils/dev-guard.js';
import { DuplicateCssPropertyError } from '../../src/utils/errors.js';

describe('guardDuplicateCssProperty', () => {
  const originalEnv = process.env.DRAFT_OLE_DEV;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.DRAFT_OLE_DEV;
    } else {
      process.env.DRAFT_OLE_DEV = originalEnv;
    }
  });

  it('DEV=true かつ既存値ありで DuplicateCssPropertyError をthrow', () => {
    process.env.DRAFT_OLE_DEV = 'true';
    expect(() => guardDuplicateCssProperty('0 auto', 'margin')).toThrow(
      DuplicateCssPropertyError,
    );
  });

  it('throwされたエラーのメッセージにプロパティ名が含まれる', () => {
    process.env.DRAFT_OLE_DEV = 'true';
    expect(() => guardDuplicateCssProperty('10px', 'padding')).toThrow(
      'CSS property "padding" was set twice',
    );
  });

  it('DEV=true かつ未設定（undefined）なら何もしない', () => {
    process.env.DRAFT_OLE_DEV = 'true';
    expect(() => guardDuplicateCssProperty(undefined, 'margin')).not.toThrow();
  });

  it('DEV未設定なら既存値があっても何もしない', () => {
    delete process.env.DRAFT_OLE_DEV;
    expect(() => guardDuplicateCssProperty('0 auto', 'margin')).not.toThrow();
  });

  it('DEV=false なら何もしない', () => {
    process.env.DRAFT_OLE_DEV = 'false';
    expect(() => guardDuplicateCssProperty('0 auto', 'margin')).not.toThrow();
  });
});
