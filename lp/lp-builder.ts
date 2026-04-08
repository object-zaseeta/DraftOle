import {
  Root, PairType, TextType, Text, HtmlTag, HtmlAttribute,
  html, head, body, title, meta,
  div, h1, p, a, section,
  FileExporter,
} from '../dist/index.js';

// ── Workaround: スコープCSS非対応のため、ID属性ベースでCSS出力 ──
// 問題1: HtmlTag.collectCssStyleString() が子に再帰しない
// 問題2: スコープクラスがHTMLのclass属性に自動付与されない
// 回避策: 各要素にIDを振り、#id { ... } 形式でCSSを手動収集
type StyledTag = InstanceType<typeof HtmlTag>;
const styledElements: Array<{ id: string; tag: StyledTag }> = [];

function sid<T extends StyledTag>(tag: T, id: string): T {
  tag.addHtmlAttribute(HtmlAttribute.keyValue('id', id));
  styledElements.push({ id, tag });
  return tag;
}

function collectIdCss(): string {
  return styledElements
    .map(({ id, tag }) => {
      const css = tag.css.render();
      return css ? `#${id} {\n${css}\n}` : '';
    })
    .filter(s => s.length > 0)
    .join('\n\n');
}

// ── Document ──
const root = new Root();
const htmlEl = html({ lang: 'ja' });
const headEl = head(
  meta({ charset: 'utf-8' }),
  meta({ name: 'viewport', content: 'width=device-width, initial-scale=1.0' }),
  title('DraftOle — TypeScript DSL for Web'),
);
const bodyEl = sid(body(), 'body');

// ── Body dark theme ──
bodyEl.css.styleManager.style.backgroundColor.setBackgroundColor('#0a0a0a');
bodyEl.css.styleManager.style.font.setColor('#ffffff');
bodyEl.css.styleManager.style.font.setFontFamily("'Inter', 'Noto Sans JP', sans-serif");
bodyEl.css.styleManager.style.spacing.setMargin('0');
bodyEl.css.styleManager.style.spacing.setPadding('0');

// ── Wrapper (1200px centered) ──
const wrapper = sid(div(), 'wrapper');
wrapper.css.styleManager.style.position.setMaxWidth('1200px');
wrapper.css.styleManager.style.spacing.setMargin('0 auto');
wrapper.css.styleManager.style.spacing.setPadding('0 24px');

// ── Hero Section ──
const heroSection = sid(section(), 'hero');
heroSection.css.styleManager.style.spacing.setPadding('120px 0 80px');
heroSection.css.styleManager.style.text.setTextAlign('center');

const heroTitle = sid(h1(Text('HTML, CSS, JS — TypeScript ひとつで。')), 'hero-title');
heroTitle.css.styleManager.style.font.setFontSize('48px');
heroTitle.css.styleManager.style.font.setFontWeight('700');
heroTitle.css.styleManager.style.font.setColor('#ffffff');
heroTitle.css.styleManager.style.spacing.setMarginBottom('24px');

const heroSub = sid(p(Text('型安全なDSLでWebページを丸ごと生成')), 'hero-sub');
heroSub.css.styleManager.style.font.setFontSize('20px');
heroSub.css.styleManager.style.font.setColor('#a0a0a0');
heroSub.css.styleManager.style.spacing.setMarginBottom('40px');

const heroCta = sid(a({ href: '#' }, Text('Get Started')), 'hero-cta');
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
const cssContent = collectIdCss();
const jsContent = root.renderJs();

const exporter = new FileExporter({ includeResetCss: true });
exporter.export(htmlContent, cssContent, jsContent, './lp/output');

console.log('✓ LP generated → lp/output/');
