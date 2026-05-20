/** DraftOle Card Gallery Demo
 *
 * each() + modifier-chain CSS の組み合わせを豊富に exercise するデモ。
 * カード一覧 + add/remove インタラクション。
 *
 * 実行: pnpm demo:card-gallery
 */

import { app, css, el, hstack, type UnifiedTheme, vstack } from "draft-ole";

type Card = {
	id: number;
	title: string;
	description: string;
	category: "design" | "engineering" | "research";
	featured: boolean;
};

// ── theme: tokens ──────────────────────────────────────────────────────────
const themeTokens = {
	bg: "#0f172a",
	panel: "rgba(255,255,255,0.06)",
	border: "rgba(255,255,255,0.12)",
	text: "rgba(255,255,255,0.92)",
	muted: "rgba(255,255,255,0.62)",
	accent: "#7c5cff",
	accentSoft: "rgba(124,92,255,0.18)",
	gold: "#f59e0b",
	radius: "16px",
	shadow: "0 18px 60px rgba(0,0,0,0.35)",
};

const theme: UnifiedTheme<typeof themeTokens> = css.theme(themeTokens) as UnifiedTheme<typeof themeTokens>;

// ── theme.class(): カード共通 + ヘッダー + ボタン ──
const card = theme.class({
	background: "panel",
	border: "1px solid rgba(255,255,255,0.12)",
	borderRadius: "radius",
	boxShadow: "shadow",
	padding: "20px",
});

const cleanList = theme.class({
	listStyle: "none",
	padding: "0",
	margin: "0",
});

const heroPanel = theme.class({
	background: "panel",
	border: "1px solid rgba(255,255,255,0.12)",
	borderRadius: "radius",
	boxShadow: "shadow",
	padding: "24px",
	marginBottom: "20px",
});

const primaryBtn = theme.class({
	padding: "10px 18px",
	borderRadius: "10px",
	border: "1px solid transparent",
	background: "accent",
	color: "#ffffff",
	cursor: "pointer",
});

// ── initial data ────────────────────────────────────────────────────────────
const initialCards: Card[] = [
	{ id: 1, title: "Spec-Driven Workflow", description: "Requirements → Design → Tasks → Impl の 4 段階で AI 支援開発を進める。", category: "engineering", featured: true },
	{ id: 2, title: "Color System Audit", description: "デザイントークンを var(--*) に集約し、出力 CSS の保守性を向上させる。", category: "design", featured: false },
	{ id: 3, title: "Type Safety Hardening", description: "any を排除し、ユニオン型と narrowing で boundary を明示する。", category: "engineering", featured: false },
	{ id: 4, title: "User Interview Synthesis", description: "Discovery で得た 12 件のインサイトをパターン化し優先度を再評価。", category: "research", featured: true },
	{ id: 5, title: "Component Library Refresh", description: "primitives 層の重複を整理し、再利用率の高い小さな単位に分解。", category: "design", featured: false },
];

// ── app & state ─────────────────────────────────────────────────────────────
const doc = app({
	title: "DraftOle Card Gallery",
	lang: "ja",
	css: [css.reset(), theme.css],
});

const cards = doc.state<Card[]>(initialCards);
const total = cards.map((cs) => cs.length);
const featuredCount = cards.map((cs) => cs.filter((c) => c.featured).length);

// ── view: hero / header ────────────────────────────────────────────────────
const heroSection = el.section(
	{ css: heroPanel },
	el.h1("Card Gallery").font({ size: "32px", weight: "700" }),
	el.p("each() + modifier-chain CSS のショーケース")
		.font({ color: theme.muted, size: "15px", lineHeight: "1.6" }),
);

// ── view: stats / actions ──────────────────────────────────────────────────
const addCardButton = el.button({ type: "button", css: primaryBtn }, "+ カードを追加").on("click", () => {
	const cur = cards.get();
	const id = cur.length === 0 ? 1 : cur[cur.length - 1].id + 1;
	cards.set([...cur, {
		id,
		title: `Sample Card #${id}`,
		description: "新しく追加されたカード。modifier-chain CSS が適用されている。",
		category: "engineering",
		featured: false,
	}]);
});

const removeLastButton = el.button({ type: "button", css: primaryBtn }, "末尾を削除").on("click", () => {
	const cur = cards.get();
	if (cur.length > 0) {
		cards.set(cur.slice(0, -1));
	}
});

const statsSection = el.section(
	{ css: card },
	hstack(
		{ spacing: 16, alignment: "center", wrap: true },
		el.span().text(total.map((n) => `${n} cards`)).font({ size: "16px", weight: "600", color: theme.text }),
		el.span().text(featuredCount.map((n) => `★ ${n} featured`)).font({ size: "14px", color: theme.gold }),
		el.div().flex("1 1 auto"),
		addCardButton,
		removeLastButton,
	),
);

// ── view: card grid ────────────────────────────────────────────────────────
const cardListSection = el.section(
	{ css: card },
	el.h2("Items").font({ size: "20px", weight: "700" }),
	el.ul({ css: cleanList, role: "list" }).grid({ gap: "14px" }).appendChild(
		cards.each((item) =>
			el.li(
				vstack(
					{ spacing: 10, alignment: "flex-start" },
					el.span().text(item.map((c) => `${c.featured ? "★ " : ""}${c.title}`))
						.font({ size: "16px", weight: "700", color: theme.text }),
					el.span().text(item.map((c) => c.description))
						.font({ size: "14px", lineHeight: "1.6", color: theme.muted }),
					el.span().text(item.map((c) => c.category))
						.font({ size: "11px", weight: "600", color: theme.accent })
						.padding("3px 10px")
						.cornerRadius("6px")
						.background(theme.accentSoft)
						.border({ width: "1px", style: "solid", color: "rgba(124,92,255,0.4)" }),
				),
			)
				.padding("16px")
				.cornerRadius("12px")
				.border({ width: "1px", style: "solid", color: theme.border })
				.background("rgba(0,0,0,0.22)"),
		),
	),
);

// ── view: footer ───────────────────────────────────────────────────────────
const footerNode = el.footer(el.small("Generated by DraftOle"))
	.font({ color: theme.muted, size: "12px" })
	.margin("24px 0 0");

// ── compose ────────────────────────────────────────────────────────────────
const content = vstack(undefined, heroSection, statsSection, cardListSection, footerNode)
	.frame({ maxWidth: 920 })
	.margin("0 auto")
	.padding("36px 18px 60px")
	.background(theme.bg)
	.font({ family: "ui-sans-serif, system-ui, sans-serif", color: theme.text });

doc.exportTo(content, "./.out/runs/card_gallery");
console.log("✓ Card Gallery generated → .out/runs/card_gallery/");
