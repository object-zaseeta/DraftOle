import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { devWarn, guardDuplicateCssProperty } from '../../src/utils/dev-guard.js';
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

describe('devWarn', () => {
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
    vi.restoreAllMocks();
  });

  it('NODE_ENV=production なら console.warn を呼び出さない（no-op パス）', () => {
    process.env.NODE_ENV = 'production';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    devWarn('production warning suppressed');

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('NODE_ENV 未設定なら console.warn を呼び出す', () => {
    delete process.env.NODE_ENV;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    devWarn('dev warning emitted');

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith('dev warning emitted');
  });

  it('NODE_ENV=development なら console.warn を呼び出す', () => {
    process.env.NODE_ENV = 'development';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    devWarn('dev mode warning');

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith('dev mode warning');
  });

  it('NODE_ENV=test なら console.warn を呼び出す（非 production 経路）', () => {
    process.env.NODE_ENV = 'test';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    devWarn('test mode warning');

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith('test mode warning');
  });
});
