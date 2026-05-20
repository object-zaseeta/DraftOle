/**
 * DraftOle Showcase: List
 *
 * page-first View DSL（`Page` / `Section` / `VStack` / `HStack` / `Text` + modifier 連鎖）で
 * `.grid()` と `.flex()` を組み合わせたテーブル風 List を宣言的に記述するショーケース。
 * `Root` や生 HTML タグファクトリ（html/body/div）は使用しない。
 *
 * ─────────────────────────────────────────────────────────────
 * Swift 版想定行数: 12 行（DX Rubric 定量閾値 ±30%）
 * 参考（SwiftUI 相当実装）:
 *   VStack(alignment: .leading, spacing: 8) {                  // 1
 *       HStack { Text("Name"); Spacer(); Text("Role");          // 2
 *                Spacer(); Text("Status") }                     // 3
 *       ForEach(rows) { row in                                  // 4
 *           HStack(spacing: 8) {                                // 5
 *               Text(row.name); Spacer()                        // 6
 *               Text(row.role); Spacer()                        // 7
 *               Text(row.status)                                // 8
 *                   .foregroundColor(row.active ? .green : .gray)
 *           }                                                   // 9
 *       }                                                       // 10
 *   }                                                           // 11
 *   .padding(24)                                                // 12
 * ─────────────────────────────────────────────────────────────
 *
 * 実行: pnpm tsx examples/showcase-list.ts
 */
import { HStack, Section, ViewText as Text, VStack, page } from 'draft-ole';

// ── データ ──
const rows: Array<{ name: string; role: string; status: 'Active' | 'Away' }> = [
  { name: 'Alice', role: 'Engineer', status: 'Active' },
  { name: 'Bob', role: 'Designer', status: 'Away' },
  { name: 'Carol', role: 'PM', status: 'Active' },
];

// ── 行ヘルパー（HStack = .flex() 相当の横方向レイアウト） ──
const dataRow = (r: { name: string; role: string; status: 'Active' | 'Away' }) =>
  HStack({ spacing: 8 },
    Text(r.name),
    Text(r.role),
    Text(r.status).foregroundStyle(r.status === 'Active' ? '#10b981' : '#6b7280'),
  );

// ── List 本体: 外側 VStack + 内側 HStack（.flex() 相当）+ 表ヘッダを .grid() で 3 列固定 ──
const list = VStack({ spacing: 8 },
  HStack({ spacing: 8 },
    Text('Name').font({ weight: '700' }),
    Text('Role').font({ weight: '700' }),
    Text('Status').font({ weight: '700' }),
  ).grid({ columns: '1fr 1fr 1fr', gap: '8px' }),
  ...rows.map(dataRow),
)
  .padding(24)
  .background('#ffffff')
  .cornerRadius('12px');

// ── Page 構築 ──
const doc = page(
  Section(list)
    .background('#f2f4f8')
    .padding(48)
    .frame({ maxWidth: 480 }),
  { lang: 'ja', title: 'DraftOle Showcase: List' },
);

doc.export('./.out/runs/showcase_list');
console.log('✓ Showcase List generated → .out/runs/showcase_list/');
