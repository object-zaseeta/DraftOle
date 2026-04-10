import {
  Root, Text,
  html, head, body, title, meta,
  div, h1, h2, p, a, section, pre, code, footer,
  FileExporter,
} from '../dist/index.js';

// ── Design Tokens ──

const color = {
  bg:       '#0a0a0a',
  surface:  '#1a1a1a',
  accent:   '#3b82f6',
  codeBg:   '#0d1b2a',
  text:     '#ffffff',
  muted:    '#a0a0a0',
  subtle:   '#666666',
  codeFg:   '#c0c0c0',
  codeAccent: '#7dd3fc',
} as const;

const font = {
  family:     "'Inter', 'Noto Sans JP', sans-serif",
  mono:       "'Fira Code', monospace",
  hero:       '48px',
  heading:    '32px',
  subheading: '24px',
  body:       '20px',
  cta:        '18px',
  small:      '14px',
  bold:       '700',
  semibold:   '600',
} as const;

const space = {
  section:    '80px 0',
  heroY:      '120px 0 80px',
  footerY:    '80px 0 40px',
  card:       '32px',
  block:      '24px',
  button:     '16px 40px',
  pageX:      '0 24px',
  gapL:       '32px',
  gapM:       '24px',
} as const;

const radius = {
  card:   '12px',
  button: '8px',
} as const;

const layout = {
  maxWidth: '1200px',
} as const;

// ── Document ──
const root = new Root();

const page = html({ lang: 'ja' },
  head(
    meta({ charset: 'utf-8' }),
    meta({ name: 'viewport', content: 'width=device-width, initial-scale=1.0' }),
    title('DraftOle — TypeScript DSL for Web'),
  ),
  body(
    div(
      // ── Hero Section ──
      section(
        h1('HTML, CSS, JS — TypeScript ひとつで。')
          .fontSize(font.hero).fontWeight(font.bold).color(color.text)
          .margin('0 0 24px 0'),
        p('型安全なDSLでWebページを丸ごと生成')
          .fontSize(font.body).color(color.muted)
          .margin('0 0 40px 0'),
        a({ href: '#' }, 'Get Started')
          .display('inline-block').padding(space.button)
          .background(color.accent).color(color.text)
          .fontSize(font.cta).fontWeight(font.semibold)
          .cornerRadius(radius.button).textDecoration('none'),
      ).padding(space.heroY).textAlign('center'),

      // ── Features Section ──
      section(
        h2('なぜ DraftOle？')
          .fontSize(font.heading).fontWeight(font.bold).color(color.text)
          .textAlign('center').margin('0 0 48px 0'),
        div(
          div(
            h2('三位一体').fontSize(font.subheading).fontWeight(font.semibold).color(color.text).margin('0 0 12px 0'),
            p('HTML・CSS・JSを1つのTypeScriptファイルで記述。もう3ファイルを行き来する必要はありません。')
              .color(color.muted).lineHeight('1.6'),
          ).flexGrow('1').padding(space.card).background(color.surface).cornerRadius(radius.card),
          div(
            h2('型安全').fontSize(font.subheading).fontWeight(font.semibold).color(color.text).margin('0 0 12px 0'),
            p('146以上のCSSプロパティすべてに型補完が効きます。タイポや無効な値をコンパイル時にキャッチ。')
              .color(color.muted).lineHeight('1.6'),
          ).flexGrow('1').padding(space.card).background(color.surface).cornerRadius(radius.card),
          div(
            h2('ゼロランタイム').fontSize(font.subheading).fontWeight(font.semibold).color(color.text).margin('0 0 12px 0'),
            p('出力は純粋なHTML/CSS/JS。ランタイム依存なし。どこにでもデプロイできます。')
              .color(color.muted).lineHeight('1.6'),
          ).flexGrow('1').padding(space.card).background(color.surface).cornerRadius(radius.card),
        ).display('flex').gap(space.gapL),
      ).padding(space.section),

      // ── Code Example Section ──
      section(
        h2('Before → After')
          .fontSize(font.heading).fontWeight(font.bold).color(color.text)
          .textAlign('center').margin('0 0 48px 0'),
        div(
          div(
            p('従来の方法（3ファイル）').fontSize(font.small).color(color.subtle).margin('0 0 16px 0'),
            pre(code(Text.unsafeRaw(
`<!-- index.html -->
<div class="card">
  <h2>Hello</h2>
  <button id="btn">Click</button>
</div>

/* style.css */
.card {
  padding: 24px;
  background: #1a1a1a;
  border-radius: 12px;
}

// script.js
document.getElementById('btn')
  .addEventListener('click', () => {
    alert('Clicked!');
  });`
            ))).fontSize(font.small).color(color.codeFg).fontFamily(font.mono),
          ).flexGrow('1').background(color.surface).cornerRadius(radius.card).padding(space.block).overflow('auto'),
          div(
            p('DraftOle（1ファイル）').fontSize(font.small).color(color.accent).margin('0 0 16px 0'),
            pre(code(Text.unsafeRaw(
`const card = div(
  h2('Hello'),
  button('Click')
)
.padding('24px')
.background('#1a1a1a')
.cornerRadius('12px');

card.jqm.click('handleClick');`
            ))).fontSize(font.small).color(color.codeAccent).fontFamily(font.mono),
          ).flexGrow('1').background(color.codeBg).cornerRadius(radius.card).padding(space.block).overflow('auto'),
        ).display('flex').gap(space.gapM),
      ).padding(space.section),

      // ── Footer CTA ──
      footer(
        p('TypeScript ひとつで、Webを作ろう。')
          .fontSize(font.subheading).color(color.text).margin('0 0 32px 0'),
        a({ href: '#' }, 'Get Started')
          .display('inline-block').padding(space.button)
          .background(color.accent).color(color.text)
          .fontSize(font.cta).fontWeight(font.semibold)
          .cornerRadius(radius.button).textDecoration('none'),
        p('© 2026 DraftOle')
          .fontSize(font.small).color(color.subtle).margin('48px 0 0 0'),
      ).padding(space.footerY).textAlign('center'),

    ).maxWidth(layout.maxWidth).margin('0 auto').padding(space.pageX),
  ).background(color.bg).color(color.text)
   .fontFamily(font.family)
   .margin('0').padding('0'),
);

root.addChild(page);

// ── Export ──
const htmlContent = root.render();
const cssContent = root.collectCssStyleString();
const jsContent = root.renderJs();

const exporter = new FileExporter({ includeResetCss: true });
exporter.export(htmlContent, cssContent, jsContent, './lp/output');

console.log('✓ LP generated → lp/output/');
