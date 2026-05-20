/**
 * APPX-2: 最小の App サンプル — Form
 *
 * app() で AppDocument を生成し、State<string> と form input / button の連携を示す。
 *
 * ─ state  : doc.state('') で State<string> を生成
 * ─ binding: el.span().text(name.map(...)) で state 値を要素に連動させる
 * ─ event  : el.input().on('input', (e) => name.set(...)) で入力値を state に同期する
 *            el.button().on('click', () => ...) で送信処理を実行する
 *
 * 実行: pnpm demo:app-form
 */

import { app, el, hstack, vstack, type State } from "draft-ole";

// ────────────────────────────────────────────────────────────
// app / state: テキスト入力値 (State<string>)
// ────────────────────────────────────────────────────────────

const doc = app({ title: "App Form", lang: "ja", wrapDOMReady: true });
const name: State<string> = doc.state("");
const submitted: State<string> = doc.state("");

// ────────────────────────────────────────────────────────────
// binding: span テキストが name / submitted に連動する
// ────────────────────────────────────────────────────────────

const preview = el.span()
	.text(name.map((v) => (v.length > 0 ? v : "（未入力）")))
	.font({ size: "1rem", color: "#6b7280", family: "monospace" });

const resultMessage = el.span()
	.text(submitted.map((v) => (v.length > 0 ? `送信済み: ${v}` : "")))
	.font({ size: "0.95rem", color: "#059669", weight: "600" });

// ────────────────────────────────────────────────────────────
// event: input で state<string> を更新する
// ────────────────────────────────────────────────────────────

const nameInput = el.input({ type: "text", placeholder: "お名前を入力…" })
	.value(name)
	.on("input", (e: Event) => {
		name.set((e.target as HTMLInputElement).value);
	})
	.padding("10px 14px")
	.cornerRadius("8px")
	.border({ width: "1px", style: "solid", color: "#d1d5db" })
	.font({ size: "1rem" })
	.frame({ width: "100%" });

const submitBtn = el.button({ type: "button" }, "送信")
	.on("click", () => {
		submitted.set(name.get());
		name.set("");
	})
	.padding("10px 24px")
	.cornerRadius("8px")
	.background("#4f46e5")
	.foregroundStyle("#fff")
	.font({ size: "1rem", weight: "600" });

const clearBtn = el.button({ type: "button" }, "クリア")
	.on("click", () => {
		name.set("");
		submitted.set("");
	})
	.padding("10px 24px")
	.cornerRadius("8px")
	.background("#f3f4f6")
	.font({ size: "1rem", color: "#6b7280" });

// ────────────────────────────────────────────────────────────
// UI 構成: フォーム入力フィールドと送信ボタン
// ────────────────────────────────────────────────────────────

const inputLabel = el.label({}, "お名前")
	.font({ size: "0.875rem", weight: "600", color: "#374151" });

const inputRow = vstack({ spacing: 6 }, inputLabel, nameInput);

const previewRow = hstack(
	{ spacing: 8, alignment: "center" },
	el.p("入力プレビュー:").font({ size: "0.8rem", color: "#9ca3af" }),
	preview,
)
	.padding("8px 12px")
	.cornerRadius("6px")
	.background("#f9fafb");

const btnRow = hstack({ spacing: 12 }, submitBtn, clearBtn);

const resultRow = vstack({ spacing: 0 }, resultMessage).padding("8px 0");

const card = vstack(
	{ spacing: 20 },
	el.h1("App Form"),
	inputRow,
	previewRow,
	btnRow,
	resultRow,
)
	.padding("48px")
	.frame({ maxWidth: 480 })
	.margin("80px auto")
	.cornerRadius("16px")
	.border({ width: "1px", style: "solid", color: "#e5e7eb" });

// ────────────────────────────────────────────────────────────
// 出力: app().exportTo() で HTML/CSS/JS を生成
// ────────────────────────────────────────────────────────────

doc.exportTo(card, "./.out/runs/app_form");
console.log("✓ App Form → .out/runs/app_form/");
