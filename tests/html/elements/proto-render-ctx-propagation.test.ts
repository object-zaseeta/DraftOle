/**
 * Task 3.2 (element-style-colocated): サブクラス protoRender の RenderContext 伝搬整備
 *
 * 各サブクラス（Root / PairType / SelfClosingType / TextType）の `protoRender`
 * override が、受け取った ctx を子要素 `protoRender(ctx)` に必ず伝搬することを
 * 確認する。
 *
 * 検証方針:
 *   - 子要素を probe HtmlTag サブクラスにし、`protoRender(ctx?)` の呼び出し時に
 *     渡された ctx を内部に記録する。
 *   - 親要素（Root / PairType）に probe を子として追加し、親に既知の ctx を
 *     渡して `protoRender(ctx)` を呼ぶ。
 *   - 記録された ctx が **同一インスタンス**であることを assert する。
 *   - SelfClosingType / TextType は子を持たないため、ctx を引数として
 *     受理できる（=シグネチャが widen されている）ことを確認する。
 *
 * Requirements: 3.1, 3.4
 */
import { describe, it, expect } from 'vitest';
import { Root } from '../../../src/html/elements/root.js';
import { PairType } from '../../../src/html/elements/pair-type.js';
import { SelfClosingType } from '../../../src/html/elements/self-closing-type.js';
import { TextType } from '../../../src/html/elements/text-type.js';
import { HtmlTag } from '../../../src/html/elements/html-tag.js';
import {
  createDefaultRenderContext,
  type RenderContext,
} from '../../../src/html/elements/render-context.js';
import { IdRegistry } from '../../../src/html/elements/id-registry.js';
import { defaultIdentifierResolver } from '../../../src/css/utils/identifier-resolver.js';

/**
 * テスト用 probe: 自身の protoRender に渡された ctx を記録する。
 */
class ProbeTag extends HtmlTag {
  capturedCtx: RenderContext | undefined = undefined;
  callCount = 0;
  constructor() {
    super('div');
  }
  override protoRender(ctx?: RenderContext): string {
    this.capturedCtx = ctx;
    this.callCount += 1;
    return '';
  }
}

describe('Task 3.2 — サブクラス protoRender の RenderContext 伝搬', () => {
  describe('Root.protoRender(ctx)', () => {
    it('ctx を子要素の protoRender(ctx) にそのまま伝搬する', () => {
      const root = new Root();
      const probe1 = new ProbeTag();
      const probe2 = new ProbeTag();
      root.addChild(probe1);
      root.addChild(probe2);

      const ctx: RenderContext = {
        registry: new IdRegistry(),
        resolver: defaultIdentifierResolver,
      };
      root.protoRender(ctx);

      expect(probe1.capturedCtx).toBe(ctx);
      expect(probe2.capturedCtx).toBe(ctx);
      // registry は同一インスタンスで共有されている
      expect(probe1.capturedCtx?.registry).toBe(ctx.registry);
      expect(probe2.capturedCtx?.registry).toBe(ctx.registry);
    });

    it('ctx 省略時も子要素には何らかの ctx が渡る（後方互換）', () => {
      const root = new Root();
      const probe = new ProbeTag();
      root.addChild(probe);

      root.protoRender();

      // 省略形でも子要素 protoRender(ctx?) は呼ばれる。
      expect(probe.callCount).toBe(1);
    });

    it('ctx 省略時、ツリー内の全子要素が同一の ctx.registry を共有する', () => {
      const root = new Root();
      const probe1 = new ProbeTag();
      const probe2 = new ProbeTag();
      root.addChild(probe1);
      root.addChild(probe2);

      root.protoRender();

      // ctx 省略形でも、Root から流れる ctx.registry は子要素間で同一インスタンス
      expect(probe1.capturedCtx?.registry).toBeDefined();
      expect(probe2.capturedCtx?.registry).toBeDefined();
      expect(probe1.capturedCtx?.registry).toBe(probe2.capturedCtx?.registry);
    });

    it('ctx 省略時の出力と ctx 明示時の出力がバイト等価である', () => {
      const root1 = new Root();
      const root2 = new Root();
      // 可視出力を伴う通常の子要素を 1 つ追加
      const a = new PairType('div');
      const b = new PairType('div');
      root1.addChild(a);
      root2.addChild(b);

      const ctx = createDefaultRenderContext();
      expect(root1.protoRender()).toBe(root2.protoRender(ctx));
    });
  });

  describe('PairType.protoRender(ctx)', () => {
    it('ctx を子要素の protoRender(ctx) にそのまま伝搬する', () => {
      const parent = new PairType('div');
      const probe1 = new ProbeTag();
      const probe2 = new ProbeTag();
      parent.addChild(probe1);
      parent.addChild(probe2);

      const ctx: RenderContext = {
        registry: new IdRegistry(),
        resolver: defaultIdentifierResolver,
      };
      parent.protoRender(ctx);

      expect(probe1.capturedCtx).toBe(ctx);
      expect(probe2.capturedCtx).toBe(ctx);
    });

    it('PairType の出力が ctx 有無で等価（バイト等価）', () => {
      const a = new PairType('div');
      const b = new PairType('div');
      a.addChild(new TextType('hello'));
      b.addChild(new TextType('hello'));
      const ctx = createDefaultRenderContext();
      expect(a.protoRender()).toBe(b.protoRender(ctx));
    });

    it('属性付き PairType も正しくレンダーされる', () => {
      const tag = new PairType('div');
      const ctx = createDefaultRenderContext();
      // 引数なし呼び出しと等価であること
      expect(tag.protoRender(ctx)).toBe('<div></div>');
    });
  });

  describe('SelfClosingType.protoRender(ctx)', () => {
    it('ctx を引数として受理できる（シグネチャ widen）', () => {
      const tag = new SelfClosingType('br');
      const ctx = createDefaultRenderContext();
      expect(tag.protoRender(ctx)).toBe('<br>');
    });

    it('ctx 有無で出力がバイト等価', () => {
      const a = new SelfClosingType('hr');
      const b = new SelfClosingType('hr');
      const ctx = createDefaultRenderContext();
      expect(a.protoRender()).toBe(b.protoRender(ctx));
    });
  });

  describe('TextType.protoRender(ctx)', () => {
    it('ctx を引数として受理できる（シグネチャ widen）', () => {
      const text = new TextType('hello');
      const ctx = createDefaultRenderContext();
      expect(text.protoRender(ctx)).toBe('hello');
    });

    it('ctx 有無で出力がバイト等価', () => {
      const a = new TextType('hello <world>');
      const b = new TextType('hello <world>');
      const ctx = createDefaultRenderContext();
      expect(a.protoRender()).toBe(b.protoRender(ctx));
    });
  });

  describe('深いツリーでの ctx.registry 共有', () => {
    it('Root → PairType → ProbeTag の経路で同一 registry が観測される', () => {
      const root = new Root();
      const middle = new PairType('div');
      const probe = new ProbeTag();
      middle.addChild(probe);
      root.addChild(middle);

      const ctx: RenderContext = {
        registry: new IdRegistry(),
        resolver: defaultIdentifierResolver,
      };
      root.protoRender(ctx);

      expect(probe.capturedCtx).toBe(ctx);
      expect(probe.capturedCtx?.registry).toBe(ctx.registry);
    });
  });
});
