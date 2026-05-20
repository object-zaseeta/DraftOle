/**
 * CssManager @media ルール保存機能のテスト (Task 4.1)
 *
 * - addMediaRule(breakpointPx, props) が内部マップにプロパティを格納することを確認
 * - 同一ブレークポイントへの複数呼び出しではプロパティをマージすること
 * - 異なるブレークポイントは独立したマップとして管理されること
 *
 * Requirements: 9.1, 9.4
 */
import { describe, expect, it } from 'vitest';
import { CssConfig } from '../../../src/css/config/css-config.js';
import { CssManager } from '../../../src/css/manager/css-manager.js';

describe('CssManager - addMediaRule (Task 4.1)', () => {
  it('addMediaRule を呼び出すと内部マップにブレークポイントキーが生成される', () => {
    const manager = new CssManager('html>body>div');
    manager.addMediaRule(768, { padding: '16px' });

    const mediaRules = (manager as { _mediaRules: Map<number, Map<string, string>> })._mediaRules;
    expect(mediaRules.has(768)).toBe(true);
  });

  it('addMediaRule はプロパティを内部マップに格納する', () => {
    const manager = new CssManager('html>body>div');
    manager.addMediaRule(768, { padding: '16px' });

    const mediaRules = (manager as { _mediaRules: Map<number, Map<string, string>> })._mediaRules;
    const bpMap = mediaRules.get(768);
    expect(bpMap?.get('padding')).toBe('16px');
  });

  it('同一ブレークポイントに複数のプロパティを追加するとマージされる', () => {
    const manager = new CssManager('html>body>div');
    manager.addMediaRule(768, { padding: '16px' });
    manager.addMediaRule(768, { margin: '8px' });

    const mediaRules = (manager as { _mediaRules: Map<number, Map<string, string>> })._mediaRules;
    const bpMap = mediaRules.get(768);
    expect(bpMap?.get('padding')).toBe('16px');
    expect(bpMap?.get('margin')).toBe('8px');
  });

  it('同一ブレークポイントで既存エントリは上書きされない（後から追加したものが勝つ）', () => {
    const manager = new CssManager('html>body>div');
    manager.addMediaRule(768, { padding: '16px' });
    manager.addMediaRule(768, { padding: '24px' });

    const mediaRules = (manager as { _mediaRules: Map<number, Map<string, string>> })._mediaRules;
    const bpMap = mediaRules.get(768);
    // マージ（上書き）されるので最後の値が勝つ
    expect(bpMap?.get('padding')).toBe('24px');
  });

  it('異なるブレークポイントは独立したマップとして管理される', () => {
    const manager = new CssManager('html>body>div');
    manager.addMediaRule(768, { padding: '16px' });
    manager.addMediaRule(1024, { padding: '24px' });

    const mediaRules = (manager as { _mediaRules: Map<number, Map<string, string>> })._mediaRules;
    expect(mediaRules.get(768)?.get('padding')).toBe('16px');
    expect(mediaRules.get(1024)?.get('padding')).toBe('24px');
    expect(mediaRules.size).toBe(2);
  });

  it('複数プロパティを一度に渡せる', () => {
    const manager = new CssManager('html>body>div');
    manager.addMediaRule(768, { padding: '16px', fontSize: '14px', color: 'red' });

    const mediaRules = (manager as { _mediaRules: Map<number, Map<string, string>> })._mediaRules;
    const bpMap = mediaRules.get(768);
    expect(bpMap?.get('padding')).toBe('16px');
    expect(bpMap?.get('fontSize')).toBe('14px');
    expect(bpMap?.get('color')).toBe('red');
  });

  it('プロパティが空のオブジェクトでも呼び出せる', () => {
    const manager = new CssManager('html>body>div');
    expect(() => manager.addMediaRule(768, {})).not.toThrow();
  });
});

describe('CssManager - renderCss() @media ブロック出力 (Task 4.2)', () => {
  it('_mediaRules が空の場合 renderCss() 出力は変わらない（後方互換）', () => {
    const manager = new CssManager('html>body>div');
    manager.styleManager.style.font.setFontSize('16px');
    const withoutMedia = manager.renderCss();

    // 何も addMediaRule を呼ばなければ出力は同じ
    const manager2 = new CssManager('html>body>div');
    manager2.styleManager.style.font.setFontSize('16px');
    expect(manager2.renderCss()).toBe(withoutMedia);
    expect(manager2.renderCss()).not.toContain('@media');
  });

  it('addMediaRule 後に renderCss() は @media ブロックを末尾に含む', () => {
    const manager = new CssManager('html>body>div');
    manager.styleManager.style.font.setFontSize('16px');
    manager.addMediaRule(768, { padding: '16px' });

    const result = manager.renderCss();
    expect(result).toContain('@media (min-width: 768px)');
  });

  it('@media ブロックにはスコープドクラス名が使われる', () => {
    const manager = new CssManager('html>body>div');
    manager.styleManager.style.font.setFontSize('16px');
    manager.addMediaRule(768, { padding: '16px' });

    const result = manager.renderCss();
    // スコープドクラス名は generateScopedClassName('html>body>div') と同じ
    // renderCss() が生成するベースブロックのクラス名と同じ
    const baseMatch = result.match(/^\.([\w-]+)\s*\{/);
    expect(baseMatch).not.toBeNull();
    const scopedClass = baseMatch?.[1];
    expect(result).toContain(`@media (min-width: 768px) {\n  .${scopedClass} {`);
  });

  it('@media ブロックにはプロパティが含まれる', () => {
    const manager = new CssManager('html>body>div');
    manager.styleManager.style.font.setFontSize('16px');
    manager.addMediaRule(768, { padding: '16px' });

    const result = manager.renderCss();
    expect(result).toContain('padding: 16px;');
  });

  it('@media ブロックは renderCss() 出力の末尾に付加される', () => {
    const manager = new CssManager('html>body>div');
    manager.styleManager.style.font.setFontSize('16px');
    manager.addMediaRule(768, { padding: '16px' });

    const result = manager.renderCss();
    const mediaIndex = result.indexOf('@media');
    const baseBlockIndex = result.indexOf('font-size');
    expect(mediaIndex).toBeGreaterThan(baseBlockIndex);
  });

  it('複数ブレークポイントが個別の @media ブロックとして出力される', () => {
    const manager = new CssManager('html>body>div');
    manager.styleManager.style.font.setFontSize('16px');
    manager.addMediaRule(768, { padding: '16px' });
    manager.addMediaRule(1024, { padding: '24px' });

    const result = manager.renderCss();
    expect(result).toContain('@media (min-width: 768px)');
    expect(result).toContain('@media (min-width: 1024px)');
  });

  it('scopedCssEnabled=false でも @media ブロックは出力されない（mediaRules が空）', () => {
    const config = new CssConfig({ scopedCssEnabled: false });
    const manager = new CssManager('html>body>div', config);
    manager.styleManager.style.font.setFontSize('16px');

    const result = manager.renderCss();
    expect(result).not.toContain('@media');
  });

  it('ベースCSSが空でも @media ブロックは出力される（mediaRules のみの場合）', () => {
    const manager = new CssManager('html>body>div');
    manager.addMediaRule(768, { padding: '16px' });

    const result = manager.renderCss();
    expect(result).toContain('@media (min-width: 768px)');
    expect(result).toContain('padding: 16px;');
  });
});
