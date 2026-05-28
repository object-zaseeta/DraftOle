import type { PairType } from 'draft-ole';
import { HStack, Heading, Link, page, Section, VStack, ViewText as Text } from 'draft-ole';

// English LP for public assets (README hero / GitHub Pages / X/Zenn screenshots).
// Structure: hero (dark) / three-zeros / what-it-is / page-first-app-later / install-cta / footer
// Written using the public View DSL only (page / Section / VStack / HStack / Text / Heading / Link).

// ───────── Palette ─────────
const COLOR_INK = '#0f172a';
const COLOR_INK_SOFT = '#1e293b';
const COLOR_TEXT = '#475569';
const COLOR_MUTED = '#94a3b8';
const COLOR_BG = '#ffffff';
const COLOR_BG_SOFT = '#f8fafc';
const COLOR_ACCENT = '#8b5cf6'; // violet-500: use as bg behind LIGHT text only when large (stat numbers)
const COLOR_ACCENT_ON_DARK = '#a78bfa'; // violet-400: text on #0f172a (6.6:1, passes normal)
const COLOR_ACCENT_BUTTON = '#6d28d9'; // violet-700: bg behind white CTA button text (7.1:1)
const COLOR_ACCENT_SOFT = '#ede9fe';
const COLOR_ON_INK = '#f8fafc';
const FONT_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
const FONT_MONO = '"SF Mono", Menlo, Consolas, "JetBrains Mono", monospace';

// ───────── Helpers ─────────
function pillBadge(text: string): PairType {
  return Text(text)
    .padding('horizontal' as const, 12)
    .padding('vertical' as const, 6)
    .background(COLOR_ACCENT_SOFT)
    .foregroundStyle('#5b21b6')
    .cornerRadius('999px')
    .font({ size: '0.8125rem', weight: '600', family: FONT_SANS });
}

function statColumn(big: string, label: string, caption: string): PairType {
  const bigNum = Text(big)
    .font({ size: '3rem', weight: '800', family: FONT_SANS, lineHeight: '1' })
    .foregroundStyle(COLOR_ACCENT);
  const labelText = Heading(3, label)
    .font({ size: '1.125rem', weight: '700', family: FONT_SANS })
    .foregroundStyle(COLOR_INK)
    .margin('0');
  const captionText = Text(caption)
    .font({ size: '0.9375rem', lineHeight: '1.55', family: FONT_SANS })
    .foregroundStyle(COLOR_TEXT);
  // ADS finding C (2026-05-26): wrap stat columns in subtle cards.
  // Preset 2: white bg + 16px radius + 32px padding + subtle shadow (Stripe/Notion-like).
  return VStack({ spacing: 10 }, bigNum, labelText, captionText)
    .padding(32)
    .background('#ffffff')
    .cornerRadius('16px')
    .boxShadow('0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)')
    .frame({ maxWidth: 280 });
}

function bullet(text: string): PairType {
  return Text(`— ${text}`)
    .font({ size: '1rem', lineHeight: '1.7', family: FONT_SANS })
    .foregroundStyle(COLOR_TEXT);
}

// ───────── Hero (dark) ─────────
const heroBadge = pillBadge('v0.9.0 · pre-1.0 feedback phase');

// 2026-05-28: Positioning re-baseline (grill-with-docs / Variant 1).
// Old: "A View DSL for static pages in TypeScript." + slogan "page first, App later."
// New: "TypeScript everywhere, including your HTML." — pages AND apps as first-class.
const heroTitle = Heading(1, 'TypeScript everywhere, including your HTML.')
  .font({ size: '3.25rem', weight: '800', family: FONT_SANS, lineHeight: '1.1' })
  .foregroundStyle(COLOR_ON_INK)
  .margin('0');

const heroSubtitle = Text(
  'The same modifier-chain DSL writes your landing pages, your docs, and your apps. No bundler. No JSX. No template language.',
)
  .font({ size: '1.0625rem', lineHeight: '1.7', family: FONT_SANS })
  .foregroundStyle('#cbd5e1')
  .frame({ maxWidth: 640 });

const heroPrimaryCta = Link(
  { href: 'https://www.npmjs.com/package/draft-ole' },
  Text('pnpm add draft-ole')
    .padding('horizontal' as const, 18)
    .padding('vertical' as const, 14)
    .background(COLOR_ACCENT_BUTTON)
    .foregroundStyle('#ffffff')
    .cornerRadius('10px')
    .font({ size: '0.9375rem', weight: '700', family: FONT_MONO }),
);

const heroSecondaryCta = Link(
  { href: 'https://github.com/object-zaseeta/DraftOle', target: '_blank', rel: 'noopener' },
  Text('View on GitHub →')
    .padding('horizontal' as const, 18)
    .padding('vertical' as const, 14)
    .foregroundStyle(COLOR_ON_INK)
    .font({ size: '0.9375rem', weight: '600', family: FONT_SANS }),
);

const heroButtons = HStack({ spacing: 8 }, heroPrimaryCta, heroSecondaryCta);

const heroContent = VStack({ spacing: 28 }, heroBadge, heroTitle, heroSubtitle, heroButtons)
  .padding('vertical' as const, 96)
  .padding('horizontal' as const, 32)
  .frame({ maxWidth: 880 });

const heroSection = Section(heroContent)
  .background(COLOR_INK);

// ───────── Three Zeros ─────────
const zerosHeading = Heading(2, 'Three zeros, by design.')
  .font({ size: '2rem', weight: '800', family: FONT_SANS, lineHeight: '1.2' })
  .foregroundStyle(COLOR_INK)
  .margin('0');

const zerosSub = Text(
  'DraftOle outputs static HTML. Nothing leaks into the visitor browser, nothing balloons your node_modules, nothing forces a bundler step into your toolchain.',
)
  .font({ size: '1rem', lineHeight: '1.7', family: FONT_SANS })
  .foregroundStyle(COLOR_TEXT)
  .frame({ maxWidth: 640 });

const zeroStats = HStack({ spacing: 32 },
  statColumn('0', 'JavaScript in output', 'page() emits plain HTML and scoped CSS. Your LP ships zero framework runtime to visitors.'),
  statColumn('0', 'production deps', 'One entry in node_modules. No transitive web of packages to audit.'),
  statColumn('0', 'bundler config', 'Runs on tsx, ts-node, or node --experimental-strip-types. Build is one command.'),
);

const zerosContent = VStack({ spacing: 36 }, zerosHeading, zerosSub, zeroStats)
  .padding('vertical' as const, 88)
  .padding('horizontal' as const, 32)
  .frame({ maxWidth: 1040 });

const zerosSection = Section(zerosContent)
  .background(COLOR_BG_SOFT);

// ───────── What it is ─────────
const whatHeading = Heading(2, 'What it is, in one paragraph.')
  .font({ size: '2rem', weight: '800', family: FONT_SANS, lineHeight: '1.2' })
  .foregroundStyle(COLOR_INK)
  .margin('0');

const whatBody = Text(
  'A function-as-page DSL. You compose views (Section, VStack, HStack, Text, Heading) and apply modifiers (.padding(), .background(), .frame()) the way SwiftUI taught us to. Call doc.export() and you get index.html + style.css. That is the whole library.',
)
  .font({ size: '1.0625rem', lineHeight: '1.75', family: FONT_SANS })
  .foregroundStyle(COLOR_INK_SOFT)
  .frame({ maxWidth: 720 });

const whatBullets = VStack({ spacing: 12 },
  bullet('Type-safe end-to-end. HTML attribute typos are compile errors, not silent runtime bugs.'),
  bullet('SwiftUI-style modifier chains. Layout intent reads top-to-bottom.'),
  bullet('Scoped CSS per node, generated automatically. No global selector wars.'),
  bullet('ESM + CJS + .d.ts. Works with tsx, ts-node, and node --experimental-strip-types.'),
  bullet('Progressive: start static with page(), add interactive surfaces later with app().'),
);

const whatContent = VStack({ spacing: 28 }, whatHeading, whatBody, whatBullets)
  .padding('vertical' as const, 88)
  .padding('horizontal' as const, 32)
  .frame({ maxWidth: 880 });

const whatSection = Section(whatContent)
  .background(COLOR_BG);

// ───────── Page first, App later ─────────
const phaseBadge = pillBadge('Philosophy');

const phaseHeading = Heading(2, 'Page first. App later.')
  .font({ size: '2rem', weight: '800', family: FONT_SANS, lineHeight: '1.2' })
  .foregroundStyle(COLOR_INK)
  .margin('0');

const phaseBody = Text(
  'Static pages are the cleanest place to enforce type safety end-to-end, so DraftOle starts there. When you need an interactive island — a counter, a form, a small client store — the same DSL extends through app(). You never have to leave TypeScript or change frameworks.',
)
  .font({ size: '1.0625rem', lineHeight: '1.75', family: FONT_SANS })
  .foregroundStyle(COLOR_INK_SOFT)
  .frame({ maxWidth: 720 });

const phaseContent = VStack({ spacing: 24 }, phaseBadge, phaseHeading, phaseBody)
  .padding('vertical' as const, 88)
  .padding('horizontal' as const, 32)
  .frame({ maxWidth: 880 });

const phaseSection = Section(phaseContent)
  .background(COLOR_BG_SOFT);

// ───────── Install CTA ─────────
const ctaHeading = Heading(2, 'Try it. One file, sixty seconds.')
  // ADS finding B (2026-05-26): unify all h2 to 2rem; CTA emphasis is carried by dark bg + padding instead.
  .font({ size: '2rem', weight: '800', family: FONT_SANS, lineHeight: '1.2' })
  .foregroundStyle(COLOR_ON_INK)
  .margin('0');

const ctaBody = Text('Install with your favorite package manager. Then write a page() and run it.')
  .font({ size: '1.0625rem', lineHeight: '1.7', family: FONT_SANS })
  .foregroundStyle('#cbd5e1');

// ADS finding A (2026-05-26): wrap install pill in Link to match hero pattern.
// Semantic: <a><p> instead of orphan <p>; click goes to npm package page.
const ctaInstall = Link(
  { href: 'https://www.npmjs.com/package/draft-ole', target: '_blank', rel: 'noopener' },
  Text('$ pnpm add draft-ole')
    .padding('horizontal' as const, 20)
    .padding('vertical' as const, 16)
    .background('#020617')
    .foregroundStyle('#a5b4fc')
    .cornerRadius('10px')
    .font({ size: '0.9375rem', weight: '500', family: FONT_MONO }),
);

const ctaGetStarted = Link(
  { href: 'https://github.com/object-zaseeta/DraftOle#quick-start', target: '_blank', rel: 'noopener' },
  Text('Read the Quick Start →')
    .foregroundStyle(COLOR_ACCENT_ON_DARK)
    .font({ size: '1rem', weight: '600', family: FONT_SANS }),
);

const ctaContent = VStack({ spacing: 24 }, ctaHeading, ctaBody, ctaInstall, ctaGetStarted)
  .padding('vertical' as const, 96)
  .padding('horizontal' as const, 32)
  .frame({ maxWidth: 720 });

const ctaSection = Section(ctaContent)
  .background(COLOR_INK);

// ───────── Footer ─────────
const footerBrand = Text('DraftOle')
  .font({ size: '0.9375rem', weight: '700', family: FONT_SANS })
  .foregroundStyle('#cbd5e1');

const footerTagline = Text('TypeScript everywhere, including your HTML.')
  .font({ size: '0.8125rem', family: FONT_SANS })
  .foregroundStyle(COLOR_MUTED);

const footerGitHub = Link(
  { href: 'https://github.com/object-zaseeta/DraftOle', target: '_blank', rel: 'noopener' },
  Text('GitHub').foregroundStyle('#cbd5e1').font({ size: '0.8125rem', weight: '500', family: FONT_SANS }),
);

const footerNpm = Link(
  { href: 'https://www.npmjs.com/package/draft-ole', target: '_blank', rel: 'noopener' },
  Text('npm').foregroundStyle('#cbd5e1').font({ size: '0.8125rem', weight: '500', family: FONT_SANS }),
);

const footerLinks = HStack({ spacing: 16 }, footerGitHub, footerNpm);

const footerLicense = Text('© 2026 DraftOle · MIT License')
  .font({ size: '0.75rem', family: FONT_SANS })
  .foregroundStyle(COLOR_MUTED);

const footerContent = VStack({ spacing: 12 }, footerBrand, footerTagline, footerLinks, footerLicense)
  .padding('vertical' as const, 40)
  .padding('horizontal' as const, 32)
  .frame({ maxWidth: 880 });

const footerSection = Section(footerContent)
  .background('#020617');

// ───────── Page ─────────
const doc = page(
  heroSection,
  zerosSection,
  whatSection,
  phaseSection,
  ctaSection,
  footerSection,
  {
    lang: 'en',
    title: 'DraftOle — TypeScript everywhere, including your HTML',
    description:
      'The same modifier-chain DSL writes your landing pages, your docs, and your apps. No bundler, no JSX, no template language.',
    charset: 'UTF-8',
    viewport: 'width=device-width, initial-scale=1',
  },
);

export { doc };

doc.export('./.out/runs/page_landing');
console.log('✓ Page Landing → .out/runs/page_landing/');
