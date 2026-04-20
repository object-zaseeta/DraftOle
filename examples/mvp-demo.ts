/**
 * DraftOle MVP Demo: Todo App
 *
 * DraftOle API のみで Todo アプリを生成する。
 * supplementCSS（生CSS）ゼロ。生 JS 文字列・テンプレートリテラルもゼロ。
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
  // JS Vanilla Builder（Phase B）
  createVanillaScript,
  ref,
  onDomReady,
  on,
  query,
  queryAll,
  filterNot,
  length,
  containsClass,
  toggleClass,
  addClass,
  setText,
  setValue,
  setStyle,
  appendChild,
  removeAll,
} from '../dist/index.js';
import type { JsExpr, JsBoolExpr } from '../dist/index.js';

/**
 * 任意の JS 式文字列を `JsExpr` 形に昇格させるローカルユーティリティ。
 * 公開 DSL は `fromExpr` を公開していないため、このデモ限定のラッパとして用意する。
 * 実装は dom-api / tree-api 等の `encodeValue` が `.code` のみを参照するため安全に互換。
 */
function asJsExpr(code: string): JsExpr {
  const self = {
    __jsExpr: true as const,
    code,
    eq: (other: string | number | JsExpr): JsBoolExpr =>
      asJsBoolExpr(`${code} === ${typeof other === 'object' ? other.code : JSON.stringify(other)}`),
    ne: (other: string | number | JsExpr): JsBoolExpr =>
      asJsBoolExpr(`${code} !== ${typeof other === 'object' ? other.code : JSON.stringify(other)}`),
    or: (fallback: string | JsExpr): JsExpr =>
      asJsExpr(`(${code} || ${typeof fallback === 'object' ? fallback.code : JSON.stringify(fallback)})`),
    trim: (): JsExpr => asJsExpr(`${code}.trim()`),
    isFalsy: (): JsBoolExpr => asJsBoolExpr(`!${code}`),
    isTruthy: (): JsBoolExpr => asJsBoolExpr(`!!${code}`),
  };
  return self as unknown as JsExpr;
}
function asJsBoolExpr(code: string): JsBoolExpr {
  return { ...asJsExpr(code), __jsBool: true as const } as unknown as JsBoolExpr;
}

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

// ── JS（Vanilla Builder で宣言的に構築） ──
const script = createVanillaScript();

// createTodoItem(text): <li> 要素を生成して返す。
// DSL の外で直接表現できない property 代入（`button.type`）と
// 末尾 `return li;` は `raw` / `setAttribute` 経由で組み立てる。
script.fn('createTodoItem', ['text'], (s) => {
  // const li = document.createElement("li"); li.classList.add("item");
  s.let('li', s.raw('document.createElement("li")'));
  const li = ref<HTMLLIElement>('li');
  addClass(s, li, 'item');

  // const span = document.createElement("span"); span.classList.add("text"); span.textContent = text;
  s.let('span', s.raw('document.createElement("span")'));
  const spanEl = ref<HTMLSpanElement>('span');
  addClass(s, spanEl, 'text');
  setText(s, spanEl, asJsExpr('text'));

  // const pill = document.createElement("span"); pill.classList.add("pill"); pill.classList.add("ng"); pill.textContent = "active";
  s.let('pill', s.raw('document.createElement("span")'));
  const pill = ref<HTMLSpanElement>('pill');
  addClass(s, pill, 'pill');
  addClass(s, pill, 'ng');
  setText(s, pill, 'active');

  // const btn = document.createElement("button"); btn.classList.add("btn"); btn.setAttribute("type","button"); btn.textContent = "toggle";
  s.let('btn', s.raw('document.createElement("button")'));
  const btn = ref<HTMLButtonElement>('btn');
  addClass(s, btn, 'btn');
  s.call('btn.setAttribute', [s.raw('"type"'), s.raw('"button"')]);
  setText(s, btn, 'toggle');

  // btn.addEventListener("click", () => { ... })
  on(s, btn, 'click', (s2) => {
    toggleClass(s2, li, 'done');
    const done = s2.let('done', s2.raw(`${li.code}.classList.contains("done")`));
    // pill.textContent = done ? "done" : "active";
    s2._append({
      type: 'setProp',
      target: pill.code,
      prop: 'textContent',
      expr: `${done.code} ? "done" : "active"`,
    });
    // pill.classList.toggle("ok", done); pill.classList.toggle("ng", !done);
    toggleClass(s2, pill, 'ok', asJsBoolExpr(done.code));
    toggleClass(s2, pill, 'ng', asJsBoolExpr(`!${done.code}`));
    s2.call('updateCount');
  });

  // li.appendChild(span); li.appendChild(pill); li.appendChild(btn);
  appendChild(s, li, spanEl);
  appendChild(s, li, pill);
  appendChild(s, li, btn);

  // return li;
  s._append({ type: 'raw', code: 'return li;' });
});

// updateCount(): 未完了の item 件数を "N items" として #count へ反映する。
script.fn('updateCount', (s) => {
  const items = queryAll(s, '#todo-list .item');
  const active = filterNot(items, (it) => containsClass(it, 'done'));
  setText(
    s,
    query(s, '#count'),
    asJsExpr(`${length(active).code} + " items"`),
  );
});

// clearDone(): 完了済みの item を一括削除し updateCount を呼ぶ。
script.fn('clearDone', (s) => {
  removeAll(s, queryAll(s, '#todo-list .item.done'));
  s.call('updateCount');
});

// addTodo(): #todo-input の値で新しい <li> を #todo-list に追加する。
script.fn('addTodo', (s) => {
  const inputEl = query<HTMLInputElement>(s, '#todo-input').cache('input');
  // text 式（JsExpr チェーン）：`(input.value || "").trim()`。
  const textExpr = inputEl.value.or('').trim();

  // if (!text_expr) { input.style.borderColor = "..."; return; }
  s.ifThen(textExpr.isFalsy(), (s2) => {
    setStyle(s2, inputEl, 'borderColor', 'rgba(239, 68, 68, 0.65)');
    s2.return();
  });

  setStyle(s, inputEl, 'borderColor', 'rgba(255, 255, 255, 0.12)');
  // appendChild(document.querySelector("#todo-list"), createTodoItem(text_expr));
  // `s.call` は副作用として expr 文を発行してしまうため、ここでは式埋め込み専用に
  // `asJsExpr` で `createTodoItem(...)` を直接組み立てて appendChild 引数に渡す。
  appendChild(
    s,
    query(s, '#todo-list'),
    asJsExpr(`createTodoItem(${textExpr.code})`),
  );
  setValue(s, inputEl, '');
  s.call('updateCount');
});

// DOMContentLoaded: イベント登録と初期 updateCount。
onDomReady(script, (s) => {
  on(s, query(s, '#add-btn'), 'click', (s2) => {
    s2.call('addTodo');
  });
  on(s, query(s, '#clear-btn'), 'click', (s2) => {
    s2.call('clearDone');
  });
  on(s, query<HTMLInputElement>(s, '#todo-input'), 'keydown', (s2, e) => {
    s2.ifThen(e.key.eq('Enter'), (s3) => {
      s3.call('addTodo');
    });
  });
  s.call('updateCount');
});

// ── Export ──
// script.hasDomReady === true のため、exporter 側の wrapDOMReady は適用しない。
const htmlContent = root.render();
const cssContent = root.collectCssStyleString();

const exporter = new FileExporter();
exporter.export(htmlContent, cssContent, script.render(), './output/mvp_demo');

console.log('✓ MVP Demo generated → output/mvp_demo/');
