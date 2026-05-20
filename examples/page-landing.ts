import type { PairType } from 'draft-ole';
import { HStack, Heading, Section, ViewText as Text, VStack, page } from 'draft-ole';

// 4 セクション LP: hero / feature / CTA / footer
// View DSL のみで記述（html()/body()/div() などのロウ HTML ファクトリは未使用）

// ───────── ヘルパー ─────────
function featureCard(title: string, desc: string): PairType {
  const cardTitle = Heading(3, title)
    .font({ size: '1.125rem', weight: '700' })
    .foregroundStyle('#111827')
    .margin('0'); // <h3> default margin reset

  const cardDesc = Text(desc)
    .font({ size: '0.95rem', lineHeight: '1.6' })
    .foregroundStyle('#4b5563');

  return VStack({ spacing: 8 }, cardTitle, cardDesc)
    .padding(20)
    .background('#ffffff')
    .cornerRadius('12px')
    .frame({ maxWidth: 280 });
}

// ───────── Hero セクション ─────────
const heroTitle = Heading(1, 'DraftOle_TS で LP を最速で組む')
  .font({ size: '2.75rem', weight: '800', family: 'system-ui, sans-serif', lineHeight: '1.2' })
  .foregroundStyle('#0f172a')
  .margin('0'); // <h1> default margin reset

const heroSubtitle = Text('SwiftUI ライクな View DSL と modifier 連鎖で、型安全に HTML/CSS を生成。')
  .font({ size: '1.125rem', lineHeight: '1.6' })
  .foregroundStyle('#475569');

const heroPrimaryButton = Text('今すぐ試す')
  .padding(14)
  .background('#4f46e5')
  .foregroundStyle('#ffffff')
  .cornerRadius('8px')
  .font({ weight: '600', size: '1rem' });

const heroSecondaryButton = Text('GitHub で見る')
  .padding(14)
  .background('#e0e7ff')
  .foregroundStyle('#3730a3')
  .cornerRadius('8px')
  .font({ weight: '600', size: '1rem' });

const heroButtons = HStack({ spacing: 12 }, heroPrimaryButton, heroSecondaryButton);

const heroContent = VStack({ spacing: 24 }, heroTitle, heroSubtitle, heroButtons)
  .padding(72)
  .frame({ maxWidth: 760 });

const heroSection = Section(heroContent)
  .background('#f8f9ff')
  .padding('horizontal' as const, 24);

// ───────── Feature セクション ─────────
const featureHeading = Heading(2, '主な特徴')
  .font({ size: '1.875rem', weight: '700' })
  .foregroundStyle('#0f172a')
  .margin('0'); // <h2> default margin reset

const featureCards = HStack({ spacing: 16 },
  featureCard('型安全', 'TypeScript の型システムで HTML 構造を保護します。'),
  featureCard('ゼロ依存', 'ランタイム依存ゼロ。軽量で導入が容易です。'),
  featureCard('SwiftUI ライク', 'modifier 連鎖で宣言的にスタイルを記述できます。'),
);

const featureContent = VStack({ spacing: 32 }, featureHeading, featureCards)
  .padding(64)
  .frame({ maxWidth: 960 });

const featureSection = Section(featureContent)
  .background('#ffffff');

// ───────── CTA セクション ─────────
const ctaHeading = Heading(2, 'さあ、はじめよう')
  .font({ size: '2rem', weight: '800' })
  .foregroundStyle('#ffffff')
  .margin('0'); // <h2> default margin reset

const ctaBody = Text('npm でインストールして、最初の 1 ページを 5 分で書き上げましょう。')
  .font({ size: '1.0625rem', lineHeight: '1.6' })
  .foregroundStyle('#e0e7ff');

const ctaButton = Text('Get Started →')
  .padding(16)
  .background('#ffffff')
  .foregroundStyle('#4338ca')
  .cornerRadius('999px')
  .font({ weight: '700', size: '1.0625rem' });

const ctaContent = VStack({ spacing: 20 }, ctaHeading, ctaBody, ctaButton)
  .padding(72)
  .frame({ maxWidth: 720 });

const ctaSection = Section(ctaContent)
  .background('#4f46e5');

// ───────── Footer セクション ─────────
const footerText = Text('© 2026 DraftOle_TS — MIT License')
  .font({ size: '0.875rem' })
  .foregroundStyle('#94a3b8');

const footerContent = VStack({ spacing: 8 }, footerText)
  .padding(32)
  .frame({ maxWidth: 960 });

const footerSection = Section(footerContent)
  .background('#0f172a');

// ───────── Page 全体 ─────────
const doc = page(
  heroSection,
  featureSection,
  ctaSection,
  footerSection,
  {
    lang: 'ja',
    title: 'DraftOle_TS — 型安全な LP ジェネレーター',
    description: '4 セクション構成 (hero / feature / CTA / footer) のドッグフーディング LP 例',
    charset: 'UTF-8',
    viewport: 'width=device-width, initial-scale=1',
  },
);

export { doc };

doc.export('./.out/runs/page_landing');
console.log('✓ Page Landing → .out/runs/page_landing/');
