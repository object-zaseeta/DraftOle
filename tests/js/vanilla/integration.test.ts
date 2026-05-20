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

import { describe, expect, it, vi } from 'vitest';

import { div } from '../../../src/html/tags/factories.ts';
import { jsTemplate } from '../../../src/js/js-template.ts';
import { attach } from '../../../src/js/vanilla/internal/index.js';
import type { VanillaCommand } from '../../../src/js/vanilla/commands.ts';
import type { ElementRef } from '../../../src/js/vanilla/types.ts';
import type { VanillaScope } from '../../../src/js/vanilla/vanilla-script-builder.ts';

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

/**
 * Task 2.3 (P): attach() の禁則経路と wrapScope のパススルーをテストする。
 *
 * 対応 requirement: 3.1, 3.3, 3.5
 * 対応 design.md セクション: 「IntegrationClassification」「IntegrationBranchTests」
 *
 * `attach` は `_childScope` 経由で受け取る子スコープにも同じ禁則ガードを再帰的に
 * 適用する（`wrapScope`）。本ブロックは:
 *   - 親スコープでの `domReady` / `declareFunction` 禁則
 *   - 1 階層・2 階層ネストの `_childScope` での同等禁則
 *   - `ifThen` の then / orElse 内部スコープでの同等禁則
 *   - `wrapScope` の純粋委譲メソッド（raw / let / call / return / ifThen）
 * を網羅し、`src/js/vanilla/internal/integration.ts` の branch / Functions ≥ 80% を担保する。
 */
describe('attach() forbidden-command guard (Task 2.3 / Req 3.3)', () => {
  it('throws when _childScope (1 level) emits domReady (recursive wrapScope)', () => {
    const afterCreate = attach((scope) => {
      const child = scope._childScope([]);
      child._append({ type: 'domReady', bodyCode: '' });
    });
    expect(() => afterCreate({ root: 'root' })).toThrow(/onDomReady|attach/);
  });

  it('throws when _childScope (1 level) emits declareFunction (recursive wrapScope)', () => {
    const afterCreate = attach((scope) => {
      const child = scope._childScope([]);
      child._append({
        type: 'declareFunction',
        name: 'inner',
        params: [],
        bodyCode: '',
      });
    });
    expect(() => afterCreate({ root: 'root' })).toThrow(/declareFunction|attach/);
  });

  it('throws when nested _childScope (2 levels) emits domReady', () => {
    const afterCreate = attach((scope) => {
      const child = scope._childScope([]);
      const grandchild = child._childScope([]);
      grandchild._append({ type: 'domReady', bodyCode: '' });
    });
    expect(() => afterCreate({ root: 'root' })).toThrow(/onDomReady|attach/);
  });

  it('throws when nested _childScope (2 levels) emits declareFunction', () => {
    const afterCreate = attach((scope) => {
      const child = scope._childScope([]);
      const grandchild = child._childScope([]);
      grandchild._append({
        type: 'declareFunction',
        name: 'deep',
        params: [],
        bodyCode: '',
      });
    });
    expect(() => afterCreate({ root: 'root' })).toThrow(/declareFunction|attach/);
  });

  it('throws when ifThen.then child scope emits domReady', () => {
    const afterCreate = attach((scope) => {
      scope.ifThen(scope.raw('true'), (then) => {
        then._append({ type: 'domReady', bodyCode: '' });
      });
    });
    expect(() => afterCreate({ root: 'root' })).toThrow(/onDomReady|attach/);
  });

  it('throws when ifThen.orElse child scope emits declareFunction', () => {
    const afterCreate = attach((scope) => {
      scope.ifThen(
        scope.raw('false'),
        () => {
          /* no-op */
        },
        (orElse) => {
          orElse._append({
            type: 'declareFunction',
            name: 'inElse',
            params: [],
            bodyCode: '',
          });
        },
      );
    });
    expect(() => afterCreate({ root: 'root' })).toThrow(/declareFunction|attach/);
  });
});

describe('attach() wrapScope passthrough delegation (Task 2.3 / Req 3.3)', () => {
  /**
   * wrapScope は内部 helper であり直接 export されない。
   * `attach()` 内で `scope._childScope(queue)` を呼び出すと、
   * 返却される子スコープは `wrapScope(rawChild)` でラップされている。
   * その子スコープに対して各 passthrough メソッドを呼び、
   * 結果（戻り値の式形 / 子キューに積まれた命令列）が
   * 内部 rawChild が直接処理したのと等価であることを確認する。
   */

  it('delegates raw() to inner scope returning {code}', () => {
    let result: { code: string } | undefined;
    const afterCreate = attach((scope) => {
      const child = scope._childScope([]);
      result = child.raw('1 + 2');
      // 命令は何も追加されないこと（raw は純粋に式オブジェクトを返すだけ）
      scope.raw('placeholder'); // top-level no-op for body shape
    });
    afterCreate({ root: 'root' });
    expect(result).toBeDefined();
    expect(result?.code).toBe('1 + 2');
  });

  it('delegates let() to inner scope (declareConst command + returns var ref)', () => {
    const childQueue: VanillaCommand[] = [];
    let result: { code: string } | undefined;
    const afterCreate = attach((scope) => {
      const child = scope._childScope(childQueue);
      result = child.let('x', child.raw('42'));
    });
    afterCreate({ root: 'root' });
    expect(result?.code).toBe('x');
    expect(childQueue).toEqual([{ type: 'declareConst', name: 'x', expr: '42' }]);
  });

  it('delegates call() to inner scope (expr command appended + returns call expr)', () => {
    const childQueue: VanillaCommand[] = [];
    let result: { code: string } | undefined;
    const afterCreate = attach((scope) => {
      const child = scope._childScope(childQueue);
      result = child.call('f', [child.raw('a'), child.raw('b')]);
    });
    afterCreate({ root: 'root' });
    expect(result?.code).toBe('f(a, b)');
    expect(childQueue).toEqual([{ type: 'expr', code: 'f(a, b)' }]);
  });

  it('delegates return() to inner scope (return; raw command appended)', () => {
    const childQueue: VanillaCommand[] = [];
    const afterCreate = attach((scope) => {
      const child = scope._childScope(childQueue);
      child.return();
    });
    afterCreate({ root: 'root' });
    expect(childQueue).toEqual([{ type: 'raw', code: 'return;' }]);
  });

  it('delegates ifThen() to inner scope (with then-only) and wraps the then child', () => {
    const childQueue: VanillaCommand[] = [];
    const thenHandler = vi.fn((s: VanillaScope) => {
      s.call('thenSide');
    });
    const afterCreate = attach((scope) => {
      const child = scope._childScope(childQueue);
      child.ifThen(child.raw('flag'), thenHandler);
    });
    afterCreate({ root: 'root' });
    expect(thenHandler).toHaveBeenCalledTimes(1);
    expect(childQueue).toHaveLength(1);
    expect(childQueue[0]).toMatchObject({
      type: 'if',
      condition: 'flag',
    });
    // The then handler ran inside wrapScope; its body code must include the delegated call.
    const ifCmd = childQueue[0] as Extract<VanillaCommand, { type: 'if' }>;
    expect(ifCmd.thenCode).toContain('thenSide();');
    expect(ifCmd.elseCode).toBeUndefined();
  });

  it('delegates ifThen() with orElse to inner scope and wraps both branches', () => {
    const childQueue: VanillaCommand[] = [];
    const thenHandler = vi.fn((s: VanillaScope) => {
      s.call('thenSide');
    });
    const elseHandler = vi.fn((s: VanillaScope) => {
      s.call('elseSide');
    });
    const afterCreate = attach((scope) => {
      const child = scope._childScope(childQueue);
      child.ifThen(child.raw('cond'), thenHandler, elseHandler);
    });
    afterCreate({ root: 'root' });
    expect(thenHandler).toHaveBeenCalledTimes(1);
    expect(elseHandler).toHaveBeenCalledTimes(1);
    const ifCmd = childQueue[0] as Extract<VanillaCommand, { type: 'if' }>;
    expect(ifCmd.condition).toBe('cond');
    expect(ifCmd.thenCode).toContain('thenSide();');
    expect(ifCmd.elseCode).toContain('elseSide();');
  });

  it('passes a wrapScope-wrapped scope into ifThen handlers (forbidden guard active)', () => {
    // ifThen handler 内で domReady を append すると、wrapScope の再帰ガードにより throw する。
    const afterCreate = attach((scope) => {
      const child = scope._childScope([]);
      child.ifThen(child.raw('true'), (then) => {
        then._append({ type: 'domReady', bodyCode: '' });
      });
    });
    expect(() => afterCreate({ root: 'root' })).toThrow(/onDomReady|attach/);
  });

  it('passes a wrapScope-wrapped scope into ifThen orElse handler (forbidden guard active)', () => {
    const afterCreate = attach((scope) => {
      const child = scope._childScope([]);
      child.ifThen(
        child.raw('false'),
        () => {
          /* no-op */
        },
        (orElse) => {
          orElse._append({
            type: 'declareFunction',
            name: 'nope',
            params: [],
            bodyCode: '',
          });
        },
      );
    });
    expect(() => afterCreate({ root: 'root' })).toThrow(/declareFunction|attach/);
  });

  it('forwards non-forbidden _append commands through wrapScope to inner queue', () => {
    const childQueue: VanillaCommand[] = [];
    const afterCreate = attach((scope) => {
      const child = scope._childScope(childQueue);
      child._append({ type: 'expr', code: 'allowed()' });
    });
    afterCreate({ root: 'root' });
    expect(childQueue).toEqual([{ type: 'expr', code: 'allowed()' }]);
  });
});
