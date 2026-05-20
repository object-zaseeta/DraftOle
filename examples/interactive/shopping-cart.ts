/** DraftOle Shopping Cart: 3 商品のショッピングカート UI（canonical 1.0.0）
 *
 * `mvp-demo.ts` の canonical 1.0.0 構造（theme tokens → theme.class → app() →
 * state → view 部品 → compose → doc.exportTo）を踏襲し、旧 api-ergonomics
 * ショーケース（`tests/examples/fixtures/mvp-demo7.ts`）の Shopping Cart を
 * 1.0.0 公開 surface（`app / css / el / hstack / vstack / UnifiedTheme`）のみで
 * 再実装する。
 *
 * 主な実装ポイント:
 *   - `cart.each((item) => ...)` + `el.ul(...).appendChild(...)` パターン
 *   - 各商品行に「− / 数量 / ＋ / 小計 / ✕ 削除（class('remove-btn')）」を配置
 *   - 数量 +/- ボタンは `item.set({...item.get(), qty: ...})` で個別更新
 *   - 削除ボタンは `cart.set(cart.get().filter(p => p !== item.get()))`
 *   - 合計 ¥25,000、送料 "¥0（無料）"、"注文を確定する" ボタン（confirm dialog）
 *
 * 出力先: `./.out/runs/shopping_cart/`
 * 実行: pnpm tsx examples/interactive/shopping-cart.ts
 *
 * NOTE: page title は `"DraftOle Shopping Cart"`（旧 `'DraftOle MVP Demo 7'` から更新）。
 * `tests/e2e/shopping-cart.spec.ts` の title assertion は task 3.6 で整合化される。
 */

import { app, css, el, hstack, type UnifiedTheme, vstack } from "draft-ole";

type Product = { name: string; price: number; qty: number };

// ── theme: tokens ──────────────────────────────────────────────────────────
const themeTokens = {
	bg: "#0b1220",
	panel: "rgba(255,255,255,0.06)",
	border: "rgba(255,255,255,0.12)",
	text: "rgba(255,255,255,0.92)",
	muted: "rgba(255,255,255,0.68)",
	accent: "#7c5cff",
	success: "#22c55e",
	danger: "#ef4444",
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
	padding: "18px",
	marginTop: "14px",
});

const listSt = theme.class({
	listStyle: "none",
	padding: "0",
	margin: "0",
	display: "grid",
	gap: "10px",
});

// 数量 +/- ボタン（円形ボタン）
const qtyBtnSt = theme.class({
	width: "28px",
	height: "28px",
	borderRadius: "7px",
	border: "1px solid rgba(255,255,255,0.12)",
	background: "rgba(255,255,255,0.08)",
	color: "text",
	cursor: "pointer",
	flexShrink: "0",
});

// 削除ボタン（✕）— `.remove-btn` クラスは別途 fluent `.class()` で付与する
const smallBtn = theme.class({
	padding: "7px 12px",
	borderRadius: "8px",
	border: "1px solid rgba(255,255,255,0.12)",
	background: "rgba(255,255,255,0.06)",
	color: "text",
	cursor: "pointer",
});

const summaryRow = theme.class({
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
	padding: "5px 0",
});

const dividerSt = theme.class({
	height: "1px",
	background: "border",
	margin: "10px 0",
});

const checkoutBtn = theme.class({
	padding: "12px",
	borderRadius: "9px",
	border: "none",
	background: "accent",
	color: "#fff",
	cursor: "pointer",
	fontWeight: "600",
	fontSize: "15px",
	width: "100%",
});

const itemRow = theme.class({
	display: "flex",
	alignItems: "center",
	gap: "10px",
	padding: "12px 14px",
	borderRadius: "10px",
	background: "rgba(0,0,0,0.18)",
});

const nameSt = theme.class({
	flex: "1 1 auto",
	fontSize: "15px",
});

const subSt = theme.class({
	fontSize: "12px",
});

// `.remove-btn:hover` の danger 色アクセント — `.class('remove-btn')` バインドの
// 受け皿として `css.raw` を使用（1.0.0 公開 surface 内の escape hatch）。
const removeBtnHoverRule = css.raw(
	`.remove-btn:hover { border-color: ${themeTokens.danger} !important; color: ${themeTokens.danger} !important; }`,
);

// ── app & state ────────────────────────────────────────────────────────────
const doc = app({
	title: "DraftOle Shopping Cart",
	lang: "ja",
	css: [css.reset(), theme.css, removeBtnHoverRule],
});

// 初期カート（cart-app.spec.ts assertion contract と一致）
const cart = doc.state<Product[]>([
	{ name: "TypeScript 実践ガイド", price: 3200, qty: 1 },
	{ name: "メカニカルキーボード", price: 12800, qty: 1 },
	{ name: "USB-C ハブ 7-in-1", price: 4500, qty: 2 },
]);

const itemCount = cart.map((c) => c.reduce((s, p) => s + p.qty, 0));
const subtotal = cart.map((c) => c.reduce((s, p) => s + p.price * p.qty, 0));

// ── view: header ───────────────────────────────────────────────────────────
const titleHeader = el.header(
	{ css: card },
	el.h1("🛒 DraftOle Shopping Cart").font({ size: "24px" }),
	el
		.p("3 商品のカート — 数量変更・削除・チェックアウト")
		.font({ color: theme.muted }),
);

// ── view: cart summary（商品数 / 合計）─────────────────────────────────────
const summarySection = el.section(
	{ css: card },
	hstack(
		{ spacing: 12, alignment: "center", wrap: true },
		el.span("商品数:").font({ color: theme.muted, size: "14px" }),
		el
			.span()
			.text(itemCount.map(String))
			.font({ color: theme.text, weight: "600" }),
		el.span("合計:").font({ color: theme.muted, size: "14px" }),
		el
			.span()
			.text(subtotal.map((v) => `¥${v.toLocaleString()}`))
			.font({ color: theme.accent, weight: "700", size: "20px" }),
	),
);

// ── view: cart items（each + appendChild パターン）──────────────────────────
const cartItemsSection = el.section(
	{ css: card },
	el.h2("カート内容").font({ size: "14px", color: theme.muted }),
	el
		.ul({ css: listSt })
		.appendChild(
			cart.each((item) =>
				el
					.li({ css: itemRow })
					.appendChild(
						el
							.div()
							.flex("1 1 auto")
							.appendChild(
								el
									.span({ css: nameSt })
									.text(item.map((p) => p.name))
									.font({ color: theme.text }),
							)
							.appendChild(
								el
									.span({ css: subSt })
									.text(item.map((p) => `¥${p.price.toLocaleString()}`))
									.font({ color: theme.muted }),
							),
					)
					.appendChild(
						// 数量 − ボタン
						el
							.button({ type: "button", css: qtyBtnSt }, "−")
							.on("click", () => {
								const cur = item.get();
								item.set({ ...cur, qty: Math.max(1, cur.qty - 1) });
							}),
					)
					.appendChild(
						// 数量表示
						el
							.span()
							.minWidth("22px")
							.textAlign("center")
							.text(item.map((p) => String(p.qty)))
							.font({ color: theme.text }),
					)
					.appendChild(
						// 数量 + ボタン
						el
							.button({ type: "button", css: qtyBtnSt }, "＋")
							.on("click", () => {
								const cur = item.get();
								item.set({ ...cur, qty: cur.qty + 1 });
							}),
					)
					.appendChild(
						// 小計（価格 × 数量）
						el
							.span()
							.minWidth("90px")
							.textAlign("right")
							.text(item.map((p) => `¥${(p.price * p.qty).toLocaleString()}`))
							.font({ color: theme.accent, weight: "600" }),
					)
					.appendChild(
						// 削除ボタン — `.class('remove-btn')` で e2e の `.remove-btn` セレクタを満たす
						el
							.button({ type: "button", css: smallBtn }, "✕")
							.class("remove-btn")
							.on("click", () => {
								const current = item.get();
								cart.set(cart.get().filter((p) => p !== current));
							}),
					),
			),
		),
);

// ── view: summary panel（小計 / 送料 / 合計 / checkout）─────────────────────
const totalsSection = el.section(
	{ css: card },
	el.div(
		{ css: summaryRow },
		el.span("小計").font({ color: theme.muted }),
		el
			.span()
			.text(subtotal.map((v) => `¥${v.toLocaleString()}`))
			.font({ color: theme.text }),
	),
	el.div(
		{ css: summaryRow },
		el.span("送料").font({ color: theme.muted }),
		el.span("¥0（無料）").font({ color: theme.success }),
	),
	el.div({ css: dividerSt }),
	el.div(
		{ css: summaryRow },
		el.span("合計").font({ weight: "700" }),
		el
			.span()
			.text(subtotal.map((v) => `¥${v.toLocaleString()}`))
			.font({ color: theme.accent, weight: "700", size: "22px" }),
	),
	el.div(
		{},
		el
			.button({ type: "button", css: checkoutBtn }, "注文を確定する")
			.on("click", () => {
				if (confirm("注文を確定しますか？")) {
					cart.set([]);
				}
			}),
	).margin("14px 0 0"),
);

// ── view: footer ───────────────────────────────────────────────────────────
const footerNode = el
	.footer(el.small("Generated by DraftOle (Shopping Cart)"))
	.font({ color: theme.muted, size: "12px" })
	.margin("18px 0 0");

// ── compose ────────────────────────────────────────────────────────────────
const content = vstack(
	undefined,
	titleHeader,
	summarySection,
	cartItemsSection,
	totalsSection,
	footerNode,
)
	.frame({ maxWidth: 700 })
	.margin("0 auto")
	.padding("32px 16px 60px")
	.background(theme.bg)
	.font({ family: "ui-sans-serif, system-ui, sans-serif", color: theme.text });

doc.exportTo(content, "./.out/runs/shopping_cart");
console.log("✓ Shopping Cart generated → .out/runs/shopping_cart/");
