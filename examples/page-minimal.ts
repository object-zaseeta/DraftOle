import { HStack, Heading, Section, ViewText as Text, VStack, page } from 'draft-ole';

// ランディングページ ヒーローセクション相当の LP 例
// 6 modifier すべてを modifier 連鎖のみで適用（.css.styleManager 不使用）

const heroTitle = Heading(1, 'DraftOle_TS へようこそ')
  .font({ size: '2.5rem', weight: '700', family: 'system-ui, sans-serif' })  // .font()
  .foregroundStyle('#1a1a2e')                                                  // .foregroundStyle()
  .margin('0'); // <h1> default margin reset

const heroSubtitle = Heading(2, '型安全な HTML/CSS 生成ライブラリ')
  .font({ size: '1.125rem', lineHeight: '1.6' })
  .foregroundStyle('#4a4a6a')
  .margin('0'); // <h2> default margin reset

const ctaButton = Text('はじめる →')
  .padding(14)                    // .padding()
  .background('#4f46e5')          // .background()
  .foregroundStyle('#ffffff')
  .cornerRadius('8px')            // .cornerRadius()
  .font({ weight: '600', size: '1rem' });

const secondaryButton = Text('ドキュメントを読む')
  .padding(14)
  .background('#f3f4f6')
  .foregroundStyle('#374151')
  .cornerRadius('8px')
  .font({ weight: '600', size: '1rem' });

const buttonRow = HStack({ spacing: 12 },
  ctaButton,
  secondaryButton,
);

const heroContent = VStack({ spacing: 24 },
  heroTitle,
  heroSubtitle,
  buttonRow,
)
  .padding(64)                    // .padding()
  .frame({ maxWidth: 720 });      // .frame()

const heroSection = Section(heroContent)
  .background('#f8f9ff')          // .background()
  .padding('horizontal' as const, 24);

const badge = Text('✦ オープンソース')
  .padding(8)
  .background('#ede9fe')
  .foregroundStyle('#5b21b6')
  .cornerRadius('999px')          // .cornerRadius() — pill shape
  .font({ size: '0.875rem', weight: '500' });

const featureLabel = (text: string) =>
  Text(text)
    .padding(16)
    .background('#ffffff')
    .foregroundStyle('#111827')
    .cornerRadius('12px')
    .font({ size: '1rem' });

const featuresRow = HStack({ spacing: 16 },
  featureLabel('型安全'),
  featureLabel('ゼロ依存'),
  featureLabel('SwiftUI ライク API'),
)
  .padding(32)
  .frame({ maxWidth: 720 });

const featuresSection = Section(badge, featuresRow)
  .background('#ffffff')
  .padding(32);

const doc = page(
  heroSection,
  featuresSection,
  {
    lang: 'ja',
    title: 'DraftOle_TS — 型安全な HTML/CSS 生成',
    description: 'modifier 連鎖で LP 相当のスタイルを記述する DraftOle_TS 利用例',
    charset: 'UTF-8',
    viewport: 'width=device-width, initial-scale=1',
  },
);

doc.export('./.out/runs/page_minimal');
console.log('✓ Page Minimal → .out/runs/page_minimal/');
