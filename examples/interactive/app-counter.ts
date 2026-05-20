/**
 * APPX-1: 最小の App サンプル — Counter
 *
 * app() で AppDocument を生成し、
 * binding / event の 2 概念を示す。
 *
 * ─ binding: span().text(count.map(...)) で state 値を要素に連動させる
 * ─ event  : button().on('click', handler) で state を更新する
 *
 * 実行: pnpm demo:app-counter
 */

import { app, el, hstack, vstack, type State } from "draft-ole";

const doc = app({ title: "App Counter", lang: "ja", wrapDOMReady: true });
const count: State<number> = doc.state(0);

// ── binding: span テキストが count に連動する ─────────────────────────────

const display = el.span()
	.text(count.map((n: number) => String(n)))
	.font({ size: "4rem", weight: "700", family: "monospace" });

const subtitle = el.p("現在のカウント値").font({ size: "0.9rem", color: "#888" });

// ── UI 構成 ───────────────────────────────────────────────────────────────

const incBtn = el.button({ type: "button" }, "+1")
	.on("click", () => {
		count.set(count.get() + 1);
	})
	.padding("10px 24px")
	.cornerRadius("8px")
	.background("#4f46e5")
	.foregroundStyle("#fff")
	.font({ size: "1rem", weight: "600" });

const decBtn = el.button({ type: "button" }, "−1")
	.on("click", () => {
		count.set(count.get() - 1);
	})
	.padding("10px 24px")
	.cornerRadius("8px")
	.background("#e5e7eb")
	.font({ size: "1rem", weight: "600" });

const resetBtn = el.button({ type: "button" }, "リセット")
	.on("click", () => {
		count.set(0);
	})
	.padding("10px 24px")
	.cornerRadius("8px")
	.background("#f9fafb")
	.font({ size: "1rem", color: "#6b7280" });

const valueBox = vstack({ spacing: 4 }, subtitle, display).padding("24px 0");

const btnRow = hstack({ spacing: 12 }, incBtn, decBtn, resetBtn);

const card = vstack({ spacing: 20 }, el.h1("App Counter"), valueBox, btnRow)
	.padding("48px")
	.frame({ maxWidth: 480 })
	.margin("80px auto")
	.cornerRadius("16px")
	.border({ width: "1px", style: "solid", color: "#e5e7eb" });

// ── 出力: app().exportTo() で HTML/CSS/JS を生成 ─────────────────────────

doc.exportTo(card, "./.out/runs/app_counter");
console.log("✓ App Counter → .out/runs/app_counter/");
