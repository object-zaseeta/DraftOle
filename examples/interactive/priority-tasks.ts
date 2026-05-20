/** DraftOle Priority Tasks: 3 優先度（high / medium / low）のタスク管理アプリ
 *
 * `mvp-demo.ts` の canonical 1.0.0 構造（theme tokens → theme.class → app() →
 * state → view 部品 → compose → doc.exportTo）を踏襲しつつ、`each` テンプレート内
 * での `.text()` / `.checked()` / `.on()` / `.class()` / `.setStyle()` 全バインディングを
 * ショーケースする。
 *
 * 優先度別 border 色（high=赤 / medium=橙 / low=緑）は `.setStyle('borderColor', ...)`
 * で動的に切り替える。完了タスクは `.class()` で `done-text` クラスを付与して取消線を
 * 適用する（`css.raw` で関連スタイルルールを併記）。
 *
 * 実行: pnpm tsx examples/interactive/priority-tasks.ts
 */

import { app, css, el, hstack, type UnifiedTheme, vstack } from "draft-ole";

type Priority = "high" | "medium" | "low";
type Task = { text: string; done: boolean; priority: Priority };

// ── theme: tokens ──────────────────────────────────────────────────────────
const themeTokens = {
	bg: "#0b1220",
	panel: "rgba(255,255,255,0.06)",
	border: "rgba(255,255,255,0.12)",
	text: "rgba(255,255,255,0.92)",
	muted: "rgba(255,255,255,0.68)",
	accent: "#7c5cff",
	danger: "#ef4444",
	high: "#ef4444",
	medium: "#f59e0b",
	low: "#22c55e",
	radius: "14px",
	shadow: "0 18px 60px rgba(0,0,0,0.35)",
};

// ── theme: tokens のみで構築（UnifiedTheme へ寄せる typing trick）─────────
// 全エントリが string の場合 css.theme は legacy `Theme<T>` を返すため、
// `UnifiedTheme<T>` 経路に揃えるため as 経由で型注釈を寄せる。
const theme: UnifiedTheme<typeof themeTokens> = css.theme(
	themeTokens,
) as UnifiedTheme<typeof themeTokens>;

// ── theme.class(): 無名形 — colocated パイプライン経由で CSS に取り込まれる ──
const card = theme.class({
	background: "panel",
	border: "1px solid rgba(255,255,255,0.12)",
	borderRadius: "radius",
	boxShadow: "shadow",
	padding: "16px",
	marginTop: "14px",
});

const btn = theme.class({
	padding: "10px 14px",
	borderRadius: "12px",
	border: "1px solid rgba(255,255,255,0.12)",
	background: "rgba(255,255,255,0.06)",
	color: "text",
	cursor: "pointer",
});

const deleteBtn = theme.class({
	padding: "4px 10px",
	borderRadius: "8px",
	border: "1px solid rgba(255,255,255,0.12)",
	background: "transparent",
	color: "muted",
	cursor: "pointer",
});

const list = theme.class({
	listStyle: "none",
	padding: "0",
	margin: "0",
});

const pill = theme.class({
	padding: "2px 8px",
	borderRadius: "999px",
	border: "1px solid rgba(255,255,255,0.12)",
});

// 完了タスクの取消線スタイル（`.class()` 動的バインドの受け皿）。
// 他 `css.*` で表現できない「クラス名→スタイル」の bind を支える escape hatch として
// `css.raw` を使用する（1.0.0 公開 surface 内）。
const doneTextRule = css.raw(
	".done-text { text-decoration: line-through; opacity: 0.5; }",
);

// ── app & state ────────────────────────────────────────────────────────────
const doc = app({
	title: "DraftOle Priority Tasks",
	lang: "ja",
	css: [css.reset(), theme.css, doneTextRule],
});

const tasks = doc.state<Task[]>([]);
const draft = doc.state("");
const draftPriority = doc.state<Priority>("medium");

const totalCount = tasks.map((ts) => ts.length);
const activeCount = tasks.map((ts) => ts.filter((t) => !t.done).length);
const doneCount = tasks.map((ts) => ts.filter((t) => t.done).length);

// ── view: header ───────────────────────────────────────────────────────────
const titleHeader = el.header(
	{ css: card },
	el.h1("DraftOle Priority Tasks").font({ size: "28px" }),
	el
		.p("3 優先度（高/中/低）のタスク管理 — each 内バインディング全部入りデモ")
		.font({ color: theme.muted }),
);

// ── view: stats panel ──────────────────────────────────────────────────────
const statsSection = el.section(
	{ css: card },
	hstack(
		{ spacing: 20, alignment: "center", wrap: true },
		hstack(
			{ spacing: 6, alignment: "center" },
			el.span("合計: ").font({ color: theme.muted }),
			el.span().text(totalCount.map((n) => String(n))).font({ color: theme.text }),
		),
		hstack(
			{ spacing: 6, alignment: "center" },
			el.span("残り: ").font({ color: theme.muted }),
			el
				.span()
				.text(activeCount.map((n) => String(n)))
				.font({ color: theme.accent }),
		),
		hstack(
			{ spacing: 6, alignment: "center" },
			el.span("完了: ").font({ color: theme.muted }),
			el
				.span()
				.text(doneCount.map((n) => String(n)))
				.font({ color: theme.low }),
		),
	),
);

// ── view: interactive controls ─────────────────────────────────────────────
const draftField = el
	.input({ type: "text", placeholder: "新しいタスクを入力" })
	.value(draft)
	.flex("1 1 200px")
	.padding("11px 12px")
	.cornerRadius("12px")
	.border({ width: "1px", style: "solid", color: theme.border })
	.background("rgba(0,0,0,0.25)")
	.font({ color: theme.text })
	.on("input", (e: Event) => {
		draft.set((e.target as HTMLInputElement).value);
	})
	.on("keydown", (e: Event) => {
		if ((e as KeyboardEvent).key === "Enter") {
			const txt = draft.get().trim();
			if (txt) {
				const pri = draftPriority.get();
				tasks.set([...tasks.get(), { text: txt, done: false, priority: pri }]);
				draft.set("");
			}
		}
	});

const prioritySelect = el
	.select(
		{},
		el.option({ value: "high" }, "🔴 高"),
		el.option({ value: "medium", selected: "selected" }, "🟡 中"),
		el.option({ value: "low" }, "🟢 低"),
	)
	.padding("11px 12px")
	.cornerRadius("12px")
	.border({ width: "1px", style: "solid", color: theme.border })
	.background("rgba(0,0,0,0.35)")
	.font({ color: theme.text })
	.on("change", (e: Event) => {
		draftPriority.set((e.target as HTMLSelectElement).value as Priority);
	});

const addButton = el
	.button({ type: "button", css: btn }, "追加")
	.on("click", () => {
		const txt = draft.get().trim();
		if (txt) {
			const pri = draftPriority.get();
			tasks.set([...tasks.get(), { text: txt, done: false, priority: pri }]);
			draft.set("");
		}
	});

const clearDoneButton = el
	.button({ type: "button", css: btn }, "完了をクリア")
	.on("click", () => {
		tasks.set(tasks.get().filter((t) => !t.done));
	});

const clearAllButton = el
	.button({ type: "button", css: btn }, "すべてクリア")
	.on("click", () => {
		tasks.set([]);
	});

const inputSection = el.section(
	{ css: card },
	hstack(
		{ spacing: 10, alignment: "center", wrap: true },
		el.label("タスク").minWidth("44px").font({ color: theme.muted }),
		draftField,
		prioritySelect,
		addButton,
	),
	hstack(
		{ spacing: 10, alignment: "center" },
		clearDoneButton,
		clearAllButton,
	),
);

// ── helpers: priority-driven derived values ────────────────────────────────
const PRIORITY_COLOR: Record<Priority, string> = {
	high: "#ef4444",
	medium: "#f59e0b",
	low: "#22c55e",
};

const PRIORITY_LABEL: Record<Priority, string> = {
	high: "高",
	medium: "中",
	low: "低",
};

// ── view: task list（each scope を保つため inline の arrow を維持）─────────
const taskListSection = el.section(
	{ css: card },
	el
		.ul({ css: list })
		.grid({ gap: "10px" })
		.appendChild(
			tasks.each((item) =>
				el
					.li(
						hstack(
							{ spacing: 12, alignment: "center" },
							// チェックボックス（.checked() + .on('change')）
							el
								.input({ type: "checkbox" })
								.checked(item.map((t) => t.done))
								.on("change", (e: Event) => {
									const checked = (e.target as HTMLInputElement).checked;
									const cur = item.get();
									tasks.set(
										tasks
											.get()
											.map((t) =>
												t.text === cur.text && t.priority === cur.priority
													? { ...t, done: checked }
													: t,
											),
									);
								}),
							// タスク名（.text() + 完了時のみ .class('done-text')）
							// OQ-2: each 内 `.class(item.map(...))` の動的バインドを検証する。
							el
								.span()
								.text(item.map((t) => t.text))
								.class(item.map((t) => (t.done ? "done-text" : "")))
								.flex("1 1 auto")
								.font({ color: theme.text }),
							// 優先度 pill（.text() + .setStyle('color', ...) で動的色変更）
							el
								.span({ css: pill })
								.text(item.map((t) => PRIORITY_LABEL[t.priority]))
								.setStyle(
									"color",
									item.map((t) => PRIORITY_COLOR[t.priority]),
								)
								.font({ size: "12px" }),
							// 削除ボタン
							el
								.button({ type: "button", css: deleteBtn }, "✕")
								.on("click", () => {
									const cur = item.get();
									tasks.set(
										tasks
											.get()
											.filter(
												(t) =>
													!(t.text === cur.text && t.priority === cur.priority),
											),
									);
								}),
						),
					)
					.padding("12px 14px")
					.cornerRadius("12px")
					// 優先度別 border 色アクセント（.setStyle('borderColor', item.map(...))）
					.border({ width: "2px", style: "solid", color: theme.border })
					.setStyle(
						"borderColor",
						item.map((t) => PRIORITY_COLOR[t.priority]),
					)
					.background("rgba(0,0,0,0.22)"),
			),
		),
);

// ── view: footer ───────────────────────────────────────────────────────────
const footerNode = el
	.footer(el.small("Generated by DraftOle (Priority Tasks)"))
	.font({ color: theme.muted })
	.margin("18px 0 0");

// ── compose ────────────────────────────────────────────────────────────────
const content = vstack(
	undefined,
	titleHeader,
	statsSection,
	inputSection,
	taskListSection,
	footerNode,
)
	.frame({ maxWidth: 860 })
	.margin("0 auto")
	.padding("36px 18px 60px")
	.background(theme.bg)
	.font({ family: "ui-sans-serif, system-ui, sans-serif", color: theme.text });

doc.exportTo(content, "./.out/runs/priority_tasks");
console.log("✓ Priority Tasks generated → .out/runs/priority_tasks/");
