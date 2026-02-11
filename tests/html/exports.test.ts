/**
 * Task 7.1: HTMLモジュールのエクスポート統合テスト
 *
 * すべての公開APIがパッケージのエントリポイントからインポートできることを検証する。
 * `import { div, p, h1 } from 'draft-ole'` 形式でのインポートが動作することを確認する。
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */
import { describe, it, expect } from 'vitest';

// Phase 1: Utils（既存）
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Exportableはコンパイル時のエクスポート検証
import type { Renderable, Exportable } from '../../src/index.js';

// HTMLモジュール全体をエントリポイントからインポート
import {
  // ── タグファクトリ関数（Req 9.1: src/html/tags/index.ts から再エクスポート）──
  // 基本
  html, head, body, div, p, span, script,
  // セマンティック
  header, footer, nav, main, section, article, aside, figure, figcaption,
  // テーブル
  table, thead, tbody, tfoot, tr, th, td, caption, colgroup,
  // リスト
  ul, ol, li, dl, dt, dd,
  // フォーム
  form, label, button, select, option, optgroup, textarea, fieldset, legend, datalist, output,
  // テキスト装飾
  strong, em, b, i, u, s, mark, small, sub, sup, code, pre, blockquote, q, cite, abbr, address, time, kbd, samp,
  // 見出し
  h1, h2, h3, h4, h5, h6,
  // メディア
  video, audio, picture, canvas, svg,
  // インタラクティブ
  details, summary, dialog, iframe, noscript,
  // 自己終了
  br, hr, img, input, meta, link, source, track, area, col, base, embed, wbr,
  // その他
  a, title, varTag,
  // テキスト
  Text,

  // ── 要素クラス（Req 9.2）──
  HtmlTag,
  PairType,
  SelfClosingType,
  TextType,
  Root,

  // ── 属性関連（Req 9.2）──
  HtmlAttribute,
  BaseAttributeBuilder,
  FormAttributeBuilder,
  InputAttributeBuilder,
  ImageAttributeBuilder,
  LinkAttributeBuilder,
  ButtonAttributeBuilder,

  // ── ユーティリティ（Req 9.2）──
  HTMLFormatter,
  normalizeClassNames,
  escapeHtml,

  // ── タグ種別（Req 9.2）──
  TAG_TYPES,
  SELF_CLOSING_TAGS,
  getTagStructure,
} from '../../src/index.js';

// 型のみのインポート（Req 9.2） — コンパイル時のエクスポート検証
/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  // タグ型
  TagType,
  TagStructure,
  // ファクトリヘルパー型
  AttributeMap,
  ChildArg,
  // プロトコル
  HTMLTagProtocol,
  HtmlAttributeManagerProtocol,
  TagGenerateProtocol,
  CssManagerType,
  JQueryManagerProtocol,
  AttributeBuilderProtocol,
  // 属性型
  HtmlAttributeValue,
  BooleanAttributeKey,
  KeyValueAttributeKey,
  AriaAttributeKey,
  InputType,
  ButtonType,
  // 要素型
  CssOutputMode,
  HtmlAttributeShape,
} from '../../src/index.js';
/* eslint-enable @typescript-eslint/no-unused-vars */

describe('Task 7.1: HTMLモジュールのエクスポート統合', () => {
  describe('Req 9.1: タグファクトリ関数のエクスポート', () => {
    it('ペアタグファクトリ関数がエクスポートされている', () => {
      // 基本
      expect(typeof div).toBe('function');
      expect(typeof p).toBe('function');
      expect(typeof span).toBe('function');
      expect(typeof html).toBe('function');
      expect(typeof head).toBe('function');
      expect(typeof body).toBe('function');
      expect(typeof script).toBe('function');
      // 見出し
      expect(typeof h1).toBe('function');
      expect(typeof h2).toBe('function');
      expect(typeof h3).toBe('function');
      expect(typeof h4).toBe('function');
      expect(typeof h5).toBe('function');
      expect(typeof h6).toBe('function');
      // セマンティック
      expect(typeof header).toBe('function');
      expect(typeof footer).toBe('function');
      expect(typeof nav).toBe('function');
      expect(typeof main).toBe('function');
      expect(typeof section).toBe('function');
      expect(typeof article).toBe('function');
      expect(typeof aside).toBe('function');
      expect(typeof figure).toBe('function');
      expect(typeof figcaption).toBe('function');
      // テーブル
      expect(typeof table).toBe('function');
      expect(typeof thead).toBe('function');
      expect(typeof tbody).toBe('function');
      expect(typeof tfoot).toBe('function');
      expect(typeof tr).toBe('function');
      expect(typeof th).toBe('function');
      expect(typeof td).toBe('function');
      expect(typeof caption).toBe('function');
      expect(typeof colgroup).toBe('function');
      // リスト
      expect(typeof ul).toBe('function');
      expect(typeof ol).toBe('function');
      expect(typeof li).toBe('function');
      expect(typeof dl).toBe('function');
      expect(typeof dt).toBe('function');
      expect(typeof dd).toBe('function');
      // フォーム
      expect(typeof form).toBe('function');
      expect(typeof label).toBe('function');
      expect(typeof button).toBe('function');
      expect(typeof select).toBe('function');
      expect(typeof option).toBe('function');
      expect(typeof optgroup).toBe('function');
      expect(typeof textarea).toBe('function');
      expect(typeof fieldset).toBe('function');
      expect(typeof legend).toBe('function');
      expect(typeof datalist).toBe('function');
      expect(typeof output).toBe('function');
      // テキスト装飾
      expect(typeof strong).toBe('function');
      expect(typeof em).toBe('function');
      expect(typeof b).toBe('function');
      expect(typeof i).toBe('function');
      expect(typeof u).toBe('function');
      expect(typeof s).toBe('function');
      expect(typeof mark).toBe('function');
      expect(typeof small).toBe('function');
      expect(typeof sub).toBe('function');
      expect(typeof sup).toBe('function');
      expect(typeof code).toBe('function');
      expect(typeof pre).toBe('function');
      expect(typeof blockquote).toBe('function');
      expect(typeof q).toBe('function');
      expect(typeof cite).toBe('function');
      expect(typeof abbr).toBe('function');
      expect(typeof address).toBe('function');
      expect(typeof time).toBe('function');
      expect(typeof kbd).toBe('function');
      expect(typeof samp).toBe('function');
      expect(typeof a).toBe('function');
      expect(typeof title).toBe('function');
    });

    it('メディアタグファクトリ関数がエクスポートされている', () => {
      expect(typeof video).toBe('function');
      expect(typeof audio).toBe('function');
      expect(typeof picture).toBe('function');
      expect(typeof canvas).toBe('function');
      expect(typeof svg).toBe('function');
    });

    it('インタラクティブタグファクトリ関数がエクスポートされている', () => {
      expect(typeof details).toBe('function');
      expect(typeof summary).toBe('function');
      expect(typeof dialog).toBe('function');
      expect(typeof iframe).toBe('function');
      expect(typeof noscript).toBe('function');
    });

    it('自己終了タグファクトリ関数がエクスポートされている', () => {
      expect(typeof br).toBe('function');
      expect(typeof hr).toBe('function');
      expect(typeof img).toBe('function');
      expect(typeof input).toBe('function');
      expect(typeof meta).toBe('function');
      expect(typeof link).toBe('function');
      expect(typeof source).toBe('function');
      expect(typeof track).toBe('function');
      expect(typeof area).toBe('function');
      expect(typeof col).toBe('function');
      expect(typeof base).toBe('function');
      expect(typeof embed).toBe('function');
      expect(typeof wbr).toBe('function');
    });

    it('Text()ファクトリ関数がエクスポートされている', () => {
      expect(typeof Text).toBe('function');
    });

    it('varTagファクトリ関数がエクスポートされている（予約語対応）', () => {
      expect(typeof varTag).toBe('function');
    });
  });

  describe('Req 9.2: インターフェース・型・クラスのエクスポート', () => {
    it('要素クラスがエクスポートされている', () => {
      expect(HtmlTag).toBeDefined();
      expect(PairType).toBeDefined();
      expect(SelfClosingType).toBeDefined();
      expect(TextType).toBeDefined();
      expect(Root).toBeDefined();
    });

    it('属性クラスがエクスポートされている', () => {
      expect(HtmlAttribute).toBeDefined();
      expect(BaseAttributeBuilder).toBeDefined();
      expect(FormAttributeBuilder).toBeDefined();
      expect(InputAttributeBuilder).toBeDefined();
      expect(ImageAttributeBuilder).toBeDefined();
      expect(LinkAttributeBuilder).toBeDefined();
      expect(ButtonAttributeBuilder).toBeDefined();
    });

    it('ユーティリティがエクスポートされている', () => {
      expect(HTMLFormatter).toBeDefined();
      expect(typeof normalizeClassNames).toBe('function');
      expect(typeof escapeHtml).toBe('function');
    });

    it('タグ種別定数がエクスポートされている', () => {
      expect(TAG_TYPES).toBeDefined();
      expect(SELF_CLOSING_TAGS).toBeDefined();
      expect(typeof getTagStructure).toBe('function');
    });
  });

  describe('Req 9.3: import { div, p, h1 } from "draft-ole" 形式のインポート', () => {
    it('ファクトリ関数でタグを生成しレンダリングできる', () => {
      const result = div({ class: 'container' }, h1('Title'), p('Body'));
      expect(result).toBeInstanceOf(PairType);
      expect(result.protoRender()).toBe(
        '<div class="container"><h1>Title</h1><p>Body</p></div>'
      );
    });

    it('属性ビルダーをファクトリと組み合わせて使える', () => {
      const attrs = new InputAttributeBuilder()
        .setId('email')
        .setInputType('email')
        .setPlaceholder('you@example.com')
        .setRequired(true)
        .build();

      const inputEl = input();
      for (const attr of attrs) {
        inputEl.addHtmlAttribute(attr);
      }
      const rendered = inputEl.protoRender();
      expect(rendered).toContain('id="email"');
      expect(rendered).toContain('type="email"');
      expect(rendered).toContain('placeholder="you@example.com"');
      expect(rendered).toContain('required');
    });
  });

  describe('Req 9.4: Phase 1 Renderable/Exportable互換性', () => {
    it('PairTypeはRenderableインターフェースを満たす', () => {
      const el = div('Hello');
      const renderable: Renderable = el;
      expect(typeof renderable.render).toBe('function');
      expect(renderable.render()).toContain('Hello');
    });

    it('SelfClosingTypeはRenderableインターフェースを満たす', () => {
      const el = img({ src: 'test.png', alt: 'test' });
      const renderable: Renderable = el;
      expect(typeof renderable.render).toBe('function');
      expect(renderable.render()).toContain('src="test.png"');
    });

    it('TextTypeはRenderableインターフェースを満たす', () => {
      const el = Text('Hello World');
      const renderable: Renderable = el;
      expect(typeof renderable.render).toBe('function');
      expect(renderable.render()).toBe('Hello World');
    });

    it('RootはRenderableインターフェースを満たす', () => {
      const root = new Root();
      root.addChild(div('content'));
      const renderable: Renderable = root;
      expect(typeof renderable.render).toBe('function');
      expect(renderable.render()).toContain('content');
    });
  });
});
