/** DraftOle MVP Demo (helper-pattern variant) — TXDX-2 / helper-inline-recovery
 *
 * 既存 `mvp-demo.ts` の addButton / clearDoneButton を helper 関数
 * (`() => el.button(...).on(...)`) でラップした variant。
 *
 * 検証観点:
 * - transformer の helper-inline-recovery (TXDX-2) が helper body 内の
 *   `.on(arrow)` を検出して書き換える
 * - DT014 を発行せず、通常の `.on` と同じシリアライゼーション結果を出力する
 * - handler 内 `console.log` がブラウザ DevTools に出力される（動作確認用）
 *
 * 実行:
 *   pnpm build:examples       → コンパイルのみ
 *   node --experimental-strip-types scripts/build-examples.ts \
 *     tests/examples/fixtures/mvp-demo-helper.ts --run
 *                              → コンパイル + 実行 (.out/runs/mvp_demo_helper/)
 *   open .out/runs/mvp_demo_helper/index.html
 *
 * Spec: .kiro/specs/helper-inline-recovery/ (TXDX-2)
 */

import { app, css, el, hstack, type UnifiedTheme, vstack } from 'draft-ole';

type Todo = { text: string; done: boolean };

const themeTokens = {
  bg: '#0b1220',
  panel: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.12)',
  text: 'rgba(255,255,255,0.92)',
  muted: 'rgba(255,255,255,0.68)',
  accent: '#7c5cff',
  danger: '#ef4444',
  radius: '14px',
};

const theme: UnifiedTheme<typeof themeTokens> = css.theme(
  themeTokens,
) as UnifiedTheme<typeof themeTokens>;

const card = theme.class({
  background: 'panel',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 'radius',
  padding: '16px',
});

const btn = theme.class({
  padding: '10px 12px',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.06)',
  color: 'text',
  cursor: 'pointer',
});

const doc = app({
  title: 'DraftOle MVP Demo (helper variant)',
  lang: 'ja',
  css: [css.reset(), theme.css],
});

const todos = doc.state<Todo[]>([]);
const draft = doc.state('');
const activeCount = todos.map((ts) => ts.filter((t) => !t.done).length);

// ── 入力フィールド（helper 経由ではない通常パターン）────────────────────────
const draftField = el
  .input({ type: 'text', placeholder: '新しい Todo を入力して Enter または「追加」' })
  .value(draft)
  .flex('1 1 260px')
  .padding('11px 12px')
  .cornerRadius('12px')
  .border({ width: '1px', style: 'solid', color: theme.border })
  .background('rgba(0,0,0,0.25)')
  .font({ color: theme.text })
  .on('input', (e: Event) => {
    const v = (e.target as HTMLInputElement).value;
    console.log('[draftField] input', v);
    draft.set(v);
  })
  .on('keydown', (e: Event) => {
    if ((e as KeyboardEvent).key === 'Enter') {
      const txt = draft.get().trim();
      console.log('[draftField] Enter pressed, draft=', txt);
      if (txt) {
        todos.set([...todos.get(), { text: txt, done: false }]);
        draft.set('');
      }
    }
  });

// ── helper 関数で view 断片をラップ（TXDX-2 が要求する形状） ────────────────
// const helper = () => el.X(...).on(arrow);
// 採用条件: zero-param / module-level / const / arrow initializer
const addButton = () =>
  el.button({ type: 'button', css: btn }, '追加').on('click', () => {
    const txt = draft.get().trim();
    console.log('[addButton] click, draft=', txt, ' todos.length=', todos.get().length);
    if (txt) {
      todos.set([...todos.get(), { text: txt, done: false }]);
      draft.set('');
    }
  });

const clearDoneButton = () =>
  el.button({ type: 'button', css: btn }, '完了をクリア').on('click', () => {
    const before = todos.get().length;
    const after = todos.get().filter((t) => !t.done).length;
    console.log('[clearDoneButton] click, before=', before, ' after=', after);
    todos.set(todos.get().filter((t) => !t.done));
  });

// ── helper を呼び出して view tree に組み込む ───────────────────────────────
const inputSection = el.section(
  { css: card },
  hstack(
    { spacing: 10, alignment: 'center', wrap: true },
    el.label('Todo').minWidth('44px').font({ color: theme.muted }),
    draftField,
    addButton(),
  ),
  hstack(
    { spacing: 10, alignment: 'center' },
    el.span().text(activeCount.map((n) => `${n} items`)),
    clearDoneButton(),
  ),
);

// ── todo リスト表示（each scope — 本 spec の Non-Goal なので handler 内に helper を入れない）──
const todoListSection = el.section(
  { css: card },
  el.ul().grid({ gap: '8px' }).appendChild(
    todos.each((item) =>
      el.li(
        hstack(
          { spacing: 10, alignment: 'center' },
          el
            .input({ type: 'checkbox' })
            .checked(item.map((t) => t.done))
            .on('change', (e: Event) => {
              const checked = (e.target as HTMLInputElement).checked;
              const cur = item.get();
              console.log('[checkbox] change', cur.text, '→', checked);
              todos.set(
                todos.get().map((t) =>
                  t.text === cur.text ? { ...t, done: checked } : t,
                ),
              );
            }),
          el.span().text(item.map((t) => t.text)),
          el
            .span()
            .text(item.map((t) => (t.done ? 'done' : 'todo')))
            .font({ size: '12px', color: theme.muted }),
        ),
      ),
    ),
  ),
);

const content = vstack({ spacing: 16 }, inputSection, todoListSection)
  .frame({ maxWidth: 860 })
  .margin('0 auto')
  .padding('36px 18px 60px')
  .background(theme.bg)
  .font({ family: 'ui-sans-serif, system-ui, sans-serif', color: theme.text });

doc.exportTo(content, './.out/runs/mvp_demo_helper');
console.log('✓ MVP Demo (helper variant) generated → .out/runs/mvp_demo_helper/');
console.log('  open .out/runs/mvp_demo_helper/index.html');
console.log('  → ブラウザ DevTools コンソールで handler ログを確認');
export default doc;
