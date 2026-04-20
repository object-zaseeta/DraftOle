/**
 * DraftOle MVP Demo: Todo App
 *
 * DraftOle API のみで Todo アプリを生成する。
 * supplementCSS（生CSS）ゼロ。
 *
 * 実行: node --experimental-strip-types examples/mvp-demo.ts
 * 出力: output/mvp_demo/index.html, style.css, script.js
 */
import {
  Root,
  html, head, body, title, meta,
  div, h1, p, section, header, footer,
  label, input, button, ul, span, small,
  createTheme, createStyle,
  FileExporter,
} from '../dist/index.js';

// ── Theme (CSS Variables) ──
const theme = createTheme({
  bg: '#0b1220',
  panel: 'rgba(255, 255, 255, 0.06)',
  border: 'rgba(255, 255, 255, 0.12)',
  text: 'rgba(255, 255, 255, 0.92)',
  muted: 'rgba(255, 255, 255, 0.68)',
  accent: '#7c5cff',
  'accent-2': '#32d399',
  danger: '#ef4444',
  shadow: '0 18px 60px rgba(0, 0, 0, 0.35)',
  radius: '14px',
});

// ── Shared Styles ──
const cardStyle = createStyle('card', {
  background: theme.panel,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius,
  boxShadow: theme.shadow,
  padding: '16px',
  marginTop: '14px',
});

const rowStyle = createStyle('row', {
  display: 'flex',
  gap: '10px',
  alignItems: 'center',
  flexWrap: 'wrap',
}, {
  '&.meta': { marginTop: '12px', justifyContent: 'space-between' },
});

const labelStyle = createStyle('label', {
  minWidth: '44px',
  color: theme.muted,
});

const inputStyle = createStyle('input', {
  flex: '1 1 260px',
  padding: '11px 12px',
  borderRadius: '12px',
  border: `1px solid ${theme.border}`,
  background: 'rgba(0, 0, 0, 0.25)',
  color: theme.text,
  outline: 'none',
}, {
  focus: {
    borderColor: 'rgba(124, 92, 255, 0.65)',
    boxShadow: '0 0 0 3px rgba(124, 92, 255, 0.25)',
  },
});

const btnStyle = createStyle('btn', {
  padding: '10px 12px',
  borderRadius: '12px',
  border: `1px solid ${theme.border}`,
  background: 'rgba(255, 255, 255, 0.06)',
  color: theme.text,
  cursor: 'pointer',
}, {
  hover: { background: 'rgba(255, 255, 255, 0.10)' },
  '&.primary': {
    borderColor: 'rgba(124, 92, 255, 0.55)',
    background: 'linear-gradient(180deg, rgba(124, 92, 255, 0.35), rgba(124, 92, 255, 0.18))',
  },
});

const countStyle = createStyle('count', { color: theme.muted });

const listStyle = createStyle('list', {
  listStyle: 'none',
  padding: '0',
  margin: '0',
  display: 'grid',
  gap: '10px',
});

const itemStyle = createStyle('item', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px',
  padding: '12px',
  borderRadius: '12px',
  border: `1px solid ${theme.border}`,
  background: 'rgba(0, 0, 0, 0.22)',
}, {
  ' .text': { flex: '1 1 auto' },
  '&.done .text': { textDecoration: 'line-through', color: 'rgba(255, 255, 255, 0.55)' },
});

const pillStyle = createStyle('pill', {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  borderRadius: '999px',
  padding: '6px 10px',
  border: `1px solid ${theme.border}`,
  background: 'rgba(255, 255, 255, 0.05)',
  color: theme.muted,
  fontSize: '12px',
}, {
  '&.ok': { color: 'rgba(50, 211, 153, 0.95)', borderColor: 'rgba(50, 211, 153, 0.35)' },
  '&.ng': { color: 'rgba(239, 68, 68, 0.95)', borderColor: 'rgba(239, 68, 68, 0.35)' },
});

const footerStyle = createStyle('footer', { color: theme.muted });
const headerStyle = createStyle('header', { marginBottom: '18px' });

// ── Document ──
const root = new Root();

// Global CSS
root.addGlobalCss(theme.css);
root.addGlobalCss('* { box-sizing: border-box; }');
root.addGlobalCss('html, body { height: 100%; }');
root.addGlobalCss(`body {
  background-image:
    radial-gradient(circle at 15% 85%, rgba(50, 211, 153, 0.18), transparent 55%),
    radial-gradient(circle at 85% 10%, rgba(124, 92, 255, 0.15), transparent 55%);
  background-attachment: fixed;
}`);
root.addGlobalCss([
  cardStyle, rowStyle, labelStyle, inputStyle, btnStyle,
  countStyle, listStyle, itemStyle, pillStyle, footerStyle, headerStyle,
].map(s => s.css).join('\n\n'));

const page = html({ lang: 'ja' },
  head(
    meta({ charset: 'utf-8' }),
    meta({ name: 'viewport', content: 'width=device-width, initial-scale=1' }),
    title('DraftOle MVP Demo'),
  ),
  body(
    div({ id: 'app' },
      header({ class: headerStyle.className },
        h1('DraftOle MVP Demo').margin('0').fontSize('28px'),
        p('TypeScript で宣言的に書いた HTML/CSS/JS（サーバ不要）')
          .margin('8px 0 0').color(theme.muted),
      ),

      section({ class: cardStyle.className },
        div({ class: rowStyle.className },
          label({ for: 'todo-input', class: labelStyle.className }, 'Todo'),
          input({ id: 'todo-input', class: inputStyle.className, type: 'text', placeholder: '例: DraftOleのCSS出力を確認する' }),
          button({ id: 'add-btn', class: `${btnStyle} primary`, type: 'button' }, '追加'),
        ),
        div({ class: `${rowStyle} meta` },
          span({ id: 'count', class: countStyle.className }, '0 items'),
          button({ id: 'clear-btn', class: btnStyle.className, type: 'button' }, '完了をクリア'),
        ),
      ),

      section({ class: cardStyle.className },
        ul({ id: 'todo-list', class: listStyle.className, 'aria-label': 'Todo list' }),
      ),

      footer({ class: footerStyle.className },
        small('Generated by DraftOle'),
      ).margin('18px 0 0'),
    ).maxWidth('860px').margin('0 auto').padding('36px 18px 60px')
     .fontFamily("ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'")
     .color(theme.text),
  ).background(theme.bg),
);

root.addChild(page);

// ── JS ──
const appJs = `function createTodoItem(text) {
  const li = document.createElement("li");
  li.className = "item";
  const span = document.createElement("span");
  span.className = "text";
  span.textContent = text;
  const pill = document.createElement("span");
  pill.className = "pill ng";
  pill.textContent = "active";
  const btn = document.createElement("button");
  btn.className = "btn";
  btn.type = "button";
  btn.textContent = "toggle";
  btn.addEventListener("click", () => {
    li.classList.toggle("done");
    const done = li.classList.contains("done");
    pill.textContent = done ? "done" : "active";
    pill.classList.toggle("ok", done);
    pill.classList.toggle("ng", !done);
    updateCount();
  });
  li.appendChild(span);
  li.appendChild(pill);
  li.appendChild(btn);
  return li;
}
function updateCount() {
  const items = document.querySelectorAll("#todo-list .item");
  const active = Array.from(items).filter(x => !x.classList.contains("done")).length;
  document.querySelector("#count").textContent = active + " items";
}
function clearDone() {
  document.querySelectorAll("#todo-list .item.done").forEach(el => el.remove());
  updateCount();
}
function addTodo() {
  const input = document.querySelector("#todo-input");
  const text = (input.value || "").trim();
  if (!text) { input.style.borderColor = "rgba(239, 68, 68, 0.65)"; return; }
  input.style.borderColor = "rgba(255, 255, 255, 0.12)";
  document.querySelector("#todo-list").appendChild(createTodoItem(text));
  input.value = "";
  updateCount();
}
document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#add-btn").addEventListener("click", addTodo);
  document.querySelector("#clear-btn").addEventListener("click", clearDone);
  document.querySelector("#todo-input").addEventListener("keydown", e => {
    if (e.key === "Enter") addTodo();
  });
  updateCount();
});`;

// ── Export ──
const htmlContent = root.render();
const cssContent = root.collectCssStyleString();

const exporter = new FileExporter();
exporter.export(htmlContent, cssContent, appJs, './output/mvp_demo');

console.log('✓ MVP Demo generated → output/mvp_demo/');
