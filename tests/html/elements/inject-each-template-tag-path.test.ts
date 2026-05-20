/**
 * each-modifier-css-extraction Task 1.1: injectEachTemplateTagPath 単体テスト
 *
 * Requirements: 1.2
 */
import { describe, it, expect } from 'vitest';
import { injectEachTemplateTagPath } from '../../../src/html/elements/each-factory-resolver.js';
import type { EachTemplateSnapshot } from '../../../src/js/vanilla/state/each-template.js';

function makeSnapshot(initialTagPath: string = ''): EachTemplateSnapshot {
  const fakeRoot = {
    _css: { tagPath: initialTagPath },
  };
  return {
    itemStateIdPattern: 'parent.item{i}',
    templateCommands: [],
    _templateRoot: fakeRoot as EachTemplateSnapshot['_templateRoot'],
  };
}

function getInjectedPath(snapshot: EachTemplateSnapshot): string {
  const tr = snapshot._templateRoot as { _css: { tagPath: string } } | undefined;
  return tr?._css.tagPath ?? '';
}

describe('injectEachTemplateTagPath', () => {
  it('初回呼び出しで tagPath = `${parentTagPath}.each${ordinal}` を設定する', () => {
    const snapshot = makeSnapshot();
    injectEachTemplateTagPath(snapshot, 'root.div0', 0);
    expect(getInjectedPath(snapshot)).toBe('root.div0.each0');
  });

  it('ordinal で連番が反映される', () => {
    const snapshot = makeSnapshot();
    injectEachTemplateTagPath(snapshot, 'root.div0', 3);
    expect(getInjectedPath(snapshot)).toBe('root.div0.each3');
  });

  it('parentTagPath が空文字でも動作する', () => {
    const snapshot = makeSnapshot();
    injectEachTemplateTagPath(snapshot, '', 0);
    expect(getInjectedPath(snapshot)).toBe('.each0');
  });

  it('同一引数で複数回呼び出されても tagPath は変わらない（冪等）', () => {
    const snapshot = makeSnapshot();
    injectEachTemplateTagPath(snapshot, 'root.div0', 0);
    injectEachTemplateTagPath(snapshot, 'root.div0', 0);
    injectEachTemplateTagPath(snapshot, 'root.div0', 0);
    expect(getInjectedPath(snapshot)).toBe('root.div0.each0');
  });

  it('既設定済み tagPath と異なる target を渡すと throw する（fail-loud）', () => {
    const snapshot = makeSnapshot('root.div0.each0');
    expect(() =>
      injectEachTemplateTagPath(snapshot, 'root.div0', 1),
    ).toThrow(/tagPath conflict/);
  });

  it('_templateRoot が undefined の場合は no-op で throw しない', () => {
    const snapshot: EachTemplateSnapshot = {
      itemStateIdPattern: 'parent.item{i}',
      templateCommands: [],
    };
    expect(() => injectEachTemplateTagPath(snapshot, 'root', 0)).not.toThrow();
  });
});
