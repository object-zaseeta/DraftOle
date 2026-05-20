/**
 * VanillaCommand `handler-body` 種別のテスト。
 * Req 4.1, 4.4 に対応。
 */

import { describe, it, expect } from 'vitest';
import { renderCommand } from '../../../src/js/vanilla/commands.js';
import type { VanillaCommand } from '../../../src/js/vanilla/commands.js';

describe('renderCommand / handler-body', () => {
  it('引数なし: addEventListener に空の params リストを出力する', () => {
    const cmd: VanillaCommand = {
      type: 'handler-body',
      target: { kind: 'closure-ref', varName: 'el' },
      event: 'click',
      code: 'console.log(1)',
      params: [],
    };
    expect(renderCommand(cmd)).toBe(
      'el.addEventListener("click", function() { console.log(1) });',
    );
  });

  it('引数 1 個: addEventListener に宣言した引数名をそのまま出力する（Req 4.4）', () => {
    const cmd: VanillaCommand = {
      type: 'handler-body',
      target: { kind: 'closure-ref', varName: 'el' },
      event: 'input',
      code: 'state.set(e.target.value)',
      params: ['e'],
    };
    expect(renderCommand(cmd)).toBe(
      'el.addEventListener("input", function(e) { state.set(e.target.value) });',
    );
  });

  it('セレクタターゲット + コード空: querySelector を使い空本体を出力する', () => {
    const cmd: VanillaCommand = {
      type: 'handler-body',
      target: { kind: 'sel', selector: '#btn' },
      event: 'click',
      code: '',
      params: [],
    };
    expect(renderCommand(cmd)).toBe(
      'document.querySelector("#btn").addEventListener("click", function() {  });',
    );
  });
});
