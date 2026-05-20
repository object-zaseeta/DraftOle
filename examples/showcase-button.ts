/**
 * DraftOle Showcase: Button（Fluent :hover 対応）
 *
 * page-first View DSL（`Page` / `Section` / `Button` / `Text` + modifier 連鎖）で
 * Button コンポーネントを宣言的に記述するショーケース。
 * `Root` や生 HTML タグファクトリ（html/body/button）は使用しない。
 * `:hover` 擬似クラスも HtmlTag の Fluent メソッド `.hover(s => s.method(...))` で記述する。
 *
 * ─────────────────────────────────────────────────────────────
 * Swift 版想定行数: 約 7〜8 行（Button body 本体部分）
 * 参考（SwiftUI 相当実装）:
 *   struct HoverButton: View {
 *     @State private var hovering = false
 *     var body: some View {
 *       Button("クリック") {}
 *         .padding(.horizontal, 16)
 *         .padding(.vertical, 10)
 *         .background(hovering ? Color(white: 0.10) : Color(white: 0.06))
 *         .foregroundColor(.white)
 *         .onHover { hovering = $0 }
 *     }
 *   }
 * ─────────────────────────────────────────────────────────────
 *
 * 実行: pnpm tsx examples/showcase-button.ts
 * 期待: HTML 文字列生成成功 + 出力 CSS 中に `:hover` セレクタが出現する。
 */
import { Button, Section, ViewText as Text, page } from 'draft-ole';

// ── Button 本体（Fluent チェーンのみ + :hover） ──
const btn = Button({ type: 'button' }, Text('クリック'))
  .padding('10px 16px')
  .background('rgba(124, 92, 255, 0.18)')
  .foregroundStyle('#ffffff')
  .hover((s) => s.background('rgba(124, 92, 255, 0.35)').color('#ffffff'));

// ── Page 構築 ──
const doc = page(
  Section(btn)
    .background('#0b1220')
    .padding(36)
    .frame({ maxWidth: 640 }),
  { lang: 'ja', title: 'DraftOle Showcase: Button' },
);

const out = doc.render();

// 観察可能な完了条件: 出力中に `:hover` 定義が現れる
if (!out.includes(':hover')) {
  throw new Error('[showcase-button] 出力に :hover セレクタが含まれていません');
}

doc.export('./.out/runs/showcase_button');
console.log('✓ Button showcase generated with :hover → .out/runs/showcase_button/');
