import { div, h2, p, section, pre, code, Text } from '../../dist/index.js';
import { color, font, space, radius } from '../tokens.ts';

const BEFORE_CODE = `<!-- index.html -->
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
  });`;

const AFTER_CODE = `const card = div(
  h2('Hello'),
  button('Click')
)
.padding('24px')
.background('#1a1a1a')
.cornerRadius('12px');

card.jqm.click('handleClick');`;

const CodeBlock = (label: string, labelColor: string, bgColor: string, codeColor: string, codeText: string) =>
  div(
    p(label).fontSize(font.small).color(labelColor).margin('0 0 16px 0'),
    pre(code(Text.unsafeRaw(codeText)))
      .fontSize(font.small).color(codeColor).fontFamily(font.mono),
  ).flexGrow('1').background(bgColor).cornerRadius(radius.card).padding(space.block).overflow('auto');

export const CodeExample = () =>
  section(
    h2('Before → After')
      .fontSize(font.heading).fontWeight(font.bold).color(color.text)
      .textAlign('center').margin('0 0 48px 0'),
    div(
      CodeBlock('従来の方法（3ファイル）', color.subtle, color.surface, color.codeFg, BEFORE_CODE),
      CodeBlock('DraftOle（1ファイル）', color.accent, color.codeBg, color.codeAccent, AFTER_CODE),
    ).display('flex').gap(space.gapM),
  ).padding(space.section);
