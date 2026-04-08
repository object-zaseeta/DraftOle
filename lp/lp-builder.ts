import {
  Root, PairType, TextType, Text,
  html, head, body, title, meta,
  div, h1, p, a, section,
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

// ── Body dark theme ──
bodyEl.css.styleManager.style.backgroundColor.setBackgroundColor('#0a0a0a');
bodyEl.css.styleManager.style.font.setColor('#ffffff');
bodyEl.css.styleManager.style.font.setFontFamily("'Inter', 'Noto Sans JP', sans-serif");
bodyEl.css.styleManager.style.spacing.setMargin('0');
bodyEl.css.styleManager.style.spacing.setPadding('0');

// ── Wrapper (1200px centered) ──
const wrapper = div();
wrapper.css.styleManager.style.position.setMaxWidth('1200px');
wrapper.css.styleManager.style.spacing.setMargin('0 auto');
wrapper.css.styleManager.style.spacing.setPadding('0 24px');

// ── Hero Section ──
const heroSection = section();
heroSection.css.styleManager.style.spacing.setPadding('120px 0 80px');
heroSection.css.styleManager.style.text.setTextAlign('center');

const heroTitle = h1(Text('HTML, CSS, JS — TypeScript ひとつで。'));
heroTitle.css.styleManager.style.font.setFontSize('48px');
heroTitle.css.styleManager.style.font.setFontWeight('700');
heroTitle.css.styleManager.style.font.setColor('#ffffff');
heroTitle.css.styleManager.style.spacing.setMarginBottom('24px');

const heroSub = p(Text('型安全なDSLでWebページを丸ごと生成'));
heroSub.css.styleManager.style.font.setFontSize('20px');
heroSub.css.styleManager.style.font.setColor('#a0a0a0');
heroSub.css.styleManager.style.spacing.setMarginBottom('40px');

const heroCta = a({ href: '#' }, Text('Get Started'));
heroCta.css.styleManager.style.position.setDisplay('inline-block');
heroCta.css.styleManager.style.spacing.setPadding('16px 40px');
heroCta.css.styleManager.style.backgroundColor.setBackgroundColor('#3b82f6');
heroCta.css.styleManager.style.font.setColor('#ffffff');
heroCta.css.styleManager.style.font.setFontSize('18px');
heroCta.css.styleManager.style.font.setFontWeight('600');
heroCta.css.styleManager.style.border.setBorderRadius('8px');
heroCta.css.styleManager.style.text.setTextDecoration('none');

heroSection.addChildren([heroTitle, heroSub, heroCta]);
wrapper.addChild(heroSection);
bodyEl.addChild(wrapper);

htmlEl.addChildren([headEl, bodyEl]);
root.addChild(htmlEl);

// ── Export ──
const htmlContent = root.render();
const cssContent = root.collectCssStyleString();
const jsContent = root.renderJs();

const exporter = new FileExporter({ includeResetCss: true });
exporter.export(htmlContent, cssContent, jsContent, './lp/output');

console.log('✓ LP generated → lp/output/');
