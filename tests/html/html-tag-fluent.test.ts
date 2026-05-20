/**
 * D-3.1: HtmlTag Fluent CSS メソッド
 *
 * SwiftUIライクな宣言的スタイリングAPI。
 * element.padding('24px').background('#3b82f6').cornerRadius('8px')
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { div, h1, p, a, section, Text } from '../../src/html/tags/factories.js';
import { DuplicateCssPropertyError } from '../../src/utils/errors.js';

describe('D-3.1: Fluent CSS メソッド', () => {

  // ── style ショートカット（5段階→3段階） ──

  describe('style ショートカット', () => {
    it('element.style で HtmlStyle にアクセスできる', () => {
      const el = div();
      expect(el.style).toBeDefined();
      expect(el.style.font).toBeDefined();
      expect(el.style.spacing).toBeDefined();
    });

    it('element.style は element.css.styleManager.style と同じインスタンス', () => {
      const el = div();
      expect(el.style).toBe(el.css.styleManager.style);
    });

    it('3段階チェーンでスタイルを設定できる', () => {
      const el = div();
      el.style.font.setFontSize('24px');
      const css = el.css.render();
      expect(css).toContain('font-size: 24px');
    });
  });

  // ── Fluent メソッド（1段階チェーン） ──

  describe('Fluent メソッド基本', () => {
    it('.padding() で padding を設定', () => {
      const el = div().padding('24px');
      expect(el.css.render()).toContain('padding: 24px');
    });

    it('.margin() で margin を設定', () => {
      const el = div().margin('10px');
      expect(el.css.render()).toContain('margin: 10px');
    });

    it('.background() で background ショートハンドを設定', () => {
      const el = div().background('#1a1a1a');
      expect(el.css.render()).toContain('background: #1a1a1a');
    });

    it('.background() に gradient を渡すと background: として出力（bug fix）', () => {
      const el = div().background('radial-gradient(circle, #fff, #000), #000');
      const css = el.css.render();
      expect(css).toContain('background: radial-gradient(circle, #fff, #000), #000');
      expect(css).not.toContain('background-color: radial-gradient');
    });

    it('.backgroundColor() で background-color を設定', () => {
      const el = div().backgroundColor('#1a1a1a');
      expect(el.css.render()).toContain('background-color: #1a1a1a');
    });

    it('.background({...}) shorthand で複数プロパティを設定', () => {
      const el = div().background({
        color: '#1a1a1a',
        image: 'url(/bg.png)',
        size: 'cover',
        position: 'center',
        repeat: 'no-repeat',
      });
      const css = el.css.render();
      expect(css).toContain('background-color: #1a1a1a');
      expect(css).toContain('background-image: url(/bg.png)');
      expect(css).toContain('background-size: cover');
      expect(css).toContain('background-position: center');
      expect(css).toContain('background-repeat: no-repeat');
    });

    it('.background({...}) 部分指定で指定プロパティのみ出力', () => {
      const el = div().background({ image: 'url(/hero.jpg)', size: 'cover' });
      const css = el.css.render();
      expect(css).toContain('background-image: url(/hero.jpg)');
      expect(css).toContain('background-size: cover');
      expect(css).not.toContain('background-color');
      expect(css).not.toContain('background-repeat');
    });

    it('.color() で color を設定', () => {
      const el = div().color('#ffffff');
      expect(el.css.render()).toContain('color: #ffffff');
    });

    it('.fontSize() で font-size を設定', () => {
      const el = div().fontSize('16px');
      expect(el.css.render()).toContain('font-size: 16px');
    });

    it('.fontWeight() で font-weight を設定', () => {
      const el = div().fontWeight('700');
      expect(el.css.render()).toContain('font-weight: 700');
    });

    it('.fontFamily() で font-family を設定', () => {
      const el = div().fontFamily('Inter, sans-serif');
      expect(el.css.render()).toContain('font-family: Inter, sans-serif');
    });

    it('.lineHeight() で line-height を設定', () => {
      const el = div().lineHeight('1.6');
      expect(el.css.render()).toContain('line-height: 1.6');
    });

    it('.cornerRadius() で border-radius を設定', () => {
      const el = div().cornerRadius('8px');
      expect(el.css.render()).toContain('border-radius: 8px');
    });

    it('.display() で display を設定', () => {
      const el = div().display('flex');
      expect(el.css.render()).toContain('display: flex');
    });

    it('.width() で width を設定', () => {
      const el = div().width('100%');
      expect(el.css.render()).toContain('width: 100%');
    });

    it('.height() で height を設定', () => {
      const el = div().height('200px');
      expect(el.css.render()).toContain('height: 200px');
    });

    it('.maxWidth() で max-width を設定', () => {
      const el = div().maxWidth('1200px');
      expect(el.css.render()).toContain('max-width: 1200px');
    });

    it('.textAlign() で text-align を設定', () => {
      const el = div().textAlign('center');
      expect(el.css.render()).toContain('text-align: center');
    });

    it('.textDecoration() で text-decoration を設定', () => {
      const el = a().textDecoration('none');
      expect(el.css.render()).toContain('text-decoration: none');
    });

    it('.overflow() で overflow を設定', () => {
      const el = div().overflow('auto');
      expect(el.css.render()).toContain('overflow: auto');
    });

    it('.opacity() で opacity を設定', () => {
      const el = div().opacity('0.5');
      expect(el.css.render()).toContain('opacity: 0.5');
    });

    it('.gap() で gap を設定', () => {
      const el = div().gap('16px');
      expect(el.css.render()).toContain('gap: 16px');
    });

    it('.flexGrow() で flex-grow を設定', () => {
      const el = div().flexGrow('1');
      expect(el.css.render()).toContain('flex-grow: 1');
    });

    it('.boxShadow() で box-shadow を設定', () => {
      const el = div().boxShadow('0 2px 4px rgba(0,0,0,0.1)');
      expect(el.css.render()).toContain('box-shadow: 0 2px 4px rgba(0,0,0,0.1)');
    });
  });

  // ── メソッドチェーン ──

  describe('メソッドチェーン', () => {
    it('複数のFluentメソッドをチェーンできる', () => {
      const el = div()
        .padding('24px')
        .background('#1a1a1a')
        .cornerRadius('12px');

      const css = el.css.render();
      expect(css).toContain('padding: 24px');
      expect(css).toContain('background: #1a1a1a');
      expect(css).toContain('border-radius: 12px');
    });

    it('ファクトリ関数から直接チェーンできる', () => {
      const el = h1(Text('Hello'))
        .fontSize('48px')
        .fontWeight('700')
        .color('#ffffff');

      const css = el.css.render();
      expect(css).toContain('font-size: 48px');
      expect(css).toContain('font-weight: 700');
      expect(css).toContain('color: #ffffff');
    });

    it('addChild とFluentメソッドを混在できる', () => {
      const el = div()
        .padding('24px')
        .background('#000');

      el.addChild(p(Text('Hello')));

      expect(el.css.render()).toContain('padding: 24px');
      expect(el.children.length).toBe(1);
    });
  });

  // ── LP再構築シナリオ ──

  describe('LP構築シナリオ（SwiftUIライク）', () => {
    it('ヒーローセクションをSwiftUIライクに構築できる', () => {
      const hero = section(
        h1(Text('HTML, CSS, JS — TypeScript ひとつで。'))
          .fontSize('48px')
          .fontWeight('700')
          .color('#ffffff')
          .margin('0 0 24px 0'),
        p(Text('型安全なDSLでWebページを丸ごと生成'))
          .fontSize('20px')
          .color('#a0a0a0'),
        a({ href: '#' }, Text('Get Started'))
          .display('inline-block')
          .padding('16px 40px')
          .background('#3b82f6')
          .color('#ffffff')
          .cornerRadius('8px')
          .textDecoration('none'),
      )
      .padding('120px 0 80px')
      .textAlign('center');

      const html = hero.render();
      expect(html).toContain('<section');
      expect(html).toContain('<h1');
      expect(html).toContain('Get Started');

      const css = hero.collectCssStyleString();
      expect(css).toContain('font-size: 48px');
      expect(css).toContain('padding: 16px 40px');
      expect(css).toContain('background: #3b82f6');
      expect(css).toContain('border-radius: 8px');
    });
  });

  // ── .grid() Fluent チェーン統合 (Task 2.2) ──
  // Req 4.1, 4.2, 7.1

  describe('.grid() Fluent チェーン統合', () => {
    it('.grid() は this を返し、後続 Fluent メソッドが呼べる', () => {
      const el = div();
      const result = el.grid({ columns: 3, gap: '16px' });
      expect(result).toBe(el);
      // 後続の Fluent メソッドが呼べることを確認
      const chained = result.padding('24px');
      expect(chained).toBe(el);
    });

    it('.grid(...).padding(...) 混合チェーンが .flex() と同様に動作する', () => {
      const el = div()
        .grid({ columns: 2, gap: '12px' })
        .padding('24px')
        .background('#1a1a1a');

      const css = el.css.render();
      expect(css).toContain('display: grid');
      expect(css).toContain('padding: 24px');
      expect(css).toContain('background: #1a1a1a');
    });

    it('div().grid().css.render() 出力に display: grid が含まれる', () => {
      const el = div().grid();
      expect(el.css.render()).toContain('display: grid');
    });
  });

  // ── .hover() Fluent チェーン統合 ──
  describe('.hover() Fluent チェーン統合', () => {
    it('.hover(s => ...).padding(...) チェーンで this を返し後続 method が呼べる', () => {
      const el = div();
      const hovered = el.hover(s => s.background('#eee'));
      expect(hovered).toBe(el);
      const chained = hovered.padding('16px');
      expect(chained).toBe(el);
    });

    it('div().padding(...).hover(s => ...) 混合チェーンの最終 CSS に base と :hover ブロックが両方出力される', () => {
      const el = div()
        .padding('16px')
        .hover(s => s.background('#eee'));

      const css = el.css.renderCss();
      expect(css).toContain('padding: 16px');
      expect(css).toContain(':hover');
      expect(css).toContain('background: #eee');
    });

    it('hover に borderColor を指定すると :hover ブロックに border-color が出力される', () => {
      const el = div().hover(s => s.borderColor('#ef4444').color('#ef4444'));
      const css = el.css.renderCss();
      expect(css).toContain(':hover');
      expect(css).toContain('border-color: #ef4444');
      expect(css).toContain('color: #ef4444');
    });

    it('既存 Fluent describe ブロック群は hover 変更後も構造を維持している', () => {
      const el = div().flex({ direction: 'row' }).padding('8px');
      expect(el).toBeDefined();
      expect(el.css.render()).toContain('display: flex');
      expect(el.css.render()).toContain('padding: 8px');
    });
  });

  // ── HtmlTag .font() / .border() 統合 (Task 3.1) ──
  // Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 5.1, 5.3, 6.1, 6.2, 6.3

  describe('HtmlTag .font() / .border() integration', () => {
    const savedDev = process.env.DRAFT_OLE_DEV;
    beforeEach(() => { delete process.env.DRAFT_OLE_DEV; });
    afterEach(() => {
      if (savedDev === undefined) delete process.env.DRAFT_OLE_DEV;
      else process.env.DRAFT_OLE_DEV = savedDev;
    });

    // (1) .font({size, weight}) final CSS: font-size/font-weight in
    //     alphabetical order; font-family/line-height/color NOT present
    //     (R1.1, R1.2, R6.1, R6.2)
    it('.font({size, weight}) が font-size / font-weight をアルファベット順で含み、未指定を出力しない', () => {
      const el = div().font({ size: '14px', weight: 'bold' });
      const css = el.css.render();

      expect(css).toContain('font-size: 14px');
      expect(css).toContain('font-weight: bold');

      const sizeIdx = css.indexOf('font-size');
      const weightIdx = css.indexOf('font-weight');
      expect(sizeIdx).toBeLessThan(weightIdx);

      expect(css).not.toContain('font-family');
      expect(css).not.toContain('line-height');
      expect(css).not.toMatch(/(^|[^-])color:/);
    });

    // (2) .border({width, style, color}) final CSS similarly
    //     (R2.1, R2.2, R6.1, R6.2)
    it('.border({width, style, color}) が border-color/style/width をアルファベット順で含み、未指定を出力しない', () => {
      const el = div().border({ width: '1px', style: 'solid', color: '#333' });
      const css = el.css.render();

      expect(css).toContain('border-color: #333');
      expect(css).toContain('border-style: solid');
      expect(css).toContain('border-width: 1px');

      const colorIdx = css.indexOf('border-color');
      const styleIdx = css.indexOf('border-style');
      const widthIdx = css.indexOf('border-width');
      expect(colorIdx).toBeLessThan(styleIdx);
      expect(styleIdx).toBeLessThan(widthIdx);

      expect(css).not.toContain('border-radius');
      expect(css).not.toContain('border-top');
      expect(css).not.toContain('border-right');
      expect(css).not.toContain('border-bottom');
      expect(css).not.toContain('border-left');
    });

    // (3) 統合 Modifier + 個別 setter の併用 (R3.2)
    it('.font({size}).fontWeight(bold) は両設定を出力 CSS に反映する', () => {
      const el = div().font({ size: '14px' }).fontWeight('bold');
      const css = el.css.render();
      expect(css).toContain('font-size: 14px');
      expect(css).toContain('font-weight: bold');
    });

    // (4) 複数 Fluent modifier のチェーン継続 (R5.3)
    it('.padding().font().border().background() チェーンが中断されず全て反映される', () => {
      const el = div()
        .padding('10px')
        .font({ size: '14px', weight: 'bold' })
        .border({ width: '1px', style: 'solid', color: '#333' })
        .background('#fff');

      // チェーン継続: HtmlTag 自身が返るため後続 API が呼べる
      expect(el).toBe(el);
      expect(typeof el.css.render).toBe('function');

      const css = el.css.render();
      expect(css).toContain('padding: 10px');
      expect(css).toContain('font-size: 14px');
      expect(css).toContain('font-weight: bold');
      expect(css).toContain('border-color: #333');
      expect(css).toContain('border-style: solid');
      expect(css).toContain('border-width: 1px');
      expect(css).toContain('background: #fff');

      // さらに Fluent API が継続して呼べる
      const chained = el.margin('8px');
      expect(chained).toBe(el);
      expect(el.css.render()).toContain('margin: 8px');
    });

    // (5) DEV モード: .color('red').font({color:'blue'}) で DuplicateCssPropertyError('color') (R4.1)
    it('DEV モード: .color() 後に .font({color}) で DuplicateCssPropertyError(color) を throw する', () => {
      process.env.DRAFT_OLE_DEV = 'true';
      const el = div().color('red');
      expect(() => el.font({ color: 'blue' })).toThrow(DuplicateCssPropertyError);
      expect(() => div().color('red').font({ color: 'blue' })).toThrow(/color/);
    });

    // (6) DEV モード: 個別 border-width setter 後に .border({width:'2px'}) で
    //     DuplicateCssPropertyError('border-width') (R4.2)
    //     NOTE: HtmlTag は .borderWidth() Fluent を公開していないため、
    //     同等の個別 setter（style.border.setBorderWidth）を経由して検証する。
    it('DEV モード: setBorderWidth 後に .border({width}) で DuplicateCssPropertyError(border-width) を throw する', () => {
      process.env.DRAFT_OLE_DEV = 'true';
      const el = div();
      el.style.border.setBorderWidth('1px');
      expect(() => el.border({ width: '2px' })).toThrow(DuplicateCssPropertyError);

      const el2 = div();
      el2.style.border.setBorderWidth('1px');
      expect(() => el2.border({ width: '2px' })).toThrow(/border-width/);
    });

    // (7) スコープドクラス適用後の最終 CSS 出力に .font() / .border() のプロパティが
    //     css-sanitizer を通過した形で含まれること (R6.3)
    //     個別 setter と同一パイプラインを通過することを等価性でも確認する
    it('スコープドクラス適用後の最終 CSS 出力に .font() / .border() のプロパティが含まれる', () => {
      const parent = div();
      const child = p()
        .font({ size: '14px', weight: 'bold' })
        .border({ width: '1px', style: 'solid', color: '#333' });
      parent.addChild(child);

      const css = parent.collectCssStyleString();
      // スコープクラスセレクタ内に各プロパティが含まれる
      expect(css).toMatch(/\._(?:[a-z0-9-]+__)?[0-9a-f]{8}\s*\{[^}]*font-size: 14px/);
      expect(css).toMatch(/\._(?:[a-z0-9-]+__)?[0-9a-f]{8}\s*\{[^}]*font-weight: bold/);
      expect(css).toMatch(/\._(?:[a-z0-9-]+__)?[0-9a-f]{8}\s*\{[^}]*border-color: #333/);
      expect(css).toMatch(/\._(?:[a-z0-9-]+__)?[0-9a-f]{8}\s*\{[^}]*border-style: solid/);
      expect(css).toMatch(/\._(?:[a-z0-9-]+__)?[0-9a-f]{8}\s*\{[^}]*border-width: 1px/);
    });

    it('.font({size}) と .fontSize() が共有パイプラインで同一出力になる（css-sanitizer 等価性）', () => {
      const viaFont = div().font({ size: '14px' }).css.render();
      const viaIndividual = div().fontSize('14px').css.render();
      expect(viaFont).toBe(viaIndividual);
    });

    it('.border({width}) と setBorderWidth が共有パイプラインで同一出力になる（css-sanitizer 等価性）', () => {
      const viaBorder = div().border({ width: '1px' }).css.render();
      const el = div();
      el.style.border.setBorderWidth('1px');
      const viaIndividual = el.css.render();
      expect(viaBorder).toBe(viaIndividual);
    });
  });
});
