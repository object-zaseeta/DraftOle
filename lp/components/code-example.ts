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

interface CodeBlockProps {
  label: string;
  labelColor: string;
  bgColor: string;
  codeColor: string;
  code: string;
}

const CodeBlock = ({ label, labelColor, bgColor, codeColor, code: codeText }: CodeBlockProps) =>
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
      CodeBlock({ label: '従来の方法（3ファイル）', labelColor: color.subtle, bgColor: color.surface, codeColor: color.codeFg, code: BEFORE_CODE }),
      CodeBlock({ label: 'DraftOle（1ファイル）', labelColor: color.accent, bgColor: color.codeBg, codeColor: color.codeAccent, code: AFTER_CODE }),
    ).flex({ gap: space.gapM }),
  ).padding(space.section);
