# DraftOle

A DSL (Domain Specific Language) library that generates HTML, CSS, and JavaScript all from TypeScript.

Ported from the Swift version of [DraftOle](https://github.com/object-zaseeta/DraftOle).

## Features

- **Type-safe HTML generation** - Build HTML structures with full TypeScript type safety
- **Scoped CSS** - Component-level CSS generation with no global pollution
- **JavaScript integration** - jQuery-style event and DOM manipulation
- **Zero runtime** - Everything is statically generated at build time
- **Zero dependencies** - No production dependencies

## Example

```typescript
import { div, p, span } from 'draft-ole';

// HTML generation
const html = div({ class: 'container' },
  p('Hello, World!'),
  span('DraftOle')
).render();
// => '<div class="container"><p>Hello, World!</p><span>DraftOle</span></div>'

// Scoped CSS
const button = div().css.backgroundColor('blue').css.padding('10px');
button.renderCss();
// => '._hash123 { background-color: blue; padding: 10px; }'
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

## Setup

```bash
npm install
npm run build
npm run test
```

## License

MIT
