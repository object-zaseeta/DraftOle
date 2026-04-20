# DraftOle

Declaratively build HTML, CSS, and JavaScript as a single TypeScript program — one source of truth, fully type-checked, statically compiled into plain files.

## Features

- **Type-safe HTML generation** - Build HTML structures with full TypeScript type safety
- **Scoped CSS** - Component-level CSS generation with no global pollution
- **JavaScript integration** - jQuery-style event and DOM manipulation
- **Zero runtime** - Everything is statically generated at build time
- **Zero dependencies** - No production dependencies

## Screenshot

![MVP Demo output](docs/images/mvp-demo.png)

Generated from [`examples/mvp-demo.ts`](examples/mvp-demo.ts) — run `pnpm build && pnpm demo:mvp` to reproduce.

## Installation

> ⚠️ Not yet published to npm. Install from source for now:

```bash
git clone https://github.com/object-zaseeta/DraftOle.git
cd DraftOle
pnpm install
pnpm build
```

Then link it from your project:

```bash
# in your project
pnpm link --global <path-to-DraftOle>
```

## Quick Start

**1. Create a script** (e.g. `build-site.ts`):

```typescript
import { Root, html, head, body, div, h1, p, createStyle, FileExporter } from 'draft-ole';

// Scoped CSS (auto-hashed class name, no global pollution)
const card = createStyle('card', {
  padding: '16px',
  borderRadius: '12px',
  background: '#f5f5f5',
});

const root = new Root();
root.addGlobalCss(card.css);
root.addChild(
  html({ lang: 'en' },
    head(),
    body(
      div({ class: card.className },
        h1('Hello, DraftOle!').color('#333'),
        p('Static site generated from TypeScript.').margin('8px 0 0'),
      ),
    ),
  ),
);

new FileExporter().export(
  root.render(),
  root.collectCssStyleString(),
  '',                 // optional JS
  './dist',
);
```

**2. Run it:**

```bash
node --experimental-strip-types build-site.ts
```

**3. Check the output:**

```
dist/
├── index.html
├── style.css
└── script.js
```

Open `dist/index.html` in a browser — done.

## Core Concepts

| Concept | Description |
|---|---|
| **`Root`** | Top-level document container. Collects global CSS, child trees, and produces final output. |
| **Tag factories** (`div`, `h1`, `p`, ...) | Build HTML elements. Accept `(attrs?, ...children)` and return a chainable `HtmlTag`. |
| **Fluent style methods** | `.color()`, `.margin()`, `.padding()`, `.background()` (shorthand), `.backgroundColor()`, etc. — apply scoped CSS per node. |
| **`createStyle(name, props)`** | Define a reusable scoped CSS class. `.className` → use in `class` attr, `.css` → emit CSS. |
| **`createTheme(vars)`** | Define CSS custom properties. Access via `theme.foo`, emit via `theme.css`. |
| **`FileExporter`** | Writes `index.html`, `style.css`, `script.js` to a directory. |

## Examples

See the [`examples/`](examples/) directory:

- [`mvp-demo.ts`](examples/mvp-demo.ts) — full Todo app (themes, scoped styles, embedded JS)
- [`react-demo.tsx`](examples/react-demo.tsx) — React integration pattern

## Scripts

```bash
pnpm build       # Compile to dist/ (ESM + CJS + .d.ts)
pnpm test        # Run Vitest suite
pnpm lint        # ESLint
pnpm typecheck   # tsc --noEmit
pnpm demo:mvp    # Run the MVP demo → output/mvp_demo/
```

## Use Cases

- As a layer for SSG (Static Site Generators)
- Server-side HTML generation (Node.js)
- Programmatic web page construction
- Isolated components across micro-frontends

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
