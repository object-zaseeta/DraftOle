/**
 * `renderElementTarget` ガードの振る舞いテスト（Task 1.3）。
 *
 * `renderElementTarget` は `commands.ts` の非 export 内部関数のため、
 * `renderCommand` 経由で間接的に検証する。
 *
 * 対応 requirement: 1.1, 1.2, 1.3, 1.4
 * 対応 design.md セクション: 「renderElementTarget ガード」
 */

import { describe, expect, it } from 'vitest';

import { renderCommand } from '../../../src/js/vanilla/commands.js';

describe('renderElementTarget ガード', () => {
  it('deferred-self ターゲットを持つコマンドを render すると TypeError を throw する', () => {
    expect(() =>
      renderCommand({
        type: 'classListAdd',
        target: { kind: 'deferred-self' },
        name: 'foo',
      }),
    ).toThrow(TypeError);
  });

  it('deferred-self throw のエラーメッセージに "deferred-self" が含まれる', () => {
    expect(() =>
      renderCommand({
        type: 'addEventListener',
        target: { kind: 'deferred-self' },
        event: 'click',
        handlerCode: '() => {}',
      }),
    ).toThrow(/deferred-self/);
  });

  it('sel ターゲットが document.querySelector("…") を byte-identical に出力する（Req 3.1）', () => {
    const result = renderCommand({
      type: 'classListAdd',
      target: { kind: 'sel', selector: '#x' },
      name: 'foo',
    });
    expect(result).toBe('document.querySelector("#x").classList.add("foo");');
  });

  it('closure-ref ターゲットが変数名をそのまま出力する', () => {
    const result = renderCommand({
      type: 'classListAdd',
      target: { kind: 'closure-ref', varName: '_e0' },
      name: 'foo',
    });
    expect(result).toBe('_e0.classList.add("foo");');
  });
});
