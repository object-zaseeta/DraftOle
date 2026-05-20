/**
 * 6.6: radial-gradient 実装
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CSSBackground } from '../../src/css/style/background/css-background.js';

describe('6.6: radial-gradient', () => {
  const savedDev = process.env.DRAFT_OLE_DEV;
  beforeEach(() => { delete process.env.DRAFT_OLE_DEV; });
  afterEach(() => {
    if (savedDev === undefined) delete process.env.DRAFT_OLE_DEV;
    else process.env.DRAFT_OLE_DEV = savedDev;
  });

  it('setRadialGradient で radial-gradient が出力される', () => {
    const bg = new CSSBackground();
    bg.setRadialGradient('circle at center', 'red', 'blue');
    expect(bg.render()).toContain('background-image: radial-gradient(circle at center, red, blue)');
  });

  it('複雑な radial-gradient を設定できる', () => {
    const bg = new CSSBackground();
    bg.setRadialGradient(
      '1200px 600px at 20% 10%',
      'rgba(124, 92, 255, 0.35)',
      'transparent 60%'
    );
    const result = bg.render();
    expect(result).toContain('radial-gradient(1200px 600px at 20% 10%, rgba(124, 92, 255, 0.35), transparent 60%)');
  });

  it('backgroundColor と併用できる', () => {
    const bg = new CSSBackground();
    bg.setBackgroundColor('#0b1220');
    bg.setRadialGradient('circle', '#fff', '#000');
    const result = bg.render();
    expect(result).toContain('background-color: #0b1220');
    expect(result).toContain('radial-gradient(circle, #fff, #000)');
  });

  it('linearGradient を上書きする', () => {
    const bg = new CSSBackground();
    bg.setLinearGradient('to right', 'red', 'blue');
    bg.setRadialGradient('circle', '#fff', '#000');
    const result = bg.render();
    expect(result).toContain('radial-gradient(');
    expect(result).not.toContain('linear-gradient(');
  });

  it('メソッドチェーンが可能', () => {
    const bg = new CSSBackground();
    const result = bg.setRadialGradient('circle', 'red', 'blue');
    expect(result).toBe(bg);
  });
});
