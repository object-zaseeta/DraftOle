/**
 * mvp-demo-transformed.fixture.ts
 *
 * Task 7.4 / Task 5.1: 最終スナップショットテスト用フィクスチャ（1.0.0 公開 API 版）
 *
 * このファイルは `examples/interactive/mvp-demo.ts` に draftole transformer を適用した後の
 * 出力コードを手動で再現したものです。1.0.0 公開面（`app` / `css` / `el` / `hstack` /
 * `vstack`）のみで構築し、legacy low-level API（`Root` / `createTheme` / `createStyle` /
 * `all` / 個別タグ factory の直 import）は使用しません。
 *
 * transformer の役割:
 *   `.on(event, (e) => arrow)` を
 *   `.on(event, Object.assign((s) => s._emitHandlerBody(code, params), { _draftoleEmitted: true }))`
 *   に書き換える。
 *
 * stateIdMap:
 *   - todos → s0  (doc.state() 第1呼び出し)
 *   - draft → s1  (doc.state() 第2呼び出し)
 *   - activeCount → s2  (todos.map() 派生)
 *
 * アロー関数ハンドラの変換後コード（handler-serializer の出力に相当）:
 *   (e) => draft.set((e.target as HTMLInputElement).value)
 *   → code: "__draftole__.state('s1').set(e.target.value)"
 *   → params: ["e"]
 *
 *   (e) => { if ((e as KeyboardEvent).key === "Enter") { const txt = draft.get().trim(); if (txt) { todos.set([...todos.get(), { text: txt, done: false }]); draft.set(""); } } }
 *   → code: "if (e.key === \"Enter\") { const txt = __draftole__.state('s1').get().trim(); if (txt) { __draftole__.state('s0').set([...__draftole__.state('s0').get(), { text: txt, done: false }]); __draftole__.state('s1').set(\"\"); } }"
 *   → params: ["e"]
 *
 *   () => { const txt = draft.get().trim(); if (txt) { todos.set([...todos.get(), { text: txt, done: false }]); draft.set(""); } }
 *   → code: "const txt = __draftole__.state('s1').get().trim(); if (txt) { __draftole__.state('s0').set([...__draftole__.state('s0').get(), { text: txt, done: false }]); __draftole__.state('s1').set(\"\"); }"
 *   → params: []
 *
 *   () => todos.set(todos.get().filter((t) => !t.done))
 *   → code: "__draftole__.state('s0').set(__draftole__.state('s0').get().filter(function(t) { return !t.done; }))"
 *   → params: []
 *
 * 注: このフィクスチャは `app().exportTo()` 経由で出力ファイルを生成するため、
 *     node --experimental-strip-types で直接実行できます。
 */

import { app, css, el, vstack } from "draft-ole";

type Todo = { text: string; done: boolean };

// ── theme tokens ──────────────────────────────────────────────────────────────
const theme = css.theme({
  bg: "#0b1220",
  panel: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.12)",
  text: "rgba(255,255,255,0.92)",
  muted: "rgba(255,255,255,0.68)",
  accent: "#7c5cff",
  danger: "#ef4444",
  radius: "14px",
  shadow: "0 18px 60px rgba(0,0,0,0.35)",
});

// ── named classes（css.class — 旧 createStyle 相当）──────────────────────────
const card = css.class("card", {
  background: theme.panel,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius,
  boxShadow: theme.shadow,
  padding: "16px",
  marginTop: "14px",
});
const row = css.class("row", {
  display: "flex",
  gap: "10px",
  alignItems: "center",
  flexWrap: "wrap",
});
const lbl = css.class("lbl", {
  minWidth: "44px",
  color: theme.muted,
});
const inp = css.class("inp", {
  flex: "1 1 260px",
  padding: "11px 12px",
  borderRadius: "12px",
  border: `1px solid ${theme.border}`,
  background: "rgba(0,0,0,0.25)",
  color: theme.text,
});
const btn = css.class("btn", {
  padding: "10px 12px",
  borderRadius: "12px",
  border: `1px solid ${theme.border}`,
  background: "rgba(255,255,255,0.06)",
  color: theme.text,
  cursor: "pointer",
});
const listSt = css.class("list", {
  listStyle: "none",
  padding: "0",
  margin: "0",
  display: "grid",
  gap: "10px",
});
const itemSt = css.class("item", {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "12px",
  borderRadius: "12px",
  border: `1px solid ${theme.border}`,
  background: "rgba(0,0,0,0.22)",
});

// ── app & state（state 生成順で s0/s1/s2 を確定）────────────────────────────
const doc = app({
  title: "DraftOle MVP Demo",
  lang: "ja",
  viewport: "width=device-width, initial-scale=1",
  css: [
    theme.css,
    css.raw("* { box-sizing: border-box; }"),
    css.raw(
      [card, row, lbl, inp, btn, listSt, itemSt]
        .map((s) => s.css)
        .join("\n\n"),
    ),
  ],
});

const todos = doc.state<Todo[]>([]);
const draft = doc.state("");
const activeCount = todos.map((ts) => ts.filter((t) => !t.done).length);

// ── view: 入力セクション（手書き ID と transformer 形ハンドラを維持）─────────
const inputSection = el.section(
  { class: card.className },
  el.div(
    { class: row.className },
    el.label({ for: "todo-input", class: lbl.className }, "Todo"),
    el
      .input({
        id: "todo-input",
        class: inp.className,
        type: "text",
        placeholder: "新しい Todo を入力",
      })
      .value(draft)
      // transformer 変換後: (e) => draft.set(e.target.value)
      .on(
        "input",
        Object.assign(
          (s: {
            _emitHandlerBody: (code: string, params: readonly string[]) => void;
          }) => s._emitHandlerBody("__draftole__.state('s1').set(e.target.value)", ["e"]),
          { _draftoleEmitted: true },
        ),
      )
      // transformer 変換後: (e) => { if (e.key === "Enter") { const txt = ...; } }
      .on(
        "keydown",
        Object.assign(
          (s: {
            _emitHandlerBody: (code: string, params: readonly string[]) => void;
          }) =>
            s._emitHandlerBody(
              'if (e.key === "Enter") { const txt = __draftole__.state(\'s1\').get().trim(); if (txt) { __draftole__.state(\'s0\').set([...__draftole__.state(\'s0\').get(), { text: txt, done: false }]); __draftole__.state(\'s1\').set(""); } }',
              ["e"],
            ),
          { _draftoleEmitted: true },
        ),
      ),
    el
      .button({ id: "add-btn", class: `${btn.className} primary`, type: "button" }, "追加")
      // transformer 変換後: () => { const txt = ...; }
      .on(
        "click",
        Object.assign(
          (s: {
            _emitHandlerBody: (code: string, params: readonly string[]) => void;
          }) =>
            s._emitHandlerBody(
              'const txt = __draftole__.state(\'s1\').get().trim(); if (txt) { __draftole__.state(\'s0\').set([...__draftole__.state(\'s0\').get(), { text: txt, done: false }]); __draftole__.state(\'s1\').set(""); }',
              [],
            ),
          { _draftoleEmitted: true },
        ),
      ),
  ),
  el.div(
    { class: row.className },
    el.span({ id: "count" }).text(activeCount.map((n) => `${n} items`)),
    el
      .button({ id: "clear-btn", class: btn.className, type: "button" }, "完了をクリア")
      // transformer 変換後: () => todos.set(todos.get().filter((t) => !t.done))
      .on(
        "click",
        Object.assign(
          (s: {
            _emitHandlerBody: (code: string, params: readonly string[]) => void;
          }) =>
            s._emitHandlerBody(
              "__draftole__.state('s0').set(__draftole__.state('s0').get().filter(function(t) { return !t.done; }))",
              [],
            ),
          { _draftoleEmitted: true },
        ),
      ),
  ),
);

// ── view: todo list ──────────────────────────────────────────────────────────
const todoListSection = el.section(
  { class: card.className },
  el
    .ul({ id: "todo-list", class: listSt.className })
    .appendChild(
      todos.each((_item) =>
        el
          .li({ id: "each-todo-item", class: itemSt.className })
          .appendChild(el.input({ type: "checkbox", id: "each-todo-checkbox" }))
          .appendChild(el.span({ id: "each-todo-text", class: "text" }))
          .appendChild(el.span({ id: "each-todo-pill" })),
      ),
    ),
);

// ── view: header / footer ───────────────────────────────────────────────────
const titleHeader = el.header(
  { class: card.className },
  el.h1("DraftOle MVP Demo").fontSize("28px"),
  el.p("TypeScript で宣言的に書いた HTML/CSS/JS").color(theme.muted),
);

const footerNode = el
  .footer({}, el.small("Generated by DraftOle"))
  .color(theme.muted)
  .margin("18px 0 0");

// ── compose & export ────────────────────────────────────────────────────────
const content = vstack(
  undefined,
  titleHeader,
  inputSection,
  todoListSection,
  footerNode,
)
  .maxWidth("860px")
  .margin("0 auto")
  .padding("36px 18px 60px")
  .fontFamily("ui-sans-serif, system-ui, sans-serif")
  .color(theme.text)
  .backgroundColor(theme.bg);

doc.exportTo(content, "./.out/runs/mvp_demo_transformed_fixture");
