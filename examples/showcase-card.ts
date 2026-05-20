/**
 * DraftOle Showcase: Card
 *
 * page-first View DSL（`Page` / `Section` / `VStack` / `Text` + modifier 連鎖）で
 * Card コンポーネントを宣言的に記述するショーケース。
 * `Root` や生 HTML タグファクトリ（html/body/div）は使用しない。
 *
 * ─────────────────────────────────────────────────────────────
 * Swift 版想定行数: 9 行（DX Rubric 定量閾値 ±30%）
 * 参考（SwiftUI 相当実装）:
 *   VStack(alignment: .leading, spacing: 8) {              // 1
 *       Text("Fluent Card").font(.title2).bold()           // 2
 *       Text("padding / background / cornerRadius / "      // 3
 *            + "boxShadow を単一チェーンで記述")             // 4
 *   }                                                      // 5
 *   .padding(24)                                           // 6
 *   .background(Color.white)                               // 7
 *   .cornerRadius(12)                                      // 8
 *   .shadow(color: .black.opacity(0.12), radius: 16,       // 9
 *           x: 0, y: 8)
 * ─────────────────────────────────────────────────────────────
 *
 * 実行: pnpm tsx examples/showcase-card.ts
 */
import { Section, ViewText as Text, VStack, page } from 'draft-ole';

// ── Card 本体 ──
// padding + background + cornerRadius + boxShadow を単一チェーンで記述。
const card = VStack({ spacing: 8 },
  Text('Fluent Card').font({ size: '1.25rem', weight: '700' }).foregroundStyle('#1a202c'),
  Text('padding / background / cornerRadius / boxShadow を単一チェーンで記述').foregroundStyle('#4a5568'),
)
  .padding(24)
  .background('#ffffff')
  .cornerRadius('12px')
  .boxShadow('0 8px 24px rgba(0, 0, 0, 0.12)');

// ── Page 構築 ──
const doc = page(
  Section(card)
    .background('#f2f4f8')
    .padding(48)
    .frame({ maxWidth: 480 }),
  { lang: 'ja', title: 'DraftOle Showcase — Card' },
);

doc.render(); // 構文有効性確認 (副作用なし)
doc.export('./.out/runs/showcase_card');
console.log('✓ Showcase Card generated → .out/runs/showcase_card/');
