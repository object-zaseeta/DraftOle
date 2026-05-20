/**
 * Task 7.2: LazyLayoutManager -- 遅延レイアウト解決のテスト
 *
 * TDD RED phase: LazyLayoutManager の全メソッド・エッジケースを検証する。
 * - LayoutRegisteredItem の登録・管理
 * - resolveAllLayout() による全レイアウトの一括解決
 * - 依存関係のある配置計算の遅延評価
 * - 親要素サイズ確定時の子要素相対位置の解決
 * - 循環依存の検出（訪問済みパス追跡）とエラー通知
 *
 * Requirements: 2.3, 2.4, 2.5
 */
import { describe, it, expect } from 'vitest';
import { LazyLayoutManager } from '../../../../src/css/layout/lazy-layout/lazy-layout-manager.js';
import type { LayoutRegisteredItem } from '../../../../src/css/layout/lazy-layout/registered-item.js';

// ============================================================
// ヘルパー
// ============================================================

function makeSUT(): LazyLayoutManager {
  return new LazyLayoutManager();
}

function makeItem(overrides: Partial<LayoutRegisteredItem> = {}): LayoutRegisteredItem {
  return {
    relationShip: 'absolute',
    baseTagPath: 'root.div1',
    basePosition: 'top',
    targetTagPath: undefined,
    targetPosition: 'top',
    value: { value: 100, unit: 'px' },
    ...overrides,
  };
}

// ============================================================
// LazyLayoutManager
// ============================================================

describe('LazyLayoutManager', () => {
  // ── 初期状態 ──

  describe('初期状態', () => {
    it('初期化時にアイテムが空で、renderAllItems() は空文字列を返す', () => {
      const sut = makeSUT();
      expect(sut.renderAllItems()).toBe('');
    });

    it('初期化時に renderItemsBy() は空文字列を返す', () => {
      const sut = makeSUT();
      expect(sut.renderItemsBy('root.div1')).toBe('');
    });

    it('初期化時に getRelationShip() は undefined を返す', () => {
      const sut = makeSUT();
      expect(sut.getRelationShip('root.div1')).toBeUndefined();
    });
  });

  // ── LazyLayoutRegister 準拠 ──

  describe('LazyLayoutRegister準拠', () => {
    it('registerItem メソッドを持つ', () => {
      const sut = makeSUT();
      expect(typeof sut.registerItem).toBe('function');
    });

    it('getRelationShip メソッドを持つ', () => {
      const sut = makeSUT();
      expect(typeof sut.getRelationShip).toBe('function');
    });

    it('renderItemsBy メソッドを持つ', () => {
      const sut = makeSUT();
      expect(typeof sut.renderItemsBy).toBe('function');
    });

    it('renderAllItems メソッドを持つ', () => {
      const sut = makeSUT();
      expect(typeof sut.renderAllItems).toBe('function');
    });

    it('resolveAllLayout メソッドを持つ', () => {
      const sut = makeSUT();
      expect(typeof sut.resolveAllLayout).toBe('function');
    });
  });

  // ── registerItem ──

  describe('registerItem', () => {
    it('アイテムを登録できる', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem());
      expect(sut.renderAllItems()).not.toBe('');
    });

    it('複数アイテムを登録できる', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({ baseTagPath: 'root.div1', basePosition: 'top' }));
      sut.registerItem(makeItem({ baseTagPath: 'root.div2', basePosition: 'left' }));

      const rendered = sut.renderAllItems();
      expect(rendered).toContain('top');
      expect(rendered).toContain('left');
    });

    it('同一tagPathで複数アイテムを登録できる', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({ baseTagPath: 'root.div1', basePosition: 'top', value: { value: 10, unit: 'px' } }));
      sut.registerItem(makeItem({ baseTagPath: 'root.div1', basePosition: 'left', value: { value: 20, unit: 'px' } }));

      const rendered = sut.renderItemsBy('root.div1');
      expect(rendered).toContain('top: 10px');
      expect(rendered).toContain('left: 20px');
    });
  });

  // ── getRelationShip ──

  describe('getRelationShip', () => {
    it('登録済み tagPath の RelationShip を返す', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({ baseTagPath: 'root.div1', relationShip: 'absolute' }));
      expect(sut.getRelationShip('root.div1')).toBe('absolute');
    });

    it('未登録 tagPath の場合 undefined を返す', () => {
      const sut = makeSUT();
      expect(sut.getRelationShip('root.nonexistent')).toBeUndefined();
    });

    it('同一 tagPath で複数アイテムがある場合、最初の RelationShip を返す', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({ baseTagPath: 'root.div1', relationShip: 'absolute', basePosition: 'top' }));
      sut.registerItem(makeItem({ baseTagPath: 'root.div1', relationShip: 'relative', basePosition: 'left' }));
      expect(sut.getRelationShip('root.div1')).toBe('absolute');
    });

    it('異なる tagPath の RelationShip は返さない', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({ baseTagPath: 'root.div1', relationShip: 'absolute' }));
      expect(sut.getRelationShip('root.div2')).toBeUndefined();
    });
  });

  // ── resolveAllLayout ──

  describe('resolveAllLayout', () => {
    it('値が設定済みのアイテムはそのまま保持される', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'top',
        value: { value: 100, unit: 'px' },
      }));
      sut.resolveAllLayout();
      expect(sut.renderItemsBy('root.div1')).toContain('100px');
    });

    it('依存先の値が解決される（直接参照）', () => {
      const sut = makeSUT();
      // div1: top = 100px（値あり）
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'top',
        value: { value: 100, unit: 'px' },
      }));
      // div2: top = div1 の top を参照（値なし）
      sut.registerItem(makeItem({
        baseTagPath: 'root.div2',
        basePosition: 'top',
        targetTagPath: 'root.div1',
        targetPosition: 'top',
        value: undefined,
      }));

      sut.resolveAllLayout();
      const rendered = sut.renderItemsBy('root.div2');
      expect(rendered).toContain('100px');
    });

    it('依存チェーンが解決される（間接参照: div3 → div2 → div1）', () => {
      const sut = makeSUT();
      // div1: top = 200px（値あり）
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'top',
        value: { value: 200, unit: 'px' },
      }));
      // div2: top = div1 の top を参照（値なし）
      sut.registerItem(makeItem({
        baseTagPath: 'root.div2',
        basePosition: 'top',
        targetTagPath: 'root.div1',
        targetPosition: 'top',
        value: undefined,
      }));
      // div3: top = div2 の top を参照（値なし）
      sut.registerItem(makeItem({
        baseTagPath: 'root.div3',
        basePosition: 'top',
        targetTagPath: 'root.div2',
        targetPosition: 'top',
        value: undefined,
      }));

      sut.resolveAllLayout();
      expect(sut.renderItemsBy('root.div3')).toContain('200px');
    });

    it('親要素サイズ確定後に子要素の相対位置が解決される', () => {
      const sut = makeSUT();
      // 親: width = 800px
      sut.registerItem(makeItem({
        baseTagPath: 'root.parent',
        basePosition: 'left',
        value: { value: 800, unit: 'px' },
      }));
      // 子: left = 親の left を参照
      sut.registerItem(makeItem({
        baseTagPath: 'root.parent.child',
        basePosition: 'left',
        targetTagPath: 'root.parent',
        targetPosition: 'left',
        value: undefined,
      }));

      sut.resolveAllLayout();
      expect(sut.renderItemsBy('root.parent.child')).toContain('800px');
    });

    it('循環依存が検出された場合、エラーを throw する', () => {
      const sut = makeSUT();
      // div1: top = div2 を参照
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'top',
        targetTagPath: 'root.div2',
        targetPosition: 'top',
        value: undefined,
      }));
      // div2: top = div1 を参照（循環）
      sut.registerItem(makeItem({
        baseTagPath: 'root.div2',
        basePosition: 'top',
        targetTagPath: 'root.div1',
        targetPosition: 'top',
        value: undefined,
      }));

      expect(() => sut.resolveAllLayout()).toThrow();
    });

    it('循環依存エラーにパス情報が含まれる', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'top',
        targetTagPath: 'root.div2',
        targetPosition: 'top',
        value: undefined,
      }));
      sut.registerItem(makeItem({
        baseTagPath: 'root.div2',
        basePosition: 'top',
        targetTagPath: 'root.div1',
        targetPosition: 'top',
        value: undefined,
      }));

      expect(() => sut.resolveAllLayout()).toThrow(/Circular dependency detected/);
    });

    it('3要素の循環依存を検出する（A → B → C → A）', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({
        baseTagPath: 'root.a',
        basePosition: 'top',
        targetTagPath: 'root.b',
        targetPosition: 'top',
        value: undefined,
      }));
      sut.registerItem(makeItem({
        baseTagPath: 'root.b',
        basePosition: 'top',
        targetTagPath: 'root.c',
        targetPosition: 'top',
        value: undefined,
      }));
      sut.registerItem(makeItem({
        baseTagPath: 'root.c',
        basePosition: 'top',
        targetTagPath: 'root.a',
        targetPosition: 'top',
        value: undefined,
      }));

      expect(() => sut.resolveAllLayout()).toThrow();
    });

    it('ターゲットが存在しない場合、値は未解決のまま（エラーなし）', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'top',
        targetTagPath: 'root.nonexistent',
        targetPosition: 'top',
        value: undefined,
      }));

      // ターゲット未存在はエラーにならない
      expect(() => sut.resolveAllLayout()).not.toThrow();
      // 値は未解決なので空
      expect(sut.renderItemsBy('root.div1')).toBe('');
    });

    it('targetTagPath が undefined の場合、値は未解決のまま', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'top',
        targetTagPath: undefined,
        targetPosition: 'top',
        value: undefined,
      }));

      expect(() => sut.resolveAllLayout()).not.toThrow();
      expect(sut.renderItemsBy('root.div1')).toBe('');
    });

    it('ポジションが一致しない参照先は解決されない', () => {
      const sut = makeSUT();
      // div1: left = 50px
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'left',
        value: { value: 50, unit: 'px' },
      }));
      // div2: top = div1 の top を参照（div1 には top がない）
      sut.registerItem(makeItem({
        baseTagPath: 'root.div2',
        basePosition: 'top',
        targetTagPath: 'root.div1',
        targetPosition: 'top',
        value: undefined,
      }));

      expect(() => sut.resolveAllLayout()).not.toThrow();
      expect(sut.renderItemsBy('root.div2')).toBe('');
    });

    it('複数のポジションを個別に解決できる', () => {
      const sut = makeSUT();
      // div1: top = 10px, left = 20px
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'top',
        value: { value: 10, unit: 'px' },
      }));
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'left',
        value: { value: 20, unit: 'px' },
      }));
      // div2: top = div1.top, left = div1.left
      sut.registerItem(makeItem({
        baseTagPath: 'root.div2',
        basePosition: 'top',
        targetTagPath: 'root.div1',
        targetPosition: 'top',
        value: undefined,
      }));
      sut.registerItem(makeItem({
        baseTagPath: 'root.div2',
        basePosition: 'left',
        targetTagPath: 'root.div1',
        targetPosition: 'left',
        value: undefined,
      }));

      sut.resolveAllLayout();
      const rendered = sut.renderItemsBy('root.div2');
      expect(rendered).toContain('top: 10px');
      expect(rendered).toContain('left: 20px');
    });
  });

  // ── renderItemsBy ──

  describe('renderItemsBy', () => {
    it('指定 tagPath のアイテムのみレンダリングする', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'top',
        value: { value: 10, unit: 'px' },
      }));
      sut.registerItem(makeItem({
        baseTagPath: 'root.div2',
        basePosition: 'left',
        value: { value: 20, unit: 'px' },
      }));

      const rendered = sut.renderItemsBy('root.div1');
      expect(rendered).toContain('top: 10px');
      expect(rendered).not.toContain('left: 20px');
    });

    it('position プロパティを含まない', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'top',
        relationShip: 'absolute',
        value: { value: 10, unit: 'px' },
      }));

      const rendered = sut.renderItemsBy('root.div1');
      expect(rendered).not.toContain('position');
    });

    it('値が undefined のアイテムはスキップされる', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'top',
        value: undefined,
      }));

      expect(sut.renderItemsBy('root.div1')).toBe('');
    });

    it('アイテムが存在しない tagPath は空文字列を返す', () => {
      const sut = makeSUT();
      expect(sut.renderItemsBy('root.nonexistent')).toBe('');
    });

    it('basePosition が none のアイテムはスキップされる', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'none',
        value: { value: 10, unit: 'px' },
      }));

      expect(sut.renderItemsBy('root.div1')).toBe('');
    });

    it('複数プロパティはセミコロン+改行で区切られる', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'top',
        value: { value: 10, unit: 'px' },
      }));
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'left',
        value: { value: 20, unit: 'px' },
      }));

      const rendered = sut.renderItemsBy('root.div1');
      expect(rendered).toContain(';\n');
    });

    it('最後にセミコロンが付く', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'top',
        value: { value: 10, unit: 'px' },
      }));

      const rendered = sut.renderItemsBy('root.div1');
      expect(rendered).toMatch(/;$/);
    });
  });

  // ── renderAllItems ──

  describe('renderAllItems', () => {
    it('全アイテムをレンダリングする', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'top',
        value: { value: 10, unit: 'px' },
      }));
      sut.registerItem(makeItem({
        baseTagPath: 'root.div2',
        basePosition: 'left',
        value: { value: 20, unit: 'px' },
      }));

      const rendered = sut.renderAllItems();
      expect(rendered).toContain('top: 10px');
      expect(rendered).toContain('left: 20px');
    });

    it('position プロパティを含む（static 以外）', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'top',
        relationShip: 'absolute',
        value: { value: 10, unit: 'px' },
      }));

      const rendered = sut.renderAllItems();
      expect(rendered).toContain('position: absolute');
    });

    it('position が static の場合は position プロパティを含まない', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'top',
        relationShip: 'static',
        value: { value: 10, unit: 'px' },
      }));

      const rendered = sut.renderAllItems();
      expect(rendered).not.toContain('position');
    });

    it('position は最初のアイテムで一度だけ出力される', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'top',
        relationShip: 'absolute',
        value: { value: 10, unit: 'px' },
      }));
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'left',
        relationShip: 'absolute',
        value: { value: 20, unit: 'px' },
      }));

      const rendered = sut.renderAllItems();
      const positionCount = (rendered.match(/position: absolute/g) || []).length;
      expect(positionCount).toBe(1);
    });

    it('アイテムがない場合、空文字列を返す', () => {
      const sut = makeSUT();
      expect(sut.renderAllItems()).toBe('');
    });

    it('値が undefined のアイテムはスキップされる', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'top',
        value: undefined,
      }));

      expect(sut.renderAllItems()).toBe('');
    });
  });

  // ── CSS単位サポート ──

  describe('CSS単位サポート', () => {
    it('px 単位で出力できる', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'top',
        value: { value: 100, unit: 'px' },
      }));
      expect(sut.renderItemsBy('root.div1')).toContain('top: 100px');
    });

    it('% 単位で出力できる', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'top',
        value: { value: 50, unit: '%' },
      }));
      expect(sut.renderItemsBy('root.div1')).toContain('top: 50%');
    });

    it('em 単位で出力できる', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'left',
        value: { value: 2, unit: 'em' },
      }));
      expect(sut.renderItemsBy('root.div1')).toContain('left: 2em');
    });

    it('rem 単位で出力できる', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'top',
        value: { value: 1.5, unit: 'rem' },
      }));
      expect(sut.renderItemsBy('root.div1')).toContain('top: 1.5rem');
    });

    it('vw 単位で出力できる', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'left',
        value: { value: 100, unit: 'vw' },
      }));
      expect(sut.renderItemsBy('root.div1')).toContain('left: 100vw');
    });

    it('vh 単位で出力できる', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'top',
        value: { value: 100, unit: 'vh' },
      }));
      expect(sut.renderItemsBy('root.div1')).toContain('top: 100vh');
    });
  });

  // ── エッジケース ──

  describe('エッジケース', () => {
    it('renderAllItems() を複数回呼んでも同じ結果を返す', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'top',
        value: { value: 10, unit: 'px' },
      }));
      const first = sut.renderAllItems();
      const second = sut.renderAllItems();
      expect(first).toBe(second);
    });

    it('resolveAllLayout() を複数回呼んでも冪等性がある', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'top',
        value: { value: 100, unit: 'px' },
      }));
      sut.registerItem(makeItem({
        baseTagPath: 'root.div2',
        basePosition: 'top',
        targetTagPath: 'root.div1',
        targetPosition: 'top',
        value: undefined,
      }));

      sut.resolveAllLayout();
      const afterFirst = sut.renderItemsBy('root.div2');
      sut.resolveAllLayout();
      const afterSecond = sut.renderItemsBy('root.div2');
      expect(afterFirst).toBe(afterSecond);
    });

    it('値 0 のアイテムも正しく出力される', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'top',
        value: { value: 0, unit: 'px' },
      }));
      expect(sut.renderItemsBy('root.div1')).toContain('top: 0px');
    });

    it('小数値のアイテムも正しく出力される', () => {
      const sut = makeSUT();
      sut.registerItem(makeItem({
        baseTagPath: 'root.div1',
        basePosition: 'top',
        value: { value: 1.5, unit: 'rem' },
      }));
      expect(sut.renderItemsBy('root.div1')).toContain('top: 1.5rem');
    });

    it('空のアイテムリストで resolveAllLayout() はエラーなし', () => {
      const sut = makeSUT();
      expect(() => sut.resolveAllLayout()).not.toThrow();
    });
  });
});
