/**
 * `src/js/vanilla/commands.ts` の振る舞いテスト。
 *
 * 対応 requirement: 1.5, 7.1, 7.4
 * 対応 design.md セクション: 「commands: VanillaCommand」「renderCommand」「renderCommands」
 */

import { describe, expect, it } from 'vitest';

import {
  type AppendChildCommand,
  type VanillaCommand,
  renderCommand,
  renderCommands,
  rewriteAppendChildTargets,
} from '../../../src/js/vanilla/commands.ts';
import type { ElementTarget } from '../../../src/js/vanilla/element-target.ts';

/** テスト用ヘルパー: 裸の変数名を closure-ref ElementTarget に変換する */
function cref(varName: string): ElementTarget {
  return { kind: 'closure-ref', varName };
}

describe('renderCommand', () => {
  it('renders addEventListener with quoted event name', () => {
    const cmd: VanillaCommand = {
      type: 'addEventListener',
      target: cref('document'),
      event: 'DOMContentLoaded',
      handlerCode: '(e) => {\n  foo();\n}',
    };
    expect(renderCommand(cmd)).toBe(
      'document.addEventListener("DOMContentLoaded", (e) => {\n  foo();\n});',
    );
  });

  it('renders domReady as a DOMContentLoaded listener with indented body', () => {
    const cmd: VanillaCommand = {
      type: 'domReady',
      bodyCode: '  foo();\n  bar();',
    };
    const out = renderCommand(cmd);
    expect(out).toContain('document.addEventListener("DOMContentLoaded"');
    expect(out).toContain('foo();');
    expect(out).toContain('bar();');
  });

  it('renders declareFunction with params and indented body', () => {
    const cmd: VanillaCommand = {
      type: 'declareFunction',
      name: 'updateCount',
      params: ['a', 'b'],
      bodyCode: '  return a + b;',
    };
    expect(renderCommand(cmd)).toBe('function updateCount(a, b) {\n  return a + b;\n}');
  });

  it('renders declareConst', () => {
    expect(
      renderCommand({
        type: 'declareConst',
        name: 'input',
        expr: 'document.querySelector("#x")',
      }),
    ).toBe('const input = document.querySelector("#x");');
  });

  it('renders classListToggle without force', () => {
    expect(
      renderCommand({ type: 'classListToggle', target: cref('el'), name: 'done' }),
    ).toBe('el.classList.toggle("done");');
  });

  it('renders classListToggle with force expression', () => {
    expect(
      renderCommand({
        type: 'classListToggle',
        target: cref('el'),
        name: 'done',
        force: 'cond',
      }),
    ).toBe('el.classList.toggle("done", cond);');
  });

  it('renders classListAdd and classListRemove', () => {
    expect(renderCommand({ type: 'classListAdd', target: cref('el'), name: 'done' })).toBe(
      'el.classList.add("done");',
    );
    expect(renderCommand({ type: 'classListRemove', target: cref('el'), name: 'done' })).toBe(
      'el.classList.remove("done");',
    );
  });

  it('renders setProp for textContent and value', () => {
    expect(
      renderCommand({ type: 'setProp', target: cref('el'), prop: 'textContent', expr: '"hi"' }),
    ).toBe('el.textContent = "hi";');
    expect(
      renderCommand({ type: 'setProp', target: cref('el'), prop: 'value', expr: 'x' }),
    ).toBe('el.value = x;');
  });

  it('renders setStyle with camelCase key', () => {
    expect(
      renderCommand({ type: 'setStyle', target: cref('el'), key: 'borderColor', expr: '"red"' }),
    ).toBe('el.style.borderColor = "red";');
  });

  it('renders appendChild and remove', () => {
    expect(
      renderCommand({
        type: 'appendChild',
        parent: { kind: 'closure-ref', varName: 'p' },
        child: { kind: 'closure-ref', varName: 'c' },
      }),
    ).toBe('p.appendChild(c);');
    expect(renderCommand({ type: 'remove', target: cref('el') })).toBe('el.remove();');
  });

  it('renders forEach with item var and indented body', () => {
    const cmd: VanillaCommand = {
      type: 'forEach',
      listExpr: 'list',
      itemVar: 'item',
      bodyCode: '  item.remove();',
    };
    expect(renderCommand(cmd)).toBe('list.forEach((item) => {\n  item.remove();\n});');
  });

  it('renders if without else', () => {
    expect(
      renderCommand({ type: 'if', condition: 'a === b', thenCode: '  foo();' }),
    ).toBe('if (a === b) {\n  foo();\n}');
  });

  it('renders if with else', () => {
    expect(
      renderCommand({
        type: 'if',
        condition: 'a',
        thenCode: '  foo();',
        elseCode: '  bar();',
      }),
    ).toBe('if (a) {\n  foo();\n} else {\n  bar();\n}');
  });

  it('renders expr (evaluate and discard) with trailing semicolon', () => {
    expect(renderCommand({ type: 'expr', code: 'updateCount()' })).toBe('updateCount();');
  });

  it('renders raw as-is', () => {
    expect(renderCommand({ type: 'raw', code: '/* anything */' })).toBe('/* anything */');
  });
});

describe('renderCommands', () => {
  it('applies indent to each line of each rendered command', () => {
    const cmds: VanillaCommand[] = [
      { type: 'expr', code: 'a()' },
      { type: 'expr', code: 'b()' },
    ];
    expect(renderCommands(cmds, '  ')).toBe('  a();\n  b();');
  });

  it('applies indent to multi-line commands', () => {
    const cmds: VanillaCommand[] = [
      { type: 'if', condition: 'x', thenCode: '  y();' },
    ];
    expect(renderCommands(cmds, '  ')).toBe('  if (x) {\n    y();\n  }');
  });

  it('returns empty string for empty command list', () => {
    expect(renderCommands([], '  ')).toBe('');
  });
});

// ── Task 2: bind-checked / bind-value transform 拡張テスト（Req 1.2, 1.3, 5.2） ──

describe('bind-checked command (Req 1.2, 1.3)', () => {
  it('renders bind-checked without transform', () => {
    const cmd: VanillaCommand = {
      type: 'bind-checked',
      target: cref('_e0'),
      stateId: 's0.itemTemplate',
    };
    expect(renderCommand(cmd)).toBe(
      '__draftole__.bindChecked(_e0, "s0.itemTemplate");',
    );
  });

  it('renders bind-checked with transform (Req 1.3)', () => {
    const cmd: VanillaCommand = {
      type: 'bind-checked',
      target: cref('_e0'),
      stateId: 's0.itemTemplate',
      transform: { code: 'function(_v) { return _v.done; }' },
    };
    expect(renderCommand(cmd)).toBe(
      '__draftole__.bindChecked(_e0, "s0.itemTemplate", function(_v) { return _v.done; });',
    );
  });

  it('bind-checked without transform is backward compatible (Req 5.2)', () => {
    // transform が省略された場合は 3引数形式で出力されないこと
    const cmd: VanillaCommand = {
      type: 'bind-checked',
      target: { kind: 'sel', selector: '#chk' },
      stateId: 'done',
    };
    const out = renderCommand(cmd);
    expect(out).toContain('bindChecked');
    expect(out).not.toContain('undefined');
    // transform 引数なしで出力されること
    expect(out).toBe('__draftole__.bindChecked(document.querySelector("#chk"), "done");');
  });
});

describe('bind-value transform 拡張（Req 1.2, 1.3, 5.2）', () => {
  it('renders bind-value without transform (既存動作維持)', () => {
    const cmd: VanillaCommand = {
      type: 'bind-value',
      target: cref('_e1'),
      stateId: 's1',
    };
    expect(renderCommand(cmd)).toBe('__draftole__.bindValue(_e1, "s1");');
  });

  it('renders bind-value with transform (Req 1.3)', () => {
    const cmd: VanillaCommand = {
      type: 'bind-value',
      target: cref('_e1'),
      stateId: 's0.itemTemplate',
      transform: { code: 'function(_v) { return _v.label; }' },
    };
    expect(renderCommand(cmd)).toBe(
      '__draftole__.bindValue(_e1, "s0.itemTemplate", function(_v) { return _v.label; });',
    );
  });

  it('bind-value transform は省略可能で後方互換性を維持する (Req 5.2)', () => {
    // transform なしの既存コマンドは変わらず動作すること
    const cmd: VanillaCommand = {
      type: 'bind-value',
      target: { kind: 'sel', selector: '#input' },
      stateId: 'val',
    };
    const out = renderCommand(cmd);
    expect(out).not.toContain('undefined');
    expect(out).toBe('__draftole__.bindValue(document.querySelector("#input"), "val");');
  });
});

describe('jQuery / $ exclusion (Req 1.5, 7.1)', () => {
  it('does not emit jQuery or $ for any command variant', () => {
    const selector = '#foo .bar $special';
    const cmds: VanillaCommand[] = [
      {
        type: 'addEventListener',
        target: cref('document'),
        event: 'click',
        handlerCode: '(e) => {}',
      },
      { type: 'domReady', bodyCode: '  noop();' },
      {
        type: 'declareFunction',
        name: 'f',
        params: [],
        bodyCode: '  return;',
      },
      { type: 'declareConst', name: 'x', expr: 'document.querySelector("#q")' },
      { type: 'classListToggle', target: cref('el'), name: 'done' },
      { type: 'classListAdd', target: cref('el'), name: 'done' },
      { type: 'classListRemove', target: cref('el'), name: 'done' },
      { type: 'setProp', target: cref('el'), prop: 'textContent', expr: '"hi"' },
      { type: 'setStyle', target: cref('el'), key: 'color', expr: '"red"' },
      { type: 'appendChild', parent: { kind: 'closure-ref', varName: 'p' }, child: { kind: 'closure-ref', varName: 'c' } },
      { type: 'remove', target: cref('el') },
      { type: 'forEach', listExpr: 'l', itemVar: 'it', bodyCode: '  it.remove();' },
      { type: 'if', condition: 'a', thenCode: '  b();' },
      { type: 'expr', code: 'updateCount()' },
      // Note: a selector containing the literal "$special" token is allowed as a
      // string literal because JSON.stringify quotes it; we test that plain
      // identifiers "jQuery" and "$" are not emitted as standalone tokens.
      { type: 'raw', code: `const sel = ${JSON.stringify(selector)};` },
    ];
    const out = renderCommands(cmds, '');
    expect(out).not.toMatch(/\bjQuery\b/);
    // Ensure `$` does not appear as a standalone identifier (allow inside quoted strings).
    // Strip string literals first, then check.
    const stripped = out.replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/'(?:[^'\\]|\\.)*'/g, "''");
    expect(stripped).not.toMatch(/(^|[^A-Za-z0-9_])\$(?![A-Za-z0-9_])/);
  });
});

// ── Task 4.1: appendChild 新型の renderCommand / rewriteAppendChildTargets テスト ──
// 対応 requirement: 1.4, 4.3
// 対応 design.md セクション: 「appendChild command type (refactored)」「rewriteAppendChildTargets」

describe('renderCommand: appendChild (新型 ElementTarget 保持, Req 1.4, 4.3)', () => {
  it('renders appendChild with closure-ref parent and closure-ref child', () => {
    // 最も基本的なケース: factory コード内ローカル変数同士
    const cmd: VanillaCommand = {
      type: 'appendChild',
      parent: { kind: 'closure-ref', varName: '_e0' },
      child: { kind: 'closure-ref', varName: '_e1' },
    };
    expect(renderCommand(cmd)).toBe('_e0.appendChild(_e1);');
  });

  it('renders appendChild with sel parent and closure-ref child', () => {
    // parent が document.querySelector 経由、child が closure-ref のケース
    const cmd: VanillaCommand = {
      type: 'appendChild',
      parent: { kind: 'sel', selector: '#container' },
      child: { kind: 'closure-ref', varName: '_e0' },
    };
    expect(renderCommand(cmd)).toBe('document.querySelector("#container").appendChild(_e0);');
  });

  it('renders appendChild with closure-ref parent and sel child', () => {
    // parent が closure-ref、child が sel のケース
    const cmd: VanillaCommand = {
      type: 'appendChild',
      parent: { kind: 'closure-ref', varName: 'container' },
      child: { kind: 'sel', selector: '.item' },
    };
    expect(renderCommand(cmd)).toBe('container.appendChild(document.querySelector(".item"));');
  });

  it('renders appendChild with sel parent and sel child', () => {
    // parent / child 双方が selector のケース
    const cmd: VanillaCommand = {
      type: 'appendChild',
      parent: { kind: 'sel', selector: '#list' },
      child: { kind: 'sel', selector: '#item' },
    };
    expect(renderCommand(cmd)).toBe(
      'document.querySelector("#list").appendChild(document.querySelector("#item"));',
    );
  });

  it('throws when parent is deferred-self (未解決 target は renderCommand に渡してはならない)', () => {
    // deferred-self は walkAndEmit で closure-ref に書き換えられてから renderCommand が呼ばれる
    // 万一書き換え漏れがあれば TypeError で検出されることを確認する
    const cmd: VanillaCommand = {
      type: 'appendChild',
      parent: { kind: 'deferred-self' },
      child: { kind: 'closure-ref', varName: '_e0' },
    };
    expect(() => renderCommand(cmd)).toThrow(TypeError);
  });

  it('throws when child is deferred-self (未解決 target は renderCommand に渡してはならない)', () => {
    const cmd: VanillaCommand = {
      type: 'appendChild',
      parent: { kind: 'closure-ref', varName: '_e0' },
      child: { kind: 'deferred-self' },
    };
    expect(() => renderCommand(cmd)).toThrow(TypeError);
  });
});

describe('rewriteAppendChildTargets (Req 1.4, 4.3)', () => {
  it('rewrites both parent and child to specified closure-ref targets', () => {
    // walkAndEmit が deferred-self を closure-ref に書き換える際の主要ユースケース
    const original: AppendChildCommand = {
      type: 'appendChild',
      parent: { kind: 'deferred-self' },
      child: { kind: 'deferred-self' },
    };
    const newParent: ElementTarget = { kind: 'closure-ref', varName: '_e0' };
    const newChild: ElementTarget = { kind: 'closure-ref', varName: '_e1' };

    const rewritten = rewriteAppendChildTargets(original, newParent, newChild);

    expect(rewritten.type).toBe('appendChild');
    expect(rewritten.parent).toEqual({ kind: 'closure-ref', varName: '_e0' });
    expect(rewritten.child).toEqual({ kind: 'closure-ref', varName: '_e1' });
  });

  it('rewrites parent to closure-ref and child to sel', () => {
    const original: AppendChildCommand = {
      type: 'appendChild',
      parent: { kind: 'deferred-self' },
      child: { kind: 'sel', selector: '#existing' },
    };
    const newParent: ElementTarget = { kind: 'closure-ref', varName: '_e2' };
    const newChild: ElementTarget = { kind: 'sel', selector: '#target' };

    const rewritten = rewriteAppendChildTargets(original, newParent, newChild);

    expect(rewritten.parent).toEqual({ kind: 'closure-ref', varName: '_e2' });
    expect(rewritten.child).toEqual({ kind: 'sel', selector: '#target' });
  });

  it('does not mutate the original command (immutability)', () => {
    const original: AppendChildCommand = {
      type: 'appendChild',
      parent: { kind: 'closure-ref', varName: 'p' },
      child: { kind: 'closure-ref', varName: 'c' },
    };
    const newParent: ElementTarget = { kind: 'closure-ref', varName: 'p2' };
    const newChild: ElementTarget = { kind: 'closure-ref', varName: 'c2' };

    rewriteAppendChildTargets(original, newParent, newChild);

    // 元コマンドは不変のまま
    expect(original.parent).toEqual({ kind: 'closure-ref', varName: 'p' });
    expect(original.child).toEqual({ kind: 'closure-ref', varName: 'c' });
  });

  it('rewritten command renders correctly with renderCommand', () => {
    // rewriteAppendChildTargets の結果が renderCommand で正しく JS 文字列化されること
    const original: AppendChildCommand = {
      type: 'appendChild',
      parent: { kind: 'deferred-self' },
      child: { kind: 'deferred-self' },
    };
    const rewritten = rewriteAppendChildTargets(
      original,
      { kind: 'closure-ref', varName: '_e0' },
      { kind: 'closure-ref', varName: '_e3' },
    );

    expect(renderCommand(rewritten)).toBe('_e0.appendChild(_e3);');
  });
});
