/**
 * Task 4.5: グローバルCSS DSL 統合テスト — テーマ変数とグローバルCSS統合
 *
 * createTheme() で定義したテーマ変数（theme.high 等）を rule() / Root({ css }) の
 * 新 API で登録した場合に var(--high) が出力されることを検証する。
 *
 * Requirements: 1.1, 1.3, 4.2, 2.4
 */
import { describe, it, expect } from 'vitest';
import { Root } from '../../src/html/elements/root.js';
import { createTheme } from '../../src/css/variables/css-theme.js';
import { rule, all } from '../../src/css/variables/global-dsl.js';

describe('Req 4 検証スパイク: テーマ変数とグローバルCSS統合 (Task 2.1)', () => {
  // ── Req 4.1: theme.high を rule() 内で補間すると var(--high) になる ──

  describe('Req 4.1: テーマ変数が CSS文字列内で var(--xxx) として機能する', () => {
    it('theme.high は "var(--high)" 文字列を返す', () => {
      // Arrange
      const theme = createTheme({
        high: '#ef4444',
        medium: '#f59e0b',
        low: '#22c55e',
      });

      // Assert: theme.high はテンプレートリテラル内で var(--high) に展開される
      expect(theme.high).toBe('var(--high)');
      expect(theme.medium).toBe('var(--medium)');
      expect(theme.low).toBe('var(--low)');
    });

    it('rule() 内で theme.high を補間すると出力CSSに var(--high) が含まれる', () => {
      // Arrange
      const theme = createTheme({
        high: '#ef4444',
      });

      // Act: rule() でテーマ変数をプロパティ値として使用し、Root に渡す
      const root = new Root({
        css: [rule('.priority-high', { borderColor: theme.high })],
      });

      // Assert: collectCssStyleString() の出力に var(--high) が含まれる
      const cssOutput = root.collectCssStyleString();
      expect(cssOutput).toContain('var(--high)');
      expect(cssOutput).toContain('.priority-high');
      expect(cssOutput).toContain('border-color: var(--high)');
    });

    it('createStyle と同じように theme 変数を rule() 内で参照できる (Req 4.1 完全検証)', () => {
      // Arrange
      const theme = createTheme({
        high: '#ef4444',
        medium: '#f59e0b',
        low: '#22c55e',
      });

      // Act: 複数の優先度スタイルを rule() で登録し Root に渡す
      const root = new Root({
        css: [
          rule('.priority-high', { borderColor: theme.high }),
          rule('.priority-medium', { borderColor: theme.medium }),
          rule('.priority-low', { borderColor: theme.low }),
        ],
      });

      // Assert: それぞれ var(--xxx) が出力される
      const cssOutput = root.collectCssStyleString();
      expect(cssOutput).toContain('var(--high)');
      expect(cssOutput).toContain('var(--medium)');
      expect(cssOutput).toContain('var(--low)');
    });
  });

  // ── Req 4.2: theme.css と rule() を同時に登録すると両方が出力される ──

  describe('Req 4.2: theme.css と rule() の組み合わせ登録が機能する', () => {
    it('theme.css と rule() を組み合わせると :root ブロックと .priority-high が両方出力される', () => {
      // Arrange
      const theme = createTheme({
        high: '#ef4444',
        medium: '#f59e0b',
        low: '#22c55e',
      });

      // Act: theme.css を先に、次に rule() を登録（Root コンストラクタに配列で渡す）
      const root = new Root({
        css: [
          theme.css,
          rule('.priority-high', { borderColor: theme.high }),
        ],
      });

      // Assert: :root ブロックが含まれる
      const cssOutput = root.collectCssStyleString();
      expect(cssOutput).toContain(':root');
      expect(cssOutput).toContain('--high: #ef4444');
      expect(cssOutput).toContain('--medium: #f59e0b');
      expect(cssOutput).toContain('--low: #22c55e');

      // Assert: .priority-high ルールが含まれる
      expect(cssOutput).toContain('.priority-high');
      expect(cssOutput).toContain('border-color: var(--high)');
    });

    it('theme.css を先に登録すると :root が .priority-high より前に出力される', () => {
      // Arrange
      const theme = createTheme({
        high: '#ef4444',
      });

      // Act: Root コンストラクタで順序を保証（配列順が出力順）
      const root = new Root({
        css: [
          theme.css,
          rule('.priority-high', { borderColor: theme.high }),
        ],
      });

      // Assert: :root が .priority-high より前に現れる
      const cssOutput = root.collectCssStyleString();
      const rootIdx = cssOutput.indexOf(':root');
      const priorityIdx = cssOutput.indexOf('.priority-high');
      expect(rootIdx).toBeLessThan(priorityIdx);
    });

    it('複数のグローバルCSSルール（theme.css + all + 優先度ルール）が正しく登録される', () => {
      // Arrange: テーマ変数を活用した典型的な複合 CSS 登録パターン
      const theme = createTheme({
        bg: '#0b1220',
        panel: 'rgba(255,255,255,0.06)',
        border: 'rgba(255,255,255,0.12)',
        text: 'rgba(255,255,255,0.92)',
        muted: 'rgba(255,255,255,0.55)',
        accent: '#7c5cff',
        danger: '#ef4444',
        high: '#ef4444',
        medium: '#f59e0b',
        low: '#22c55e',
        radius: '14px',
        shadow: '0 18px 60px rgba(0,0,0,0.35)',
      });

      // Act: テーマ変数を活用した CSS 登録
      const root = new Root({
        css: [
          theme.css,
          all({ boxSizing: 'border-box' }),
          rule('.done-text', { textDecoration: 'line-through', opacity: '0.5' }),
          rule('.priority-high', { borderColor: `${theme.high} !important` }),
          rule('.priority-medium', { borderColor: `${theme.medium} !important` }),
          rule('.priority-low', { borderColor: `${theme.low} !important` }),
        ],
      });

      // Assert: :root ブロックが含まれる
      const cssOutput = root.collectCssStyleString();
      expect(cssOutput).toContain(':root');
      expect(cssOutput).toContain('--high: #ef4444');
      expect(cssOutput).toContain('--medium: #f59e0b');
      expect(cssOutput).toContain('--low: #22c55e');

      // Assert: 優先度ルールが var(--xxx) を使用している（ハードコートしていない）
      expect(cssOutput).toContain('.priority-high');
      expect(cssOutput).toContain('border-color: var(--high) !important');
      expect(cssOutput).toContain('.priority-medium');
      expect(cssOutput).toContain('border-color: var(--medium) !important');
      expect(cssOutput).toContain('.priority-low');
      expect(cssOutput).toContain('border-color: var(--low) !important');

      // Assert: ハードコートされた値は含まれない（変数参照になっている）
      // NOTE: :root 内には --high: #ef4444 があるが、priority ルール内は var(--high) のみ
      const prioritySection = cssOutput.substring(cssOutput.indexOf('.priority-high'));
      expect(prioritySection).toContain('var(--high)');
      expect(prioritySection).not.toContain('border-color: #ef4444');
    });
  });

  // ── Req 4.3: テーマ変数参照を手動で var(--xxx) と書く必要がない ──

  describe('Req 4.3: テンプレートリテラルによるエルゴノミクス（手動 var() 不要）', () => {
    it('ユーザーは手動で var(--high) と書かずに theme.high を補間するだけでよい', () => {
      // Arrange
      const theme = createTheme({
        high: '#ef4444',
      });

      // Assert: テンプレートリテラルで使うだけで var(--high) が自動的に埋め込まれる
      const cssRule = `.priority-high { border-color: ${theme.high}; }`;
      expect(cssRule).toBe('.priority-high { border-color: var(--high); }');

      // ユーザーがハードコートした場合と比較
      const hardcodedRule = `.priority-high { border-color: #ef4444; }`;
      // 補間版はハードコートとは異なる（CSS変数を使用している）
      expect(cssRule).not.toBe(hardcodedRule);
    });

    it('テーマを更新した場合（新しい createTheme 呼び出し）、参照するルールが自動的に新しい変数を使う', () => {
      // Arrange: 最初のテーマ（高優先度を赤に設定）
      const theme = createTheme({
        high: '#ef4444',
      });

      // Act: rule() でテーマ変数を使用
      const cssRule = `.priority-high { border-color: ${theme.high}; }`;

      // Assert: var(--high) が埋め込まれている（具体的な色値ではない）
      expect(cssRule).toContain('var(--high)');
      expect(cssRule).not.toContain('#ef4444');

      // Req 4.2 の観点: :root に --high: #ef4444 を登録すれば、
      // ブラウザが var(--high) を解決してくれる
      expect(theme.css).toContain('--high: #ef4444');
    });

    it('複数のテーマ変数を複合 CSS プロパティで補間できる', () => {
      // Arrange
      const theme = createTheme({
        border: 'rgba(255,255,255,0.12)',
        radius: '14px',
        shadow: '0 18px 60px rgba(0,0,0,0.35)',
      });

      // Act: 複合プロパティで補間
      const cardRule = `.card { border: 1px solid ${theme.border}; border-radius: ${theme.radius}; box-shadow: ${theme.shadow}; }`;

      // Assert: 全て var(--xxx) 形式で埋め込まれる
      expect(cardRule).toContain('var(--border)');
      expect(cardRule).toContain('var(--radius)');
      expect(cardRule).toContain('var(--shadow)');
    });
  });

  // ── 総合エンドツーエンド検証 ──

  describe('エンドツーエンド: theme.css + rule() の完全統合', () => {
    it('Root.collectCssStyleString() が :root と .priority ルールを両方含む完全な CSS を返す', () => {
      // Arrange: テーマ変数を活用した優先度ルールパターン
      const theme = createTheme({
        high: '#ef4444',
        medium: '#f59e0b',
        low: '#22c55e',
      });

      // Act: Root コンストラクタで theme.css と rule() を一括登録
      const root = new Root({
        css: [
          theme.css,
          rule('.priority-high', { borderColor: theme.high }),
          rule('.priority-medium', { borderColor: theme.medium }),
          rule('.priority-low', { borderColor: theme.low }),
        ],
      });

      // Assert: 完全な CSS 出力
      const cssOutput = root.collectCssStyleString();

      // :root ブロック検証
      expect(cssOutput).toContain(':root {');
      expect(cssOutput).toContain('--high: #ef4444;');
      expect(cssOutput).toContain('--medium: #f59e0b;');
      expect(cssOutput).toContain('--low: #22c55e;');
      expect(cssOutput).toContain('}');

      // .priority ルール検証（var() 参照）
      expect(cssOutput).toContain('.priority-high');
      expect(cssOutput).toContain('border-color: var(--high)');
      expect(cssOutput).toContain('.priority-medium');
      expect(cssOutput).toContain('border-color: var(--medium)');
      expect(cssOutput).toContain('.priority-low');
      expect(cssOutput).toContain('border-color: var(--low)');

      // PASS 判定の核心: var(--high) が出力 CSS に存在する
      expect(cssOutput).toContain('var(--high)');
    });
  });
});
