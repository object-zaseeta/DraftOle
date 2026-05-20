import { describe, expect, it } from 'vitest';
import * as ViewModule from '../../src/view/index.js';

/**
 * Task 3.1: `view/index.ts` の公開エクスポートから runtime シンボルが漏れないことを保証する。
 *
 * 観測可能な完了状態: `import * as ViewModule` した結果の `Object.keys` が
 * ホワイトリストと一致すること（runtime シンボルのみ; 型 export は erase される）。
 *
 * 対応 requirement: 1.1, 1.2, 3.1, 6.1 (page-runtime-separation-spec)
 */
describe('view/index.ts public surface', () => {
  const RUNTIME_WHITELIST = [
    'page',
    'PageDocument',
    'Button',
    'Heading',
    'HStack',
    'Image',
    'Link',
    'Section',
    'Spacer',
    'Text',
    'VStack',
    'AppSlot',
  ].sort();

  const FORBIDDEN_RUNTIME_KEYS = ['state', 'script', '$', '$$', 'jqm', 'bind', 'bindText', 'bindAttr', 'bindClass'];

  it('Object.keys が runtime ホワイトリストと完全一致する', () => {
    const actualKeys = Object.keys(ViewModule).sort();
    expect(actualKeys).toEqual(RUNTIME_WHITELIST);
  });

  it.each(FORBIDDEN_RUNTIME_KEYS)('runtime シンボル %s が露出していない', (key) => {
    expect(Object.keys(ViewModule)).not.toContain(key);
  });
});
