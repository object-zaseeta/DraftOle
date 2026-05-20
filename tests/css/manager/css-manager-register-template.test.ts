/**
 * Task 2.3: CssManager.registerTemplate のテスト
 *
 * - registerTemplate(template, resolver, tagPath) は className を返す
 * - 内部 buffer に (className, template) を蓄積
 * - 同一 (tagPath, bodyHash) の重複登録は冪等
 * - 異なる tagPath では異なる className
 * - renderCss() 出力に登録順で rule が含まれる
 * - selectors（pseudo / compound / descendant）も出力に含まれる
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.7
 */
import { describe, it, expect } from 'vitest';
import { CssManager } from '../../../src/css/manager/css-manager.js';
import { createStyleTemplate } from '../../../src/css/variables/style-template.js';
import {
  defaultIdentifierResolver,
  resolveClassName,
} from '../../../src/css/utils/identifier-resolver.js';

describe('CssManager.registerTemplate', () => {
  it('returns className equal to resolveClassName(tagPath, bodyHash)', () => {
    const mgr = new CssManager('html>body>div');
    const tpl = createStyleTemplate({ properties: { display: 'flex' } });
    const className = mgr.registerTemplate(
      tpl,
      defaultIdentifierResolver,
      'html>body>div',
    );
    expect(className).toBe(
      resolveClassName('html>body>div', tpl.bodyHash),
    );
  });

  it('renderCss() includes the registered rule with the resolved className', () => {
    const mgr = new CssManager('html>body>div');
    const tpl = createStyleTemplate({
      properties: { display: 'flex', gap: '10px' },
    });
    const className = mgr.registerTemplate(
      tpl,
      defaultIdentifierResolver,
      'html>body>div',
    );
    const out = mgr.renderCss();
    expect(out).toContain(`.${className} {`);
    expect(out).toContain('display: flex;');
    expect(out).toContain('gap: 10px;');
  });

  it('idempotent on (tagPath, bodyHash): same className, no duplicate buffer', () => {
    const mgr = new CssManager('html>body>div');
    const tpl = createStyleTemplate({ properties: { display: 'flex' } });
    const c1 = mgr.registerTemplate(
      tpl,
      defaultIdentifierResolver,
      'html>body>div',
    );
    const c2 = mgr.registerTemplate(
      tpl,
      defaultIdentifierResolver,
      'html>body>div',
    );
    expect(c1).toBe(c2);
    const out = mgr.renderCss();
    // Only one rule for this className
    const occurrences = out.split(`.${c1} {`).length - 1;
    expect(occurrences).toBe(1);
  });

  it('different tagPath produces different className', () => {
    const mgr = new CssManager('html>body>div');
    const tpl = createStyleTemplate({ properties: { display: 'flex' } });
    const c1 = mgr.registerTemplate(
      tpl,
      defaultIdentifierResolver,
      'html>body>div',
    );
    const c2 = mgr.registerTemplate(
      tpl,
      defaultIdentifierResolver,
      'html>body>span',
    );
    expect(c1).not.toBe(c2);
  });

  it('renders multiple registered rules in registration order', () => {
    const mgr = new CssManager('html>body>div');
    const a = createStyleTemplate({ properties: { display: 'flex' } });
    const b = createStyleTemplate({ properties: { color: 'red' } });
    const ca = mgr.registerTemplate(
      a,
      defaultIdentifierResolver,
      'html>body>div',
    );
    const cb = mgr.registerTemplate(
      b,
      defaultIdentifierResolver,
      'html>body>div',
    );
    const out = mgr.renderCss();
    const ia = out.indexOf(`.${ca} {`);
    const ib = out.indexOf(`.${cb} {`);
    expect(ia).toBeGreaterThanOrEqual(0);
    expect(ib).toBeGreaterThan(ia);
  });

  it('renders selectors (pseudo) using the resolved className', () => {
    const mgr = new CssManager('html>body>button');
    const tpl = createStyleTemplate({
      properties: { padding: '10px' },
      selectors: {
        hover: { background: 'red' },
        '&.primary': { borderColor: 'blue' },
      },
    });
    const className = mgr.registerTemplate(
      tpl,
      defaultIdentifierResolver,
      'html>body>button',
    );
    const out = mgr.renderCss();
    expect(out).toContain(`.${className} {`);
    expect(out).toContain(`.${className}:hover {`);
    expect(out).toContain('background: red;');
    expect(out).toContain(`.${className}.primary {`);
    expect(out).toContain('border-color: blue;');
  });

  it('coexists with existing render() (style/layout) output', () => {
    const mgr = new CssManager('html>body>div');
    mgr.styleManager.style.font.setFontSize('16px');
    const tpl = createStyleTemplate({ properties: { display: 'flex' } });
    const className = mgr.registerTemplate(
      tpl,
      defaultIdentifierResolver,
      'html>body>div',
    );
    const out = mgr.renderCss();
    // Existing scoped class (without bodyHash) and the new template class both appear
    expect(out).toContain('font-size: 16px;');
    expect(out).toContain(`.${className} {`);
  });
});
