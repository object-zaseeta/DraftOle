/**
 * `renderCommand()` の reactive-state 新種別（state-init / state-set / state-update /
 * bind-text / bind-value / bind-class-all / bind-class-add / bind-style / bind-attr / bind-each）
 * の JS 出力を検証するテスト。
 *
 * 対応 requirements: 2.2, 4.1–4.7, 5.1
 * 対応 design.md セクション: 「renderCommand() の新 case 出力例」「ElementTarget の JS 変換」
 */

import { describe, expect, it } from 'vitest';

import {
  renderCommand,
  type EachTemplateSnapshot,
  type ElementTarget,
  type VanillaCommand,
} from '../../../src/js/vanilla/commands.ts';

// JsExpr のモック（code プロパティを持つ最小実装）
function jsExpr(code: string) {
  return {
    __jsExpr: true as const,
    code,
    eq: () => { throw new Error('not needed'); },
    ne: () => { throw new Error('not needed'); },
    or: () => { throw new Error('not needed'); },
    trim: () => { throw new Error('not needed'); },
    isFalsy: () => { throw new Error('not needed'); },
    isTruthy: () => { throw new Error('not needed'); },
  };
}

// ElementTarget のヘルパー
const varTarget = (name: string): ElementTarget => ({ kind: 'closure-ref', varName: name });
const selTarget = (selector: string): ElementTarget => ({ kind: 'sel', selector });

// ──────────────────────────────────────────────────────────────────────────────
// state-init
// ──────────────────────────────────────────────────────────────────────────────
describe('renderCommand: state-init', () => {
  it('renders initState call with quoted id and numeric initial', () => {
    const cmd: VanillaCommand = {
      type: 'state-init',
      id: 's0',
      initial: jsExpr('0'),
    };
    expect(renderCommand(cmd)).toBe('__draftole__.initState("s0", 0);');
  });

  it('renders initState call with string initial expression', () => {
    const cmd: VanillaCommand = {
      type: 'state-init',
      id: 'draft',
      initial: jsExpr('""'),
    };
    expect(renderCommand(cmd)).toBe('__draftole__.initState("draft", "");');
  });

  it('renders initState with array initial expression', () => {
    const cmd: VanillaCommand = {
      type: 'state-init',
      id: 'todos',
      initial: jsExpr('[]'),
    };
    expect(renderCommand(cmd)).toBe('__draftole__.initState("todos", []);');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// state-set
// ──────────────────────────────────────────────────────────────────────────────
describe('renderCommand: state-set', () => {
  it('renders state set call', () => {
    const cmd: VanillaCommand = {
      type: 'state-set',
      id: 's0',
      value: jsExpr('value'),
    };
    expect(renderCommand(cmd)).toBe('__draftole__.state("s0").set(value);');
  });

  it('renders state set with quoted string value', () => {
    const cmd: VanillaCommand = {
      type: 'state-set',
      id: 'draft',
      value: jsExpr('"hello"'),
    };
    expect(renderCommand(cmd)).toBe('__draftole__.state("draft").set("hello");');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// state-update
// ──────────────────────────────────────────────────────────────────────────────
describe('renderCommand: state-update', () => {
  it('renders state update call', () => {
    const cmd: VanillaCommand = {
      type: 'state-update',
      id: 's0',
      body: jsExpr('body'),
    };
    expect(renderCommand(cmd)).toBe('__draftole__.state("s0").update(body);');
  });

  it('renders state update with arrow function body', () => {
    const cmd: VanillaCommand = {
      type: 'state-update',
      id: 'count',
      body: jsExpr('(n) => n + 1'),
    };
    expect(renderCommand(cmd)).toBe('__draftole__.state("count").update((n) => n + 1);');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// bind-text
// ──────────────────────────────────────────────────────────────────────────────
describe('renderCommand: bind-text', () => {
  it('renders bindText with var target and stateId, without transform', () => {
    const cmd: VanillaCommand = {
      type: 'bind-text',
      target: varTarget('el'),
      stateId: 's0',
    };
    expect(renderCommand(cmd)).toBe('__draftole__.bindText(el, "s0");');
  });

  it('renders bindText with var target, stateId and transform', () => {
    const cmd: VanillaCommand = {
      type: 'bind-text',
      target: varTarget('target'),
      stateId: 's0',
      transform: jsExpr('transform'),
    };
    expect(renderCommand(cmd)).toBe('__draftole__.bindText(target, "s0", transform);');
  });

  it('renders bindText with sel target (document.querySelector)', () => {
    const cmd: VanillaCommand = {
      type: 'bind-text',
      target: selTarget('#app'),
      stateId: 's0',
    };
    expect(renderCommand(cmd)).toBe('__draftole__.bindText(document.querySelector("#app"), "s0");');
  });

  it('renders bindText with sel target and transform', () => {
    const cmd: VanillaCommand = {
      type: 'bind-text',
      target: selTarget('.counter'),
      stateId: 'count',
      transform: jsExpr('(n) => String(n)'),
    };
    expect(renderCommand(cmd)).toBe(
      '__draftole__.bindText(document.querySelector(".counter"), "count", (n) => String(n));',
    );
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// bind-value
// ──────────────────────────────────────────────────────────────────────────────
describe('renderCommand: bind-value', () => {
  it('renders bindValue with var target (no transform)', () => {
    const cmd: VanillaCommand = {
      type: 'bind-value',
      target: varTarget('input'),
      stateId: 's0',
    };
    // design.md: bind-value → __draftole__.bindValue(target, "s0");
    expect(renderCommand(cmd)).toBe('__draftole__.bindValue(input, "s0");');
  });

  it('renders bindValue with sel target', () => {
    const cmd: VanillaCommand = {
      type: 'bind-value',
      target: selTarget('#input'),
      stateId: 'draft',
    };
    expect(renderCommand(cmd)).toBe('__draftole__.bindValue(document.querySelector("#input"), "draft");');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// bind-class-all
// ──────────────────────────────────────────────────────────────────────────────
describe('renderCommand: bind-class-all', () => {
  it('renders bindClassAll without transform', () => {
    const cmd: VanillaCommand = {
      type: 'bind-class-all',
      target: varTarget('el'),
      stateId: 's0',
    };
    expect(renderCommand(cmd)).toBe('__draftole__.bindClassAll(el, "s0");');
  });

  it('renders bindClassAll with transform', () => {
    const cmd: VanillaCommand = {
      type: 'bind-class-all',
      target: varTarget('el'),
      stateId: 's0',
      transform: jsExpr('transform'),
    };
    expect(renderCommand(cmd)).toBe('__draftole__.bindClassAll(el, "s0", transform);');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// bind-class-add
// ──────────────────────────────────────────────────────────────────────────────
describe('renderCommand: bind-class-add', () => {
  it('renders bindClassAdd without transform', () => {
    const cmd: VanillaCommand = {
      type: 'bind-class-add',
      target: varTarget('el'),
      stateId: 's0',
    };
    expect(renderCommand(cmd)).toBe('__draftole__.bindClassAdd(el, "s0");');
  });

  it('renders bindClassAdd with transform', () => {
    const cmd: VanillaCommand = {
      type: 'bind-class-add',
      target: varTarget('el'),
      stateId: 's0',
      transform: jsExpr('transform'),
    };
    expect(renderCommand(cmd)).toBe('__draftole__.bindClassAdd(el, "s0", transform);');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// bind-style
// ──────────────────────────────────────────────────────────────────────────────
describe('renderCommand: bind-style', () => {
  it('renders bindStyle with var target and prop, without transform', () => {
    const cmd: VanillaCommand = {
      type: 'bind-style',
      target: varTarget('el'),
      prop: 'color',
      stateId: 's0',
    };
    expect(renderCommand(cmd)).toBe('__draftole__.bindStyle(el, "color", "s0");');
  });

  it('renders bindStyle with transform', () => {
    const cmd: VanillaCommand = {
      type: 'bind-style',
      target: varTarget('target'),
      prop: 'prop',
      stateId: 's0',
      transform: jsExpr('transform'),
    };
    expect(renderCommand(cmd)).toBe('__draftole__.bindStyle(target, "prop", "s0", transform);');
  });

  it('renders bindStyle with sel target', () => {
    const cmd: VanillaCommand = {
      type: 'bind-style',
      target: selTarget('#box'),
      prop: 'backgroundColor',
      stateId: 'color',
    };
    expect(renderCommand(cmd)).toBe(
      '__draftole__.bindStyle(document.querySelector("#box"), "backgroundColor", "color");',
    );
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// bind-attr
// ──────────────────────────────────────────────────────────────────────────────
describe('renderCommand: bind-attr', () => {
  it('renders bindAttr with var target, attr and stateId, without transform', () => {
    const cmd: VanillaCommand = {
      type: 'bind-attr',
      target: varTarget('el'),
      attr: 'href',
      stateId: 's0',
    };
    expect(renderCommand(cmd)).toBe('__draftole__.bindAttr(el, "href", "s0");');
  });

  it('renders bindAttr with transform', () => {
    const cmd: VanillaCommand = {
      type: 'bind-attr',
      target: varTarget('target'),
      attr: 'attr',
      stateId: 's0',
      transform: jsExpr('transform'),
    };
    expect(renderCommand(cmd)).toBe('__draftole__.bindAttr(target, "attr", "s0", transform);');
  });

  it('renders bindAttr with sel target', () => {
    const cmd: VanillaCommand = {
      type: 'bind-attr',
      target: selTarget('a.link'),
      attr: 'href',
      stateId: 'url',
    };
    expect(renderCommand(cmd)).toBe(
      '__draftole__.bindAttr(document.querySelector("a.link"), "href", "url");',
    );
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// bind-each
// ──────────────────────────────────────────────────────────────────────────────
describe('renderCommand: bind-each', () => {
  it('renders bindEach with var target and factory placeholder', () => {
    const template: EachTemplateSnapshot = {
      itemStateIdPattern: 'todos.item{i}',
      templateCommands: [],
    };
    const cmd: VanillaCommand = {
      type: 'bind-each',
      target: varTarget('target'),
      stateId: 's0',
      template,
    };
    const result = renderCommand(cmd);
    expect(result).toContain('__draftole__.bindEach(target, "s0",');
    // タスク 3.2: factory は簡易版として function(itemId, idx) { ... } 形式で出力される
    expect(result).toContain('function(itemId, idx)');
  });

  it('renders bindEach with sel target', () => {
    const template: EachTemplateSnapshot = {
      itemStateIdPattern: 'list.item{i}',
      templateCommands: [],
    };
    const cmd: VanillaCommand = {
      type: 'bind-each',
      target: selTarget('#list'),
      stateId: 'items',
      template,
    };
    const result = renderCommand(cmd);
    expect(result).toContain('__draftole__.bindEach(document.querySelector("#list"), "items",');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// ElementTarget 変換（共通）
// ──────────────────────────────────────────────────────────────────────────────
describe('ElementTarget JS rendering', () => {
  it('var target renders as variable name directly', () => {
    const cmd: VanillaCommand = {
      type: 'bind-text',
      target: { kind: 'closure-ref', varName: 'myEl' },
      stateId: 's0',
    };
    expect(renderCommand(cmd)).toBe('__draftole__.bindText(myEl, "s0");');
  });

  it('sel target renders as document.querySelector call with quoted selector', () => {
    const cmd: VanillaCommand = {
      type: 'bind-text',
      target: { kind: 'sel', selector: '#my-app' },
      stateId: 's0',
    };
    expect(renderCommand(cmd)).toBe('__draftole__.bindText(document.querySelector("#my-app"), "s0");');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 出力に jQuery / $ を含まないことの検証
// ──────────────────────────────────────────────────────────────────────────────
describe('jQuery / $ exclusion in reactive-state commands', () => {
  it('does not emit jQuery or $ for any new command variant', () => {
    const template: EachTemplateSnapshot = {
      itemStateIdPattern: 'list.item{i}',
      templateCommands: [],
    };
    const cmds: VanillaCommand[] = [
      { type: 'state-init', id: 's0', initial: jsExpr('0') },
      { type: 'state-set', id: 's0', value: jsExpr('value') },
      { type: 'state-update', id: 's0', body: jsExpr('body') },
      { type: 'bind-text', target: varTarget('el'), stateId: 's0' },
      { type: 'bind-value', target: varTarget('el'), stateId: 's0' },
      { type: 'bind-class-all', target: varTarget('el'), stateId: 's0' },
      { type: 'bind-class-add', target: varTarget('el'), stateId: 's0' },
      { type: 'bind-style', target: varTarget('el'), prop: 'color', stateId: 's0' },
      { type: 'bind-attr', target: varTarget('el'), attr: 'href', stateId: 's0' },
      { type: 'bind-each', target: varTarget('el'), stateId: 's0', template },
    ];

    for (const cmd of cmds) {
      const out = renderCommand(cmd);
      expect(out).not.toMatch(/\bjQuery\b/);
      const stripped = out
        .replace(/"(?:[^"\\]|\\.)*"/g, '""')
        .replace(/'(?:[^'\\]|\\.)*'/g, "''");
      expect(stripped).not.toMatch(/(^|[^A-Za-z0-9_])\$(?![A-Za-z0-9_])/);
    }
  });
});
