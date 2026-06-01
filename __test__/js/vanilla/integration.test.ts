/**
 * `src/js/vanilla/integration.ts` の振る舞いテスト（Task 5.1）。
 *
 * 対応 requirement: 6.1, 6.2, 6.3
 * 対応 design.md セクション: 「integration: attach / fromJsName」
 *
 * attach() は jsTemplate() の afterCreate(refs) 契約に合うコールバックを返す。
 * - refs の各 jsName は ElementRef として build の scope に渡される。
 * - 返却文字列は関数本体に挿入される素のコマンド列（関数定義や DOMContentLoaded を含まない）。
 * - attach 内で onDomReady / declareFunction が呼ばれた場合は Error を投げる。
 * - jsTemplate の公開 API（JsTemplateResult / afterCreate シグネチャ）を変更しない。
 */

import { describe, expect, it } from 'vitest';

import { div } from '../../../src/html/tags/factories.ts';
import { jsTemplate } from '../../../src/js/js-template.ts';
import { attach } from '../../../src/js/vanilla/integration.ts';
import type { ElementRef } from '../../../src/js/vanilla/types.ts';

describe('attach (Task 5.1)', () => {
  it('returns a function matching jsTemplate afterCreate contract (Req 6.1, 6.3)', () => {
    const afterCreate = attach((scope, refs) => {
      scope.call('console.log', [refs.root]);
    });
    // afterCreate is (refs: Record<string,string>) => string
    expect(typeof afterCreate).toBe('function');
    const out = afterCreate({ root: 'root' });
    expect(typeof out).toBe('string');
  });

  it('passes refs as ElementRef bound to the jsName variable (Req 6.1)', () => {
    let captured: ElementRef | undefined;
    const afterCreate = attach((scope, refs) => {
      captured = refs.myBtn;
      scope.call('setup', [refs.myBtn]);
    });
    const out = afterCreate({ myBtn: 'myBtn' });
    expect(captured).toBeDefined();
    if (captured === undefined) throw new Error('unreachable');
    expect(captured.code).toBe('myBtn');
    expect(captured.kind).toBe('var');
    // Rendered body references the variable name, not a literal.
    expect(out).toContain('setup(myBtn);');
    expect(out).not.toContain('"myBtn"');
  });

  it('returns plain command body without function wrapping or DOMContentLoaded (Req 6.2)', () => {
    const afterCreate = attach((scope, refs) => {
      scope.call('track', [refs.root]);
    });
    const out = afterCreate({ root: 'root' });
    expect(out).not.toContain('function');
    expect(out).not.toContain('DOMContentLoaded');
    expect(out).not.toContain('addEventListener("DOMContentLoaded"');
    expect(out.trim()).toBe('track(root);');
  });

  it('integrates with jsTemplate().render() inserting body before return', () => {
    const tmpl = jsTemplate(
      'createBox',
      [],
      div({ className: 'box', jsName: 'root' }),
      attach((scope, refs) => {
        scope.call('init', [refs.root]);
      }),
    );
    const code = tmpl.render();
    // Function wraps normally, our body appears before the return.
    expect(code).toContain('function createBox()');
    expect(code).toMatch(/init\(root\);\s*\n\s*return root;/);
  });

  it('throws when build code attempts to append a domReady command (Req 6.3 / design guard)', () => {
    const afterCreate = attach((scope) => {
      scope._append({ type: 'domReady', bodyCode: '' });
    });
    expect(() => afterCreate({ root: 'root' })).toThrow(/onDomReady|domReady|attach/);
  });

  it('throws when build code attempts to append a declareFunction command (Req 6.3 / design guard)', () => {
    const afterCreate = attach((scope) => {
      scope._append({
        type: 'declareFunction',
        name: 'inner',
        params: [],
        bodyCode: '',
      });
    });
    expect(() => afterCreate({ root: 'root' })).toThrow(/declareFunction|attach/);
  });

  it('does not emit jQuery or $ in its output (Req 7.1 carried)', () => {
    const afterCreate = attach((scope, refs) => {
      scope.call('doIt', [refs.root]);
    });
    const out = afterCreate({ root: 'root' });
    expect(out).not.toMatch(/\bjQuery\b/);
    expect(out).not.toMatch(/\$\(/);
  });
});
