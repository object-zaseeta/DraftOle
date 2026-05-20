/**
 * renderCommand の legacy emission を renderElementTarget 経由に統一する検証テスト。
 *
 * renderElementTarget({kind:'sel',selector:'#x'}) が `document.querySelector("#x")` を返すことで、
 * 旧 `${cmd.target}` 文字列埋め込みと byte-identical な出力になることを確認する。
 */

import { describe, expect, it } from 'vitest';
import { renderCommand } from '../../../src/js/vanilla/commands.js';

describe('renderCommand — renderElementTarget 経由の legacy emission 統一', () => {
  it('1. addEventListener with sel target', () => {
    const result = renderCommand({
      type: 'addEventListener',
      target: { kind: 'sel', selector: '#my-btn' },
      event: 'click',
      handlerCode: '() => {}',
    });
    expect(result).toBe('document.querySelector("#my-btn").addEventListener("click", () => {});');
  });

  it('2. classListAdd with sel target', () => {
    expect(
      renderCommand({ type: 'classListAdd', target: { kind: 'sel', selector: '#el' }, name: 'active' }),
    ).toBe('document.querySelector("#el").classList.add("active");');
  });

  it('3. classListRemove with sel target', () => {
    expect(
      renderCommand({ type: 'classListRemove', target: { kind: 'sel', selector: '#el' }, name: 'disabled' }),
    ).toBe('document.querySelector("#el").classList.remove("disabled");');
  });

  it('4. classListToggle with sel target', () => {
    expect(
      renderCommand({ type: 'classListToggle', target: { kind: 'sel', selector: '#el' }, name: 'open' }),
    ).toBe('document.querySelector("#el").classList.toggle("open");');
  });

  it('5. setProp textContent with sel target', () => {
    expect(
      renderCommand({ type: 'setProp', target: { kind: 'sel', selector: '#text' }, prop: 'textContent', expr: '"hello"' }),
    ).toBe('document.querySelector("#text").textContent = "hello";');
  });

  it('6. setStyle with sel target', () => {
    expect(
      renderCommand({ type: 'setStyle', target: { kind: 'sel', selector: '#box' }, key: 'color', expr: '"red"' }),
    ).toBe('document.querySelector("#box").style.color = "red";');
  });

  it('7. remove with sel target', () => {
    expect(
      renderCommand({ type: 'remove', target: { kind: 'sel', selector: '#item' } }),
    ).toBe('document.querySelector("#item").remove();');
  });

  it('8. closure-ref target byte-equality', () => {
    expect(
      renderCommand({ type: 'classListAdd', target: { kind: 'closure-ref', varName: '_e0' }, name: 'active' }),
    ).toBe('_e0.classList.add("active");');
  });
});
