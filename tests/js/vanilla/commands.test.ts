/**
 * `src/js/vanilla/commands.ts` の振る舞いテスト。
 *
 * 対応 requirement: 1.5, 7.1, 7.4
 * 対応 design.md セクション: 「commands: VanillaCommand」「renderCommand」「renderCommands」
 */

import { describe, expect, it } from 'vitest';

import {
  renderCommand,
  renderCommands,
  type VanillaCommand,
} from '../../../src/js/vanilla/commands.ts';

describe('renderCommand', () => {
  it('renders addEventListener with quoted event name', () => {
    const cmd: VanillaCommand = {
      type: 'addEventListener',
      target: 'document',
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
      renderCommand({ type: 'classListToggle', target: 'el', name: 'done' }),
    ).toBe('el.classList.toggle("done");');
  });

  it('renders classListToggle with force expression', () => {
    expect(
      renderCommand({
        type: 'classListToggle',
        target: 'el',
        name: 'done',
        force: 'cond',
      }),
    ).toBe('el.classList.toggle("done", cond);');
  });

  it('renders classListAdd and classListRemove', () => {
    expect(renderCommand({ type: 'classListAdd', target: 'el', name: 'done' })).toBe(
      'el.classList.add("done");',
    );
    expect(renderCommand({ type: 'classListRemove', target: 'el', name: 'done' })).toBe(
      'el.classList.remove("done");',
    );
  });

  it('renders setProp for textContent and value', () => {
    expect(
      renderCommand({ type: 'setProp', target: 'el', prop: 'textContent', expr: '"hi"' }),
    ).toBe('el.textContent = "hi";');
    expect(
      renderCommand({ type: 'setProp', target: 'el', prop: 'value', expr: 'x' }),
    ).toBe('el.value = x;');
  });

  it('renders setStyle with camelCase key', () => {
    expect(
      renderCommand({ type: 'setStyle', target: 'el', key: 'borderColor', expr: '"red"' }),
    ).toBe('el.style.borderColor = "red";');
  });

  it('renders appendChild and remove', () => {
    expect(renderCommand({ type: 'appendChild', parent: 'p', child: 'c' })).toBe(
      'p.appendChild(c);',
    );
    expect(renderCommand({ type: 'remove', target: 'el' })).toBe('el.remove();');
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

describe('jQuery / $ exclusion (Req 1.5, 7.1)', () => {
  it('does not emit jQuery or $ for any command variant', () => {
    const selector = '#foo .bar $special';
    const cmds: VanillaCommand[] = [
      {
        type: 'addEventListener',
        target: 'document',
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
      { type: 'classListToggle', target: 'el', name: 'done' },
      { type: 'classListAdd', target: 'el', name: 'done' },
      { type: 'classListRemove', target: 'el', name: 'done' },
      { type: 'setProp', target: 'el', prop: 'textContent', expr: '"hi"' },
      { type: 'setStyle', target: 'el', key: 'color', expr: '"red"' },
      { type: 'appendChild', parent: 'p', child: 'c' },
      { type: 'remove', target: 'el' },
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
