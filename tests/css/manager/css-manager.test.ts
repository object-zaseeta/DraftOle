/**
 * Task 8.2: CssManager -- CSS中央管理のテスト
 *
 * TDD RED phase: CssManager の全機能を検証する。
 * - CssStyleManager と CssPositionMaker を統合的に保持する
 * - render() でスタイルCSS + レイアウトCSS の結合文字列を出力する
 * - renderCss() でスコープドCSS形式を出力する
 * - tagPath の管理・更新機能
 * - LazyLayoutRegister 参照の伝播
 * - CssConfig によるスコープドCSS有効/無効の切り替え
 * - デフォルト値で全プロパティクラスを初期化する
 * - CssManagerInstance インターフェースに準拠する
 *
 * Requirements: 1.1, 1.4, 1.5, 8.2, 8.3, 8.5
 */
import { describe, it, expect, vi } from 'vitest';
import { PseudoStyleBuilder } from '../../../src/css/style/pseudo/pseudo-style-builder.js';
import { CssManager } from '../../../src/css/manager/css-manager.js';
import { CssStyleManager } from '../../../src/css/manager/css-style-manager.js';
import { CssPositionMaker } from '../../../src/css/layout/position-maker/css-position-maker.js';
import { CssConfig } from '../../../src/css/config/css-config.js';
import { LazyLayoutManager } from '../../../src/css/layout/lazy-layout/lazy-layout-manager.js';
import { generateScopedClassName } from '../../../src/css/utils/scoped-css-generator.js';

// ============================================================
// ヘルパー
// ============================================================

function makeSUT(tagPath = ''): CssManager {
  return new CssManager(tagPath);
}

// ============================================================
// CssManager
// ============================================================

describe('CssManager', () => {
  // ── CssManagerInstance 準拠 ──

  describe('CssManagerInstance準拠', () => {
    it('render() メソッドを持つ', () => {
      const sut = makeSUT();
      expect(typeof sut.render).toBe('function');
    });

    it('renderCss() メソッドを持つ', () => {
      const sut = makeSUT();
      expect(typeof sut.renderCss).toBe('function');
    });

    it('tagPath プロパティを持つ', () => {
      const sut = makeSUT('html>body>div');
      expect(sut.tagPath).toBe('html>body>div');
    });

    it('updateTagPath() メソッドを持つ', () => {
      const sut = makeSUT();
      expect(typeof sut.updateTagPath).toBe('function');
    });

    it('layout プロパティが CssPositionMaker インスタンスを返す', () => {
      const sut = makeSUT();
      expect(sut.layout).toBeInstanceOf(CssPositionMaker);
    });

    it('styleManager プロパティが CssStyleManager インスタンスを返す', () => {
      const sut = makeSUT();
      expect(sut.styleManager).toBeInstanceOf(CssStyleManager);
    });

    it('updateLazyLayoutRegister() メソッドを持つ', () => {
      const sut = makeSUT();
      expect(typeof sut.updateLazyLayoutRegister).toBe('function');
    });
  });

  // ── デフォルト初期化 ──

  describe('デフォルト初期化', () => {
    it('デフォルト tagPath は空文字列', () => {
      const sut = makeSUT();
      expect(sut.tagPath).toBe('');
    });

    it('コンストラクタで tagPath を指定できる', () => {
      const sut = makeSUT('html>body>div');
      expect(sut.tagPath).toBe('html>body>div');
    });

    it('layout が初期化されている', () => {
      const sut = makeSUT();
      expect(sut.layout).toBeDefined();
    });

    it('styleManager が初期化されている', () => {
      const sut = makeSUT();
      expect(sut.styleManager).toBeDefined();
    });

    it('デフォルト config でスコープドCSS有効', () => {
      const sut = makeSUT();
      expect(sut.config.scopedCssEnabled).toBe(true);
    });

    it('デフォルト config で出力モード inline', () => {
      const sut = makeSUT();
      expect(sut.config.outputMode).toBe('inline');
    });

    it('プロパティ未設定の場合、render() は空文字列を返す', () => {
      const sut = makeSUT();
      expect(sut.render()).toBe('');
    });

    it('プロパティ未設定の場合、renderCss() は空文字列を返す', () => {
      const sut = makeSUT();
      expect(sut.renderCss()).toBe('');
    });
  });

  // ── tagPath 管理 ──

  describe('tagPath管理', () => {
    it('updateTagPath() で tagPath を更新できる', () => {
      const sut = makeSUT('html>body');
      sut.updateTagPath('html>body>div');
      expect(sut.tagPath).toBe('html>body>div');
    });

    it('updateTagPath() で layout の tagPath も更新される', () => {
      const sut = makeSUT('html>body');
      sut.updateTagPath('html>body>div');
      expect(sut.layout.tagPath).toBe('html>body>div');
    });
  });

  // ── render() 統合出力 ──

  describe('render()統合出力', () => {
    it('スタイルCSS のみの場合、スタイルCSS を返す', () => {
      const sut = makeSUT();
      sut.styleManager.style.font.setFontSize('16px');
      expect(sut.render()).toBe('font-size: 16px;');
    });

    it('レイアウトCSS のみの場合、レイアウトCSS を返す', () => {
      const sut = makeSUT('html>body>div');
      sut.layout.placeAbsoluteWith((b) => {
        b.top(100, 'px');
        b.left(200, 'px');
      });
      const rendered = sut.render();
      expect(rendered).toContain('left: 200px;');
      expect(rendered).toContain('position: absolute;');
      expect(rendered).toContain('top: 100px;');
    });

    it('スタイル + レイアウト両方がある場合、結合して返す', () => {
      const sut = makeSUT('html>body>div');
      sut.styleManager.style.font.setFontSize('16px');
      sut.layout.placeAbsoluteWith((b) => {
        b.top(100, 'px');
      });
      const rendered = sut.render();
      expect(rendered).toContain('font-size: 16px;');
      expect(rendered).toContain('position: absolute;');
      expect(rendered).toContain('top: 100px;');
    });

    it('スタイルもレイアウトも未設定の場合、空文字列を返す', () => {
      const sut = makeSUT();
      expect(sut.render()).toBe('');
    });
  });

  // ── renderCss() スコープドCSS出力 ──

  describe('renderCss()スコープドCSS出力', () => {
    it('スコープドCSS形式で出力する（._hashXXXX { ... }）', () => {
      const tagPath = 'html>body>div';
      const sut = makeSUT(tagPath);
      sut.styleManager.style.font.setFontSize('16px');

      const expected = generateScopedClassName(tagPath);
      const result = sut.renderCss();

      expect(result).toContain(`.${expected}`);
      expect(result).toContain('{');
      expect(result).toContain('font-size: 16px;');
      expect(result).toContain('}');
    });

    it('スタイル + レイアウト結合のスコープドCSSを出力する', () => {
      const tagPath = 'html>body>div';
      const sut = makeSUT(tagPath);
      sut.styleManager.style.font.setFontSize('16px');
      sut.layout.placeAbsoluteWith((b) => {
        b.top(100, 'px');
      });

      const result = sut.renderCss();
      expect(result).toContain('font-size: 16px;');
      expect(result).toContain('position: absolute;');
      expect(result).toContain('top: 100px;');
    });

    it('プロパティ未設定の場合、空文字列を返す', () => {
      const sut = makeSUT('html>body>div');
      expect(sut.renderCss()).toBe('');
    });

    it('同一タグパスで常に同一のクラス名を生成する（決定的ハッシュ）', () => {
      const tagPath = 'html>body>div';
      const sut1 = makeSUT(tagPath);
      const sut2 = makeSUT(tagPath);
      sut1.styleManager.style.font.setFontSize('16px');
      sut2.styleManager.style.font.setFontSize('16px');

      const result1 = sut1.renderCss();
      const result2 = sut2.renderCss();
      expect(result1).toBe(result2);
    });
  });

  // ── CssConfig 連携 ──

  describe('CssConfig連携', () => {
    it('カスタム CssConfig を渡せる', () => {
      const config = new CssConfig({ scopedCssEnabled: false });
      const sut = new CssManager('html>body>div', config);
      expect(sut.config.scopedCssEnabled).toBe(false);
    });

    it('スコープドCSS無効時、renderCss() はインラインスタイル形式を返す', () => {
      const config = new CssConfig({ scopedCssEnabled: false });
      const sut = new CssManager('html>body>div', config);
      sut.styleManager.style.font.setFontSize('16px');

      const result = sut.renderCss();
      // スコープドCSS無効時は、クラス名ラッパーなしの CSS 文字列
      expect(result).not.toContain('._');
      expect(result).not.toContain('{');
      expect(result).toBe('font-size: 16px;');
    });

    it('スコープドCSS有効時、renderCss() はスコープド形式を返す', () => {
      const config = new CssConfig({ scopedCssEnabled: true });
      const sut = new CssManager('html>body>div', config);
      sut.styleManager.style.font.setFontSize('16px');

      const result = sut.renderCss();
      expect(result).toContain('._');
      expect(result).toContain('{');
      expect(result).toContain('}');
    });
  });

  // ── LazyLayoutRegister 伝播 ──

  describe('LazyLayoutRegister伝播', () => {
    it('updateLazyLayoutRegister() で layout に伝播する', () => {
      const sut = makeSUT('html>body>div');
      const register = new LazyLayoutManager();

      sut.updateLazyLayoutRegister(register);
      expect(sut.layout.getLLRegister()).toBe(register);
    });

    it('updateLazyLayoutRegister(undefined) で参照をクリアする', () => {
      const sut = makeSUT('html>body>div');
      const register = new LazyLayoutManager();

      sut.updateLazyLayoutRegister(register);
      sut.updateLazyLayoutRegister(undefined);
      expect(sut.layout.getLLRegister()).toBeUndefined();
    });
  });

  // ── インスタンス独立性 ──

  describe('インスタンス独立性', () => {
    it('異なるインスタンスの styleManager は独立している', () => {
      const sut1 = makeSUT();
      const sut2 = makeSUT();

      sut1.styleManager.style.font.setFontSize('16px');

      expect(sut1.render()).toContain('font-size: 16px;');
      expect(sut2.render()).toBe('');
    });

    it('異なるインスタンスの layout は独立している', () => {
      const sut1 = makeSUT('path1');
      const sut2 = makeSUT('path2');

      sut1.layout.placeAbsoluteWith((b) => {
        b.top(100, 'px');
      });

      expect(sut1.render()).toContain('top: 100px;');
      expect(sut2.render()).toBe('');
    });

    it('同一インスタンスの layout は常に同じオブジェクトを返す', () => {
      const sut = makeSUT();
      expect(sut.layout).toBe(sut.layout);
    });

    it('同一インスタンスの styleManager は常に同じオブジェクトを返す', () => {
      const sut = makeSUT();
      expect(sut.styleManager).toBe(sut.styleManager);
    });
  });

  // ── 複合シナリオ ──

  describe('複合シナリオ', () => {
    it('13プロパティクラス経由でスタイルを設定し、スコープドCSS出力', () => {
      const sut = makeSUT('html>body>div.card');
      sut.styleManager.style.font.setFontSize('16px');
      sut.styleManager.style.spacing.setMargin('10px');
      sut.styleManager.style.position.setDisplay('flex');

      const scopedCss = sut.renderCss();
      expect(scopedCss).toContain('font-size: 16px;');
      expect(scopedCss).toContain('margin: 10px;');
      expect(scopedCss).toContain('display: flex;');
    });

    it('スタイル + レイアウト + スコープドCSS の統合出力', () => {
      const sut = makeSUT('html>body>div');
      sut.styleManager.style.font.setFontSize('16px');
      sut.layout.placeAbsoluteWith((b) => {
        b.top(50, 'px');
        b.left(100, 'px');
      });

      // render() はインラインスタイル形式
      const inlineCss = sut.render();
      expect(inlineCss).toContain('font-size: 16px;');
      expect(inlineCss).toContain('top: 50px;');

      // renderCss() はスコープドCSS形式
      const scopedCss = sut.renderCss();
      expect(scopedCss).toContain('._');
      expect(scopedCss).toContain('font-size: 16px;');
      expect(scopedCss).toContain('top: 50px;');
    });
  });

  // ── 擬似クラス対応 renderCss() 拡張 (Task 2.2) ──

  describe('擬似クラス対応renderCss()拡張', () => {
    it('擬似クラス未設定時の renderCss() 出力は従来形式と完全同一', () => {
      // pseudo を一切設定しない場合、従来の単一ブロック出力と等値であること。
      const tagPath = 'html>body>div';
      const sut = makeSUT(tagPath);
      sut.styleManager.style.font.setFontSize('16px');

      const expectedClass = generateScopedClassName(tagPath);
      const expectedOutput = `.${expectedClass} {\nfont-size: 16px;\n}`;

      expect(sut.renderCss()).toBe(expectedOutput);
    });

    it('pseudo 設定時に base ブロック + pseudo ブロックの multi-block 文字列を返す', () => {
      const tagPath = 'html>body>div';
      const sut = makeSUT(tagPath);
      sut.styleManager.style.font.setFontSize('16px');
      sut.styleManager.style.pseudo.setHover(new PseudoStyleBuilder().background('#eee'));

      const className = generateScopedClassName(tagPath);
      const result = sut.renderCss();

      // base ブロックが含まれる
      expect(result).toContain(`.${className} {\nfont-size: 16px;\n}`);
      // :hover ブロックが含まれる
      expect(result).toContain(`.${className}:hover {`);
      expect(result).toContain('background: #eee;');
      // base と pseudo が改行で結合されている
      expect(result).toMatch(
        new RegExp(`\\.${className} \\{[^]*?\\}\\n\\.${className}:hover \\{`),
      );
    });

    it('scopedCssEnabled=false + pseudo 設定時、pseudo ブロックは出力されず警告が 1 回のみ発火する', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const config = new CssConfig({ scopedCssEnabled: false });
        const sut = new CssManager('html>body>div', config);
        sut.styleManager.style.font.setFontSize('16px');
        sut.styleManager.style.pseudo.setHover(new PseudoStyleBuilder().background('#eee'));

        // 1 回目の renderCss() 呼び出し
        const result1 = sut.renderCss();
        // pseudo ブロックは出力されない（スコープクラス自体も無い）
        expect(result1).not.toContain(':hover');
        expect(result1).not.toContain('background: #eee;');
        // base のインラインスタイルのみ
        expect(result1).toBe('font-size: 16px;');
        // 警告が 1 回発火
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy.mock.calls[0]?.[0]).toContain('pseudo-class');

        // 2 回目以降の呼び出しでも警告は重複発火しない
        sut.renderCss();
        sut.renderCss();
        expect(warnSpy).toHaveBeenCalledTimes(1);
      } finally {
        warnSpy.mockRestore();
      }
    });
  });
});

describe('renderCss(resolver) — css-config-pipeline-wiring', () => {
  it('resolver 未指定（既存挙動）→ wrapper class が debuggable 形式と byte-equivalent', () => {
    const sut = new CssManager('html>body>div');
    sut.styleManager.style.font.setFontSize('16px');
    const result = sut.renderCss();
    // 既存フォーマット: `_<prefix>__<hash>` または `_<hash>`
    expect(result).toMatch(/^\._[a-z0-9_-]+\s*\{/);
    // minify-only 形式 `_<8hex> {` ではない（prefix を含む）
    expect(result).toMatch(/^\._[a-z0-9-]+__[0-9a-f]{8}\s*\{/);
  });

  it('resolver: minify 有効 → wrapper class が `/^_[0-9a-f]{8}$/` 形式', async () => {
    const { createIdentifierResolver } = await import(
      '../../../src/css/utils/identifier-resolver.js'
    );
    const minifyResolver = createIdentifierResolver({ minify: true });
    const sut = new CssManager('html>body>div');
    sut.styleManager.style.font.setFontSize('16px');
    const result = sut.renderCss(minifyResolver);
    // wrapper class は `_<8hex>` 形式
    expect(result).toMatch(/^\._[0-9a-f]{8}\s*\{/);
    // 既存の debuggable prefix は含まれない
    expect(result).not.toMatch(/__[0-9a-f]{8}/);
  });

  it('resolver: defaultIdentifierResolver → 既存 byte-equivalent', async () => {
    const { defaultIdentifierResolver } = await import(
      '../../../src/css/utils/identifier-resolver.js'
    );
    const sut = new CssManager('html>body>div');
    sut.styleManager.style.font.setFontSize('16px');
    const withResolver = sut.renderCss(defaultIdentifierResolver);
    const withoutResolver = sut.renderCss();
    expect(withResolver).toBe(withoutResolver);
  });
});

// ============================================================
// Task 6.2: branch coverage 補強 — global-branch-90-percent / Requirement 4.2
// ============================================================
//
// CssManager の branch カバレッジを 82.53% → 90%+ に引き上げるための追加テスト。
//
// 対象未到達分岐:
// - resolveTemplateSelector: `&` 以外 / ` ` 始まり / fallback 経路（line 85-87）
// - renderRegisteredEntry: 空 properties + selectors のみ / 空 selector props（line 94, 100）
// - renderCss(scopedCss=false) の cssBody / hasRegistered / hasPseudo の組み合わせ
//   （line 293, 297, 298）
// - 擬似警告 one-shot フラグ（line 287-292）の追加バリエーション
// - registerTemplate の duplicate key 冪等性（line 228-230）
// - _renderMediaBlocks の空 props.size スキップ（line 358）
// - _renderRegisteredBlocks の rendered === '' スキップ（line 375）
describe('CssManager — branch coverage 補強 (task 6.2)', () => {
  // ── registerTemplate の冪等性（line 228-230） ──

  describe('registerTemplate duplicate key 検出', () => {
    it('同一 (tagPath, bodyHash) を再登録しても className は同値で buffer は重複しない', async () => {
      const { createStyleTemplate } = await import(
        '../../../src/css/variables/style-template.js'
      );
      const { defaultIdentifierResolver } = await import(
        '../../../src/css/utils/identifier-resolver.js'
      );
      const sut = new CssManager('html>body>div');
      const tpl = createStyleTemplate({ properties: { display: 'flex' } });
      const c1 = sut.registerTemplate(tpl, defaultIdentifierResolver, 'html>body>div');
      const c2 = sut.registerTemplate(tpl, defaultIdentifierResolver, 'html>body>div');
      expect(c1).toBe(c2);
      // 出力にも duplicate rule は含まれない
      const out = sut.renderCss();
      const occurrences = out.split(`.${c1} {`).length - 1;
      expect(occurrences).toBe(1);
    });
  });

  // ── 擬似警告 one-shot フラグ（line 287-292） ──

  describe('擬似警告 one-shot フラグ', () => {
    it('pseudo 未設定の scopedCssEnabled=false 状態では warn は発火しない', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const config = new CssConfig({ scopedCssEnabled: false });
        const sut = new CssManager('html>body>div', config);
        sut.styleManager.style.font.setFontSize('16px');
        sut.renderCss();
        sut.renderCss();
        expect(warnSpy).not.toHaveBeenCalled();
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('pseudo を後から追加した場合でも 警告は最初の renderCss() で 1 回だけ発火する', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const config = new CssConfig({ scopedCssEnabled: false });
        const sut = new CssManager('html>body>span', config);
        sut.styleManager.style.font.setFontSize('14px');
        // pseudo を設定する前は warn なし
        sut.renderCss();
        expect(warnSpy).not.toHaveBeenCalled();
        // pseudo 設定 → 1 回 warn
        sut.styleManager.style.pseudo.setHover(
          new PseudoStyleBuilder().background('#fff'),
        );
        sut.renderCss();
        expect(warnSpy).toHaveBeenCalledTimes(1);
        // 以降 renderCss() を何度呼んでも追加発火しない
        sut.renderCss();
        sut.renderCss();
        sut.renderCss();
        expect(warnSpy).toHaveBeenCalledTimes(1);
      } finally {
        warnSpy.mockRestore();
      }
    });
  });

  // ── scopedCssEnabled=false 分岐の空ボディ組合せ（line 293, 297, 298） ──

  describe('scopedCssEnabled=false の cssBody/registered 組合せ', () => {
    it('cssBody 空 + registered 無し + pseudo 無し → 空文字列', () => {
      const config = new CssConfig({ scopedCssEnabled: false });
      const sut = new CssManager('html>body>div', config);
      expect(sut.renderCss()).toBe('');
    });

    it('cssBody 非空 + registered 無し → cssBody のみ返す', () => {
      const config = new CssConfig({ scopedCssEnabled: false });
      const sut = new CssManager('html>body>div', config);
      sut.styleManager.style.font.setFontSize('16px');
      expect(sut.renderCss()).toBe('font-size: 16px;');
    });

    it('cssBody 空 + registered 有り → registered ブロックのみ join して返す', async () => {
      const { createStyleTemplate } = await import(
        '../../../src/css/variables/style-template.js'
      );
      const { defaultIdentifierResolver } = await import(
        '../../../src/css/utils/identifier-resolver.js'
      );
      const config = new CssConfig({ scopedCssEnabled: false });
      const sut = new CssManager('html>body>div', config);
      const tpl = createStyleTemplate({ properties: { display: 'flex' } });
      const className = sut.registerTemplate(
        tpl,
        defaultIdentifierResolver,
        'html>body>div',
      );
      const result = sut.renderCss();
      // cssBody が空のため、 cssBody は接頭辞として含まれない
      expect(result).toContain(`.${className} {`);
      expect(result).toContain('display: flex;');
      // 先頭はクラス・ブロックである（インラインスタイルではない）
      expect(result.startsWith(`.${className}`)).toBe(true);
    });

    it('cssBody 非空 + registered 有り → cssBody と registered を改行で結合', async () => {
      const { createStyleTemplate } = await import(
        '../../../src/css/variables/style-template.js'
      );
      const { defaultIdentifierResolver } = await import(
        '../../../src/css/utils/identifier-resolver.js'
      );
      const config = new CssConfig({ scopedCssEnabled: false });
      const sut = new CssManager('html>body>div', config);
      sut.styleManager.style.font.setFontSize('16px');
      const tpl = createStyleTemplate({ properties: { display: 'flex' } });
      const className = sut.registerTemplate(
        tpl,
        defaultIdentifierResolver,
        'html>body>div',
      );
      const result = sut.renderCss();
      // 先頭にインラインスタイル
      expect(result.startsWith('font-size: 16px;')).toBe(true);
      // 改行を挟んで registered ブロック
      expect(result).toContain(`\n.${className} {`);
      expect(result).toContain('display: flex;');
    });
  });

  // ── scopedCssEnabled=true 分岐の空ボディ組合せ（line 304） ──

  describe('scopedCssEnabled=true の空ボディ早期 return 補強', () => {
    it('cssBody 空 + pseudo 無し + registered 無し + media 無し → 空文字列', () => {
      const sut = new CssManager('html>body>div');
      expect(sut.renderCss()).toBe('');
    });

    it('cssBody 空 + media のみ → @media ブロックのみ出力（早期 return しない）', () => {
      const sut = new CssManager('html>body>div');
      sut.addMediaRule(640, { fontSize: '14px' });
      const result = sut.renderCss();
      expect(result).toContain('@media (min-width: 640px)');
      expect(result).toContain('font-size: 14px;');
    });
  });

  // ── renderRegisteredEntry: selectors のみ／空 selector props（line 94, 100） ──

  describe('登録テンプレート: selectors のみ / 空 selector props', () => {
    it('properties 空 + selectors のみ → properties ブロックは出力されず selector ブロックのみ', async () => {
      const { createStyleTemplate } = await import(
        '../../../src/css/variables/style-template.js'
      );
      const { defaultIdentifierResolver } = await import(
        '../../../src/css/utils/identifier-resolver.js'
      );
      const sut = new CssManager('html>body>button');
      const tpl = createStyleTemplate({
        properties: {},
        selectors: { hover: { background: 'blue' } },
      });
      const className = sut.registerTemplate(
        tpl,
        defaultIdentifierResolver,
        'html>body>button',
      );
      const result = sut.renderCss();
      // properties 空のため base ブロックは含まれない
      expect(result).not.toMatch(new RegExp(`\\.${className} \\{\\n`));
      // :hover ブロックのみ
      expect(result).toContain(`.${className}:hover {`);
      expect(result).toContain('background: blue;');
    });

    it('selectors のキーに空 props があるブロックはスキップされる', async () => {
      const { createStyleTemplate } = await import(
        '../../../src/css/variables/style-template.js'
      );
      const { defaultIdentifierResolver } = await import(
        '../../../src/css/utils/identifier-resolver.js'
      );
      const sut = new CssManager('html>body>button');
      const tpl = createStyleTemplate({
        properties: { padding: '8px' },
        selectors: {
          hover: {}, // 空 → スキップ
          focus: { outline: 'none' }, // 有効
        },
      });
      const className = sut.registerTemplate(
        tpl,
        defaultIdentifierResolver,
        'html>body>button',
      );
      const result = sut.renderCss();
      // 空 props の hover ブロックは含まれない
      expect(result).not.toContain(`.${className}:hover`);
      // focus ブロックは含まれる
      expect(result).toContain(`.${className}:focus {`);
      expect(result).toContain('outline: none;');
    });

    it('selectors も properties も全て空のテンプレートは _renderRegisteredBlocks でスキップされる', async () => {
      const { createStyleTemplate } = await import(
        '../../../src/css/variables/style-template.js'
      );
      const { defaultIdentifierResolver } = await import(
        '../../../src/css/utils/identifier-resolver.js'
      );
      const sut = new CssManager('html>body>div');
      const emptyTpl = createStyleTemplate({
        properties: {},
        selectors: { hover: {} },
      });
      const validTpl = createStyleTemplate({
        properties: { color: 'red' },
      });
      const emptyClass = sut.registerTemplate(
        emptyTpl,
        defaultIdentifierResolver,
        'html>body>div',
      );
      const validClass = sut.registerTemplate(
        validTpl,
        defaultIdentifierResolver,
        'html>body>div',
      );
      const result = sut.renderCss();
      // 空テンプレートのクラスは出力されない（renderRegisteredEntry が '' を返すためスキップ）
      expect(result).not.toContain(`.${emptyClass}`);
      // 有効テンプレートは出力される
      expect(result).toContain(`.${validClass} {`);
      expect(result).toContain('color: red;');
    });
  });

  // ── resolveTemplateSelector: `&` / ` ` / fallback 経路（line 85-87） ──

  describe('selectors キーの解決経路', () => {
    it('スペース始まりのキーは descendant selector として解決される', async () => {
      const { createStyleTemplate } = await import(
        '../../../src/css/variables/style-template.js'
      );
      const { defaultIdentifierResolver } = await import(
        '../../../src/css/utils/identifier-resolver.js'
      );
      const sut = new CssManager('html>body>div');
      const tpl = createStyleTemplate({
        properties: { color: 'black' },
        selectors: {
          ' .child': { color: 'red' },
        },
      });
      const className = sut.registerTemplate(
        tpl,
        defaultIdentifierResolver,
        'html>body>div',
      );
      const result = sut.renderCss();
      // ` .child` は `.{className} .child` として展開される
      expect(result).toContain(`.${className} .child {`);
      expect(result).toContain('color: red;');
    });

    it('既知 pseudo / `&` / ` ` のどれにも該当しないキーは fallback `:{key}` 経路', async () => {
      const { createStyleTemplate } = await import(
        '../../../src/css/variables/style-template.js'
      );
      const { defaultIdentifierResolver } = await import(
        '../../../src/css/utils/identifier-resolver.js'
      );
      const sut = new CssManager('html>body>div');
      // PSEUDO_SELECTORS_SET に含まれない任意のキー名 → fallback `:`prefix
      const tpl = createStyleTemplate({
        properties: { color: 'black' },
        selectors: {
          'placeholder-shown': { color: 'gray' },
        },
      });
      const className = sut.registerTemplate(
        tpl,
        defaultIdentifierResolver,
        'html>body>div',
      );
      const result = sut.renderCss();
      // fallback → `.{className}:placeholder-shown`
      expect(result).toContain(`.${className}:placeholder-shown {`);
      expect(result).toContain('color: gray;');
    });

    it('`&` 始まりのキーは compound selector として `&` を除去して結合される', async () => {
      const { createStyleTemplate } = await import(
        '../../../src/css/variables/style-template.js'
      );
      const { defaultIdentifierResolver } = await import(
        '../../../src/css/utils/identifier-resolver.js'
      );
      const sut = new CssManager('html>body>div');
      const tpl = createStyleTemplate({
        properties: { color: 'black' },
        selectors: {
          '&.primary': { color: 'blue' },
        },
      });
      const className = sut.registerTemplate(
        tpl,
        defaultIdentifierResolver,
        'html>body>div',
      );
      const result = sut.renderCss();
      // `&.primary` → `.{className}.primary`
      expect(result).toContain(`.${className}.primary {`);
      expect(result).toContain('color: blue;');
    });
  });

  // ── _renderMediaBlocks: 空 props.size スキップ（line 358） ──

  describe('@media ルール: 空 props のブレークポイントはスキップ', () => {
    it('空 props のブレークポイントは @media ブロックを生成しない', () => {
      const sut = new CssManager('html>body>div');
      sut.styleManager.style.font.setFontSize('14px');
      // 空 props → bp map は作られるが size=0 のためスキップ
      sut.addMediaRule(640, {});
      // 有効な bp も登録
      sut.addMediaRule(1024, { fontSize: '18px' });
      const result = sut.renderCss();
      // 640px ブロックは出力されない
      expect(result).not.toContain('@media (min-width: 640px)');
      // 1024px ブロックは出力される
      expect(result).toContain('@media (min-width: 1024px)');
      expect(result).toContain('font-size: 18px;');
    });

    it('全 bp が空 props の場合 @media 出力は一切ない', () => {
      const sut = new CssManager('html>body>div');
      sut.styleManager.style.font.setFontSize('14px');
      sut.addMediaRule(640, {});
      sut.addMediaRule(1024, {});
      const result = sut.renderCss();
      expect(result).not.toContain('@media');
      // base のみ
      expect(result).toContain('font-size: 14px;');
    });
  });
});
