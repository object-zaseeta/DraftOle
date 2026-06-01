/**
 * Task 7.1: CssPositionMaker -- 要素配置管理のテスト
 *
 * TDD RED phase: CssPositionMaker の全メソッド・render()出力・エッジケースを検証する。
 * - position（static, relative, absolute, fixed）の設定
 * - top, left, width, height, bottom, right の配置プロパティ
 * - CssPlaceDescription による位置情報の保持
 * - CssLayoutBuilder によるメソッドチェーン構築
 * - LazyLayoutRegister の管理
 * - CssPositionMakerType インターフェースに準拠
 *
 * Requirements: 2.1, 2.2
 */
import { describe, it, expect } from 'vitest';
import { CssPositionMaker } from '../../../../src/css/layout/position-maker/css-position-maker.js';
import type { LazyLayoutRegister, LayoutRegisteredItem } from '../../../../src/css/layout/lazy-layout/registered-item.js';
import type { RelationShip } from '../../../../src/utils/unit-style.js';
import type { Positioning } from '../../../../src/css/layout/positioning.js';

// ============================================================
// ヘルパー
// ============================================================

function makeSUT(tagPath = 'root.div'): CssPositionMaker {
  return new CssPositionMaker(tagPath);
}

/** テスト用のモック LazyLayoutRegister */
function makeMockLLRegister(): LazyLayoutRegister {
  const items: LayoutRegisteredItem[] = [];
  return {
    registerItem(item: LayoutRegisteredItem): void {
      items.push(item);
    },
    getRelationShip(_tagPath: string): RelationShip | undefined {
      return undefined;
    },
    renderItemsBy(_tagPath: string): string {
      return '';
    },
    renderAllItems(): string {
      return '';
    },
    resolveAllLayout(): void {
      // no-op
    },
  };
}

// ============================================================
// CssPositionMaker
// ============================================================

describe('CssPositionMaker', () => {
  // ── 初期状態 ──

  describe('初期状態', () => {
    it('tagPath が初期値で設定される', () => {
      const sut = makeSUT('root.div');
      expect(sut.tagPath).toBe('root.div');
    });

    it('description が空（全プロパティ undefined）で初期化される', () => {
      const sut = makeSUT();
      expect(sut.description.top).toBeUndefined();
      expect(sut.description.left).toBeUndefined();
      expect(sut.description.width).toBeUndefined();
      expect(sut.description.height).toBeUndefined();
    });

    it('プロパティ未設定の場合、render() は空文字列を返す', () => {
      const sut = makeSUT();
      expect(sut.render()).toBe('');
    });

    it('LazyLayoutRegister の初期値は undefined', () => {
      const sut = makeSUT();
      expect(sut.getLLRegister()).toBeUndefined();
    });
  });

  // ── Renderable 準拠 ──

  describe('Renderable準拠', () => {
    it('render() メソッドを持つ', () => {
      const sut = makeSUT();
      expect(typeof sut.render).toBe('function');
    });
  });

  // ── placeAbsoluteWith ──

  describe('placeAbsoluteWith', () => {
    it('position を absolute に設定する', () => {
      const sut = makeSUT();
      sut.placeAbsoluteWith(() => {});
      expect(sut.render()).toContain('position: absolute');
    });

    it('ビルダーで top を設定できる', () => {
      const sut = makeSUT();
      sut.placeAbsoluteWith((builder) => {
        builder.top(100, 'px');
      });
      const rendered = sut.render();
      expect(rendered).toContain('position: absolute');
      expect(rendered).toContain('top: 100px');
    });

    it('ビルダーで left を設定できる', () => {
      const sut = makeSUT();
      sut.placeAbsoluteWith((builder) => {
        builder.left(50, 'px');
      });
      const rendered = sut.render();
      expect(rendered).toContain('position: absolute');
      expect(rendered).toContain('left: 50px');
    });

    it('ビルダーで width と height を設定できる', () => {
      const sut = makeSUT();
      sut.placeAbsoluteWith((builder) => {
        builder.width(200, 'px').height(300, 'px');
      });
      const rendered = sut.render();
      expect(rendered).toContain('width: 200px');
      expect(rendered).toContain('height: 300px');
    });

    it('ビルダーで bottom と right を設定できる', () => {
      const sut = makeSUT();
      sut.placeAbsoluteWith((builder) => {
        builder.bottom(10, 'px').right(20, 'px');
      });
      const rendered = sut.render();
      expect(rendered).toContain('bottom: 10px');
      expect(rendered).toContain('right: 20px');
    });

    it('ビルダーで全プロパティを設定できる', () => {
      const sut = makeSUT();
      sut.placeAbsoluteWith((builder) => {
        builder
          .top(10, 'px')
          .left(20, 'px')
          .width(300, 'px')
          .height(400, 'px')
          .bottom(50, 'px')
          .right(60, 'px');
      });
      const rendered = sut.render();
      expect(rendered).toContain('position: absolute');
      expect(rendered).toContain('top: 10px');
      expect(rendered).toContain('left: 20px');
      expect(rendered).toContain('width: 300px');
      expect(rendered).toContain('height: 400px');
      expect(rendered).toContain('bottom: 50px');
      expect(rendered).toContain('right: 60px');
    });

    it('description に top, left, width, height が反映される', () => {
      const sut = makeSUT();
      sut.placeAbsoluteWith((builder) => {
        builder.top(10, 'px').left(20, '%').width(100, 'vw').height(50, 'vh');
      });
      expect(sut.description.top).toEqual({ value: 10, unit: 'px' });
      expect(sut.description.left).toEqual({ value: 20, unit: '%' });
      expect(sut.description.width).toEqual({ value: 100, unit: 'vw' });
      expect(sut.description.height).toEqual({ value: 50, unit: 'vh' });
    });
  });

  // ── placeRelativeWith ──

  describe('placeRelativeWith', () => {
    it('position を relative に設定する', () => {
      const sut = makeSUT();
      sut.placeRelativeWith(() => {});
      expect(sut.render()).toContain('position: relative');
    });

    it('ビルダーで top と left を設定できる', () => {
      const sut = makeSUT();
      sut.placeRelativeWith((builder) => {
        builder.top(10, 'px').left(20, 'px');
      });
      const rendered = sut.render();
      expect(rendered).toContain('position: relative');
      expect(rendered).toContain('top: 10px');
      expect(rendered).toContain('left: 20px');
    });

    it('パーセント単位で設定できる', () => {
      const sut = makeSUT();
      sut.placeRelativeWith((builder) => {
        builder.top(50, '%').left(25, '%');
      });
      const rendered = sut.render();
      expect(rendered).toContain('top: 50%');
      expect(rendered).toContain('left: 25%');
    });
  });

  // ── placeStaticWith ──

  describe('placeStaticWith', () => {
    it('position を static に設定する', () => {
      const sut = makeSUT();
      sut.placeStaticWith(() => {});
      expect(sut.render()).toContain('position: static');
    });

    it('ビルダーで width と height を設定できる', () => {
      const sut = makeSUT();
      sut.placeStaticWith((builder) => {
        builder.width(100, '%').height(50, 'vh');
      });
      const rendered = sut.render();
      expect(rendered).toContain('position: static');
      expect(rendered).toContain('width: 100%');
      expect(rendered).toContain('height: 50vh');
    });
  });

  // ── placeFixedWith ──

  describe('placeFixedWith', () => {
    it('position を fixed に設定する', () => {
      const sut = makeSUT();
      sut.placeFixedWith(() => {});
      expect(sut.render()).toContain('position: fixed');
    });

    it('ビルダーで top, left, width, height を設定できる', () => {
      const sut = makeSUT();
      sut.placeFixedWith((builder) => {
        builder.top(0, 'px').left(0, 'px').width(100, 'vw').height(100, 'vh');
      });
      const rendered = sut.render();
      expect(rendered).toContain('position: fixed');
      expect(rendered).toContain('top: 0px');
      expect(rendered).toContain('left: 0px');
      expect(rendered).toContain('width: 100vw');
      expect(rendered).toContain('height: 100vh');
    });
  });

  // ── CSS単位サポート ──

  describe('CSS単位サポート', () => {
    it('px 単位をサポートする', () => {
      const sut = makeSUT();
      sut.placeAbsoluteWith((builder) => {
        builder.top(100, 'px');
      });
      expect(sut.render()).toContain('top: 100px');
    });

    it('em 単位をサポートする', () => {
      const sut = makeSUT();
      sut.placeAbsoluteWith((builder) => {
        builder.top(2, 'em');
      });
      expect(sut.render()).toContain('top: 2em');
    });

    it('rem 単位をサポートする', () => {
      const sut = makeSUT();
      sut.placeAbsoluteWith((builder) => {
        builder.top(1.5, 'rem');
      });
      expect(sut.render()).toContain('top: 1.5rem');
    });

    it('% 単位をサポートする', () => {
      const sut = makeSUT();
      sut.placeAbsoluteWith((builder) => {
        builder.width(50, '%');
      });
      expect(sut.render()).toContain('width: 50%');
    });

    it('vw 単位をサポートする', () => {
      const sut = makeSUT();
      sut.placeAbsoluteWith((builder) => {
        builder.width(100, 'vw');
      });
      expect(sut.render()).toContain('width: 100vw');
    });

    it('vh 単位をサポートする', () => {
      const sut = makeSUT();
      sut.placeAbsoluteWith((builder) => {
        builder.height(100, 'vh');
      });
      expect(sut.render()).toContain('height: 100vh');
    });
  });

  // ── プロパティソート順（アルファベット順） ──

  describe('プロパティソート順（アルファベット順）', () => {
    it('プロパティがアルファベット順にソートされる', () => {
      const sut = makeSUT();
      sut.placeAbsoluteWith((builder) => {
        builder
          .top(10, 'px')
          .left(20, 'px')
          .width(300, 'px')
          .height(400, 'px');
      });
      const rendered = sut.render();
      const lines = rendered.split(';\n');

      // height < left < position < top < width
      expect(lines[0]).toBe('height: 400px');
      expect(lines[1]).toBe('left: 20px');
      expect(lines[2]).toBe('position: absolute');
      expect(lines[3]).toBe('top: 10px');
      expect(lines[4]).toBe('width: 300px;');
    });

    it('bottom, right を含む場合もアルファベット順', () => {
      const sut = makeSUT();
      sut.placeAbsoluteWith((builder) => {
        builder.top(10, 'px').bottom(20, 'px').left(30, 'px').right(40, 'px');
      });
      const rendered = sut.render();
      const lines = rendered.split(';\n');

      // bottom < left < position < right < top
      expect(lines[0]).toBe('bottom: 20px');
      expect(lines[1]).toBe('left: 30px');
      expect(lines[2]).toBe('position: absolute');
      expect(lines[3]).toBe('right: 40px');
      expect(lines[4]).toBe('top: 10px;');
    });
  });

  // ── render() 出力フォーマット ──

  describe('render() 出力フォーマット', () => {
    it('position のみの場合、セミコロンで終わる', () => {
      const sut = makeSUT();
      sut.placeAbsoluteWith(() => {});
      expect(sut.render()).toBe('position: absolute;');
    });

    it('複数プロパティの場合、セミコロン+改行で区切られ、最後にセミコロンが付く', () => {
      const sut = makeSUT();
      sut.placeAbsoluteWith((builder) => {
        builder.top(10, 'px');
      });
      expect(sut.render()).toBe('position: absolute;\ntop: 10px;');
    });
  });

  // ── tagPath 管理 ──

  describe('tagPath 管理', () => {
    it('tagPath を更新できる', () => {
      const sut = makeSUT('root.div');
      sut.tagPath = 'root.div.span';
      expect(sut.tagPath).toBe('root.div.span');
    });
  });

  // ── LazyLayoutRegister 管理 ──

  describe('LazyLayoutRegister 管理', () => {
    it('updateLLRegister で LazyLayoutRegister を設定できる', () => {
      const sut = makeSUT();
      const register = makeMockLLRegister();
      sut.updateLLRegister(register);
      expect(sut.getLLRegister()).toBe(register);
    });

    it('updateLLRegister で undefined を設定してクリアできる', () => {
      const sut = makeSUT();
      const register = makeMockLLRegister();
      sut.updateLLRegister(register);
      sut.updateLLRegister(undefined);
      expect(sut.getLLRegister()).toBeUndefined();
    });
  });

  // ── place メソッドの上書き ──

  describe('place メソッドの上書き', () => {
    it('placeAbsoluteWith 後に placeRelativeWith を呼ぶと position が relative に変わる', () => {
      const sut = makeSUT();
      sut.placeAbsoluteWith((builder) => {
        builder.top(10, 'px');
      });
      sut.placeRelativeWith((builder) => {
        builder.top(20, 'px');
      });
      const rendered = sut.render();
      expect(rendered).toContain('position: relative');
      expect(rendered).toContain('top: 20px');
      expect(rendered).not.toContain('position: absolute');
    });

    it('place メソッドを再呼び出しすると前の配置値がリセットされる', () => {
      const sut = makeSUT();
      sut.placeAbsoluteWith((builder) => {
        builder.top(10, 'px').left(20, 'px').width(300, 'px').height(400, 'px');
      });
      sut.placeFixedWith((builder) => {
        builder.top(0, 'px');
      });
      const rendered = sut.render();
      expect(rendered).toContain('position: fixed');
      expect(rendered).toContain('top: 0px');
      // 前回の left, width, height はリセットされている
      expect(rendered).not.toContain('left');
      expect(rendered).not.toContain('width');
      expect(rendered).not.toContain('height');
    });
  });

  // ── エッジケース ──

  describe('エッジケース', () => {
    it('render() を複数回呼んでも同じ値を返す', () => {
      const sut = makeSUT();
      sut.placeAbsoluteWith((builder) => {
        builder.top(10, 'px').left(20, 'px');
      });
      const first = sut.render();
      const second = sut.render();
      expect(first).toBe(second);
    });

    it('ビルダーの closure が空でも position は設定される', () => {
      const sut = makeSUT();
      sut.placeRelativeWith(() => {});
      expect(sut.render()).toBe('position: relative;');
    });

    it('値 0 の場合も正しく出力される', () => {
      const sut = makeSUT();
      sut.placeAbsoluteWith((builder) => {
        builder.top(0, 'px').left(0, 'px');
      });
      const rendered = sut.render();
      expect(rendered).toContain('top: 0px');
      expect(rendered).toContain('left: 0px');
    });

    it('小数値を正しく出力できる', () => {
      const sut = makeSUT();
      sut.placeAbsoluteWith((builder) => {
        builder.top(1.5, 'rem').left(2.5, 'em');
      });
      const rendered = sut.render();
      expect(rendered).toContain('top: 1.5rem');
      expect(rendered).toContain('left: 2.5em');
    });
  });
});
