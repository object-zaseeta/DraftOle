import {
  Root, PairType, TextType,
  html, head, body, title, meta,
  FileExporter,
} from '../dist/index.js';

// ── Document ──
const root = new Root();
const htmlEl = html({ lang: 'ja' });
const headEl = head(
  meta({ charset: 'utf-8' }),
  meta({ name: 'viewport', content: 'width=device-width, initial-scale=1.0' }),
  title('DraftOle — TypeScript DSL for Web'),
);
const bodyEl = body();

htmlEl.addChildren([headEl, bodyEl]);
root.addChild(htmlEl);

// ── Export ──
const htmlContent = root.render();
const cssContent = root.collectCssStyleString();
const jsContent = root.renderJs();

const exporter = new FileExporter({ includeResetCss: true });
exporter.export(htmlContent, cssContent, jsContent, './lp/output');

console.log('✓ LP generated → lp/output/');
