import { AppSlot, HStack, Section, ViewText as Text, VStack, page } from 'draft-ole';

// AppSlot を含む最小ページ構成の例
// JS 無効時でもテキスト・リンクが読める静的コンテンツを配置する

// ───────── ヘッダーセクション ─────────
const headerTitle = Text('DraftOle_TS カウンター デモ')
  .font({ size: '2rem', weight: '700', family: 'system-ui, sans-serif' })
  .foregroundStyle('#0f172a');

const headerSubtitle = Text('AppSlot を使ったインタラクティブ UI の埋め込み例です。')
  .font({ size: '1rem', lineHeight: '1.6' })
  .foregroundStyle('#475569');

const headerContent = VStack({ spacing: 16 }, headerTitle, headerSubtitle)
  .padding(48)
  .frame({ maxWidth: 760 });

const headerSection = Section(headerContent)
  .background('#f8fafc');

// ───────── AppSlot セクション ─────────
// 注: AppSlot は StaticView を返し、VStack/Section/HStack の View=HtmlTag 引数とは
//     型互換性がないため、page() の直接子として配置する必要がある。
//     ラベル文言は別 Section として並列配置する。
const slotLabel = Text('カウンター（JavaScript が有効な場合に表示されます）')
  .font({ size: '0.875rem' })
  .foregroundStyle('#64748b');

const slotLabelContent = VStack({ spacing: 12 }, slotLabel)
  .padding(40)
  .frame({ maxWidth: 760 });

const slotLabelSection = Section(slotLabelContent)
  .background('#ffffff');

// AppSlot は page() 直接子として配置する (StaticView ↔ HtmlTag の型不整合回避)
const counterSlot = AppSlot('counter');

// ───────── 説明セクション ─────────
const descHeading = Text('このデモについて')
  .font({ size: '1.25rem', weight: '600' })
  .foregroundStyle('#1e293b');

const descBody = Text(
  'AppSlot はサーバーサイドで HTML マウントポイントを生成します。' +
  'クライアント側の JavaScript フレームワークがそのポイントにアプリをマウントします。',
)
  .font({ size: '0.9375rem', lineHeight: '1.7' })
  .foregroundStyle('#475569');

const linkText = Text('ドキュメントを読む →')
  .font({ size: '0.9375rem', weight: '500' })
  .foregroundStyle('#4f46e5');

const descContent = VStack({ spacing: 16 }, descHeading, descBody, linkText)
  .padding(48)
  .frame({ maxWidth: 760 });

const descSection = Section(descContent)
  .background('#f1f5f9');

// ───────── フッターセクション ─────────
const footerText = Text('© 2026 DraftOle_TS — MIT License')
  .font({ size: '0.8125rem' })
  .foregroundStyle('#94a3b8');

const footerContent = VStack({ spacing: 8 }, footerText)
  .padding(24)
  .frame({ maxWidth: 760 });

const footerSection = Section(footerContent)
  .background('#0f172a');

// ───────── Page 全体 ─────────
// AppSlot (counterSlot) は VStack/Section の View=HtmlTag 型と互換性がないため
// page() の直接子として配置し、ラベル用 Section (slotLabelSection) と並列に並べる。
const doc = page(
  headerSection,
  slotLabelSection,
  counterSlot,
  descSection,
  footerSection,
  {
    lang: 'ja',
    title: 'AppSlot デモ — DraftOle_TS',
    description: 'AppSlot を使ったマウントポイント埋め込みの最小構成例',
    charset: 'UTF-8',
    viewport: 'width=device-width, initial-scale=1',
  },
);

export { doc };

doc.export('./.out/runs/page_with_app_slot');
console.log('✓ Page with AppSlot → .out/runs/page_with_app_slot/');
