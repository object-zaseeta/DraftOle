import {
  Root,
  html, head, body, title, meta, div,
  FileExporter,
} from '../dist/index.js';

import { color, font, space, layout } from './tokens.ts';
import { Hero } from './components/hero.ts';
import { Features } from './components/features.ts';
import { CodeExample } from './components/code-example.ts';
import { FooterCta } from './components/footer-cta.ts';

// ── Document ──
const root = new Root();

const page = html({ lang: 'ja' },
  head(
    meta({ charset: 'utf-8' }),
    meta({ name: 'viewport', content: 'width=device-width, initial-scale=1.0' }),
    title('DraftOle — TypeScript DSL for Web'),
  ),
  body(
    div(
      Hero(),
      Features(),
      CodeExample(),
      FooterCta(),
    ).maxWidth(layout.maxWidth).margin('0 auto').padding(space.pageX),
  ).background(color.bg).color(color.text)
   .fontFamily(font.family)
   .margin('0').padding('0'),
);

root.addChild(page);

// ── Export ──
const htmlContent = root.render();
const cssContent = root.collectCssStyleString();
const jsContent = root.renderJs();

const exporter = new FileExporter({ includeResetCss: true });
exporter.export(htmlContent, cssContent, jsContent, './lp/output');

console.log('✓ LP generated → lp/output/');
