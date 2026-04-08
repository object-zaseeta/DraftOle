import {
  Root, Text, TextType,
  html, head, body, title, meta,
  div, h1, h2, p, a, section, pre, code, footer,
  FileExporter,
} from '../dist/index.js';

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
        h1(Text('HTML, CSS, JS — TypeScript ひとつで。'))
          .fontSize('48px').fontWeight('700').color('#ffffff')
          .margin('0 0 24px 0'),
        p(Text('型安全なDSLでWebページを丸ごと生成'))
          .fontSize('20px').color('#a0a0a0')
          .margin('0 0 40px 0'),
        a({ href: '#' }, Text('Get Started'))
          .display('inline-block').padding('16px 40px')
          .background('#3b82f6').color('#ffffff')
          .fontSize('18px').fontWeight('600')
          .cornerRadius('8px').textDecoration('none'),
      ).padding('120px 0 80px').textAlign('center'),

      // ── Features Section ──
      section(
        h2(Text('なぜ DraftOle？'))
          .fontSize('32px').fontWeight('700').color('#ffffff')
          .textAlign('center').margin('0 0 48px 0'),
        div(
          div(
            h2(Text('三位一体')).fontSize('24px').fontWeight('600').color('#ffffff').margin('0 0 12px 0'),
            p(Text('HTML・CSS・JSを1つのTypeScriptファイルで記述。もう3ファイルを行き来する必要はありません。'))
              .color('#a0a0a0').lineHeight('1.6'),
          ).flexGrow('1').padding('32px').background('#1a1a1a').cornerRadius('12px'),
          div(
            h2(Text('型安全')).fontSize('24px').fontWeight('600').color('#ffffff').margin('0 0 12px 0'),
            p(Text('146以上のCSSプロパティすべてに型補完が効きます。タイポや無効な値をコンパイル時にキャッチ。'))
              .color('#a0a0a0').lineHeight('1.6'),
          ).flexGrow('1').padding('32px').background('#1a1a1a').cornerRadius('12px'),
          div(
            h2(Text('ゼロランタイム')).fontSize('24px').fontWeight('600').color('#ffffff').margin('0 0 12px 0'),
            p(Text('出力は純粋なHTML/CSS/JS。ランタイム依存なし。どこにでもデプロイできます。'))
              .color('#a0a0a0').lineHeight('1.6'),
          ).flexGrow('1').padding('32px').background('#1a1a1a').cornerRadius('12px'),
        ).display('flex').gap('32px'),
      ).padding('80px 0'),

      // ── Code Example Section ──
      section(
        h2(Text('Before → After'))
          .fontSize('32px').fontWeight('700').color('#ffffff')
          .textAlign('center').margin('0 0 48px 0'),
        div(
          // Before
          div(
            p(Text('従来の方法（3ファイル）')).fontSize('14px').color('#666666').margin('0 0 16px 0'),
            pre(code(new TextType(
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
            ))).fontSize('14px').color('#c0c0c0').fontFamily("'Fira Code', monospace"),
          ).flexGrow('1').background('#1a1a1a').cornerRadius('12px').padding('24px').overflow('auto'),
          // After
          div(
            p(Text('DraftOle（1ファイル）')).fontSize('14px').color('#3b82f6').margin('0 0 16px 0'),
            pre(code(new TextType(
`const card = div(
  h2(Text('Hello')),
  button(Text('Click'))
)
.padding('24px')
.background('#1a1a1a')
.cornerRadius('12px');

card.jqm.click('handleClick');`
            ))).fontSize('14px').color('#7dd3fc').fontFamily("'Fira Code', monospace"),
          ).flexGrow('1').background('#0d1b2a').cornerRadius('12px').padding('24px').overflow('auto'),
        ).display('flex').gap('24px'),
      ).padding('80px 0'),

      // ── Footer CTA ──
      footer(
        p(Text('TypeScript ひとつで、Webを作ろう。'))
          .fontSize('24px').color('#ffffff').margin('0 0 32px 0'),
        a({ href: '#' }, Text('Get Started'))
          .display('inline-block').padding('16px 40px')
          .background('#3b82f6').color('#ffffff')
          .fontSize('18px').fontWeight('600')
          .cornerRadius('8px').textDecoration('none'),
        p(Text('© 2026 DraftOle'))
          .fontSize('14px').color('#666666').margin('48px 0 0 0'),
      ).padding('80px 0 40px').textAlign('center'),

    ).maxWidth('1200px').margin('0 auto').padding('0 24px'),  // wrapper
  ).background('#0a0a0a').color('#ffffff')
   .fontFamily("'Inter', 'Noto Sans JP', sans-serif")
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
