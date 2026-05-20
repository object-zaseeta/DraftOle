/**
 * Task 1.2: resolveMinifyMode の単体テスト
 *
 * 純関数 `resolveMinifyMode(option, nodeEnv)` の解決ルールを検証する。
 * Requirements: 2.1, 2.2, 2.3, 5.2
 */
import { describe, it, expect } from 'vitest';
import { resolveMinifyMode } from '../../../src/css/config/resolve-minify-mode.js';

describe('resolveMinifyMode', () => {
  it('option === true → true（明示有効化、nodeEnv は無視）', () => {
    expect(resolveMinifyMode(true, undefined)).toBe(true);
    expect(resolveMinifyMode(true, 'development')).toBe(true);
    expect(resolveMinifyMode(true, 'production')).toBe(true);
  });

  it('option === false → false（明示無効化、nodeEnv は無視）', () => {
    expect(resolveMinifyMode(false, undefined)).toBe(false);
    expect(resolveMinifyMode(false, 'development')).toBe(false);
  });

  it('option === undefined かつ nodeEnv === "production" → true', () => {
    expect(resolveMinifyMode(undefined, 'production')).toBe(true);
  });

  it('option === undefined かつ nodeEnv === "development" → false', () => {
    expect(resolveMinifyMode(undefined, 'development')).toBe(false);
  });

  it('option === undefined かつ nodeEnv === undefined → false', () => {
    expect(resolveMinifyMode(undefined, undefined)).toBe(false);
  });

  it('option === false が nodeEnv === "production" を override する（明示優先）', () => {
    expect(resolveMinifyMode(false, 'production')).toBe(false);
  });
});
