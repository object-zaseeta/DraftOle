# DraftOle

**TypeScript everywhere, including your HTML.**

The same modifier-chain DSL writes your landing pages, your docs, and your apps. No bundler. No JSX. No template language.

> **What this is:** DraftOle is a TypeScript-native UI library. You compose views with a small set of primitives (`Section`, `VStack`, `HStack`, `Text`, `Heading`, `Button`, `Link`) and apply modifiers (`.padding()`, `.background()`, `.frame()`...) the way SwiftUI taught us to. Pick `page()` for static output (LPs, docs, articles) or `app()` for interactive surfaces (counter, todo, form). Same DSL, same modifiers. See [docs/positioning.md](docs/positioning.md).

## Features

- **Two entries, one DSL** — `page()` for static HTML, `app()` for interactive apps with reactive `state()` and `.on()` event handlers
- **Modifier-driven styling** — `.padding()`, `.background()`, `.foregroundStyle()`, `.font()`, `.frame()`, `.cornerRadius()`, `.boxShadow()`, `.border()` produce scoped CSS per node
- **Type-safe end-to-end** — HTML attribute typos are compile errors; `strict: true` reaches your `<div>`
- **No bundler, no JSX, no template language** — runs on tsx, ts-node, or `node --experimental-strip-types`
- **Zero production dependencies** — one entry in `node_modules`

## Installation

```bash
npm install draft-ole
# or
pnpm add draft-ole
# or
yarn add draft-ole
```

> 🧪 **0.9.1 (pre-1.0)** — public API は概ね固まっていますが、1.0 に向けて feedback を集めているフェーズです。Issues / Discussions 歓迎です。

## Quick Start

**1. Create a script** (e.g. `build-page.ts`):

```typescript
import { page, Page, Section, VStack, Text } from 'draft-ole';

const hero = Section(
  VStack({ spacing: 16 },
    Text('Hello, DraftOle!')
      .font({ size: '2rem', weight: '700' })
      .foregroundStyle('#1a1a2e'),
    Text('TypeScript everywhere, including your HTML.')
      .font({ size: '1.125rem' })
      .foregroundStyle('#4a4a6a'),
  )
    .padding(48)
    .frame({ maxWidth: 720 }),
)
  .background('#f8f9ff');

const doc = page(
  Page(hero),
  {
    lang: 'en',
    title: 'Hello, DraftOle',
  },
);

console.log(doc.render());
```

**2. Run it:**

```bash
node --experimental-strip-types build-page.ts
```

This prints a complete static HTML document. To write `index.html` / `style.css` to a directory, use `doc.export('./dist')`.

For a longer working example see [`examples/page-minimal.ts`](examples/page-minimal.ts) (a hero + features section) and [`examples/page-landing.ts`](examples/page-landing.ts) (a multi-section LP).

## Core Concepts

| Concept | Description |
|---|---|
| **`page(view, meta?)`** | Entry point. Wraps a `Page` view with document metadata (lang / title / charset / viewport / description) and returns a `PageDocument`. |
| **`Page`, `Section`** | Top-level structural views. `Page` is the root view, `Section` is a semantic block inside a page. |
| **`VStack`, `HStack`** | Vertical / horizontal layout primitives with `spacing` option. |
| **`Text`** | Text view, the leaf primitive for written content. |
| **Modifiers** | `.padding()`, `.background()`, `.foregroundStyle()`, `.font({ size, weight, ... })`, `.frame({ maxWidth, ... })`, `.cornerRadius()` — scoped, per-view styling. |
| **`PageDocument`** | The result of `page()`. Use `.render()` to get the HTML string, or `.export(dir)` to write `index.html` / `style.css`. |

## Examples

See [`examples/`](examples/) for the curated read-order. Recommended path:

1. [`examples/page-minimal.ts`](examples/page-minimal.ts) — minimum `page()` example
2. [`examples/page-landing.ts`](examples/page-landing.ts) — multi-section LP using only View modifiers
3. `examples/showcase-card.ts` / `showcase-button.ts` / `showcase-list.ts` — layout / modifier showcases
4. [`examples/interactive/mvp-demo.ts`](examples/interactive/mvp-demo.ts) — *advanced / interactive* example (Todo app with embedded JS)

The full read order is documented in [`examples/README.md`](examples/README.md).

## Why DraftOle? (vs Astro / Next.js / Hono JSX)

DraftOle is a deliberately small TypeScript-native UI library. It is not a
full framework (no routing, no SSR, no hydration), and it does not try to be.
What it gives you is one DSL that writes both static pages and interactive
apps, with the type checker reaching all the way to your HTML.

| | DraftOle | Astro | Hono JSX (SSG) | Next.js static export |
|---|:---:|:---:|:---:|:---:|
| Type-safe HTML attrs (typo = compile error) | ✅ strict | 🟡 props only | 🟡 JSX-loose | 🟡 JSX-loose |
| SwiftUI-style modifier chain | ✅ | ❌ | ❌ | ❌ |
| Zero JS runtime in output | ✅ | ✅ if no islands | ✅ | ❌ React ships |
| Zero production dependencies | ✅ | ❌ | 🟡 light | ❌ |
| Bundler required | ❌ | ✅ Vite | 🟡 usually | ✅ Webpack/Turbopack |
| Best for | Static LP / docs / articles | Static + islands sites | TS-first SSG | React-heavy apps |

### When to use DraftOle

- You are TypeScript-fluent and want to write a static LP or doc page as **one function**
- You do not want a bundler, a framework runtime, or a template language in the loop
- HTML structural correctness should be enforced by the type checker
- Output should be plain HTML + scoped CSS — nothing else

### When to use something else

- **You need islands or hydration** → Astro is purpose-built for this
- **You are already deep in React with shared components** → Next.js static export keeps you in your stack
- **You want JSX trees instead of modifier chains** → Hono JSX is lighter than Next and gives you that
- **Markdown is your primary content** → 11ty or Astro have stronger content stories

### Why not Hono JSX?

Hono JSX is the closest cousin to DraftOle in spirit: TypeScript-native, lightweight,
function-as-page. We genuinely like it. The differences:

1. **API shape**: Hono uses JSX trees (`<Section><Text /></Section>`). DraftOle uses
   function composition with modifier chains
   (`Section(Text('...').padding(8)).background('#fff')`). Pick whichever feels more
   readable to you — both are legitimate.
2. **Type strictness**: DraftOle's HTML attribute types are intentionally stricter than
   JSX (where most attributes are `string`). A typo'd `colur` is a compile error.
3. **Zero production dependencies**: DraftOle ships with literally one entry in
   `node_modules`. Hono is small but not zero.
4. **Modifier-first styling**: `.padding(48)` is a method on the view, not a prop on
   a JSX element. The chained-modifier style scales nicely for nested layout intent.
5. **Static-page focus**: Hono is primarily an HTTP framework that happens to render
   JSX. DraftOle is primarily a static-page DSL with an interactive escape hatch
   (`app()`).

If you prefer JSX and a broader server framework, use Hono. If you prefer modifier
chains and zero production dependencies, DraftOle is for you.

## Scripts

```bash
pnpm build       # Compile to dist/ (ESM + CJS + .d.ts)
pnpm test        # Run Vitest suite
pnpm lint        # ESLint
pnpm typecheck   # tsc --noEmit
pnpm demo:mvp    # Run the MVP demo → .out/runs/mvp_demo/
```

## Use Cases

DraftOle covers a useful slice of the modern web stack with two first-class entries:

**`page()` — static output** (no runtime JS shipped to the browser):
- Landing pages
- Documentation pages
- Articles and long-form reports
- Static dashboards / status pages
- Marketing one-pagers

**`app()` — interactive apps** (minimal state engine bundled):
- Counters, toggles, single-input forms
- Todo apps, shopping carts, small CRUDs
- Interactive sections embedded in static pages (island-like)

See [`examples/interactive/`](examples/interactive/) for working app demos (counter, todo, form, cart, gallery, priority tasks). See [docs/positioning.md](docs/positioning.md) for what DraftOle deliberately does **not** try to be (routing, SSR, hydration, large component ecosystem).

## Advanced / Compatibility

The legacy `Root` + `html/body/div` + `FileExporter` API is still present for back-compatibility and advanced use cases. It is **not** the recommended starting point for new users; new code should start from `page()` or `app()`. See the source under `src/html/` for that path.

## Tech Stack

| Item | Choice |
|------|--------|
| Language | TypeScript 5.x (strict mode) |
| Runtime | Node.js 18+ |
| Build | tsup (esbuild-based) |
| Test | Vitest |
| Output | ESM + CJS + .d.ts |

## License

MIT
