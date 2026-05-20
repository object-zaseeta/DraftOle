/**
 * `ElementTarget` 判別共用体の型・narrowing 確認テスト。
 *
 * Task 5.2: 型定義ファイル単独で型チェックが通ることと、
 * `kind` discriminator による narrowing が機能することを検証する。
 *
 * Requirements: 4.1, 4.2, 4.4, 4.5
 */

import { describe, expect, it } from 'vitest';
import type {
  ClosureRefTarget,
  DeferredSelfTarget,
  ElementTarget,
  SelectorTarget,
} from '../../../src/js/vanilla/element-target.js';

describe('ElementTarget discriminated union', () => {
  it('selector バリアントが構築でき、narrowing で selector を取り出せる', () => {
    const target: ElementTarget = { kind: 'sel', selector: '#app' };

    // narrowing が compile-time に効くことを確認しつつ runtime でも検証
    if (target.kind === 'sel') {
      const narrowed: SelectorTarget = target;
      expect(narrowed.selector).toBe('#app');
    } else {
      // ここに到達したら narrowing or 構築が失敗している
      throw new Error('expected selector variant');
    }
  });

  it('closure-ref バリアントが構築でき、narrowing で varName を取り出せる', () => {
    const target: ElementTarget = { kind: 'closure-ref', varName: '_e0' };

    if (target.kind === 'closure-ref') {
      const narrowed: ClosureRefTarget = target;
      expect(narrowed.varName).toBe('_e0');
    } else {
      throw new Error('expected closure-ref variant');
    }
  });

  it('既存 selector バリアントの構造（後方互換）が維持されている', () => {
    // 後方互換: `{ kind: 'sel', selector: string }` の形を変えていないこと
    const legacyShape = { kind: 'sel' as const, selector: '.btn' };
    const asTarget: ElementTarget = legacyShape;
    expect(asTarget.kind).toBe('sel');
    if (asTarget.kind === 'sel') {
      expect(asTarget.selector).toBe('.btn');
    }
  });

  it('deferred-self バリアントが構築でき、ElementTarget 型として代入可能である', () => {
    const target: ElementTarget = { kind: 'deferred-self' };

    if (target.kind === 'deferred-self') {
      const narrowed: DeferredSelfTarget = target;
      expect(narrowed.kind).toBe('deferred-self');
    } else {
      throw new Error('expected deferred-self variant');
    }
  });

  it('kind による分岐が網羅的に書ける（exhaustiveness）', () => {
    const describeTarget = (t: ElementTarget): string => {
      switch (t.kind) {
        case 'sel':
          return `sel:${t.selector}`;
        case 'closure-ref':
          return `ref:${t.varName}`;
        case 'deferred-self':
          return 'deferred-self';
        default: {
          // 網羅されていれば never 型になる
          const _exhaustive: never = t;
          return _exhaustive;
        }
      }
    };

    expect(describeTarget({ kind: 'sel', selector: '#x' })).toBe('sel:#x');
    expect(describeTarget({ kind: 'closure-ref', varName: '_e1' })).toBe(
      'ref:_e1',
    );
    expect(describeTarget({ kind: 'deferred-self' })).toBe('deferred-self');
  });
});
