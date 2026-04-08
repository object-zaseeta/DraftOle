import {
  Root, PairType, TextType, Text, HtmlTag, HtmlAttribute,
  html, head, body, title, meta,
  div, h1, h2, p, a, section,
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

// ── Features Section ──
const featuresSection = sid(section(), 'features');
featuresSection.css.styleManager.style.spacing.setPadding('80px 0');

const featuresTitle = sid(h2(Text('なぜ DraftOle？')), 'features-title');
featuresTitle.css.styleManager.style.font.setFontSize('32px');
featuresTitle.css.styleManager.style.font.setFontWeight('700');
featuresTitle.css.styleManager.style.font.setColor('#ffffff');
featuresTitle.css.styleManager.style.text.setTextAlign('center');
featuresTitle.css.styleManager.style.spacing.setMarginBottom('48px');

const featuresRow = sid(div(), 'features-row');
featuresRow.css.styleManager.style.position.setDisplay('flex');
featuresRow.css.styleManager.style.flex.setGap('32px');

// Feature 1: 三位一体
const feature1 = sid(div(), 'f1');
feature1.css.styleManager.style.flex.setFlexGrow('1');
feature1.css.styleManager.style.spacing.setPadding('32px');
feature1.css.styleManager.style.backgroundColor.setBackgroundColor('#1a1a1a');
feature1.css.styleManager.style.border.setBorderRadius('12px');

const f1Title = sid(h2(Text('三位一体')), 'f1-title');
f1Title.css.styleManager.style.font.setFontSize('24px');
f1Title.css.styleManager.style.font.setFontWeight('600');
f1Title.css.styleManager.style.font.setColor('#ffffff');
f1Title.css.styleManager.style.spacing.setMarginBottom('12px');

const f1Desc = sid(p(Text('HTML・CSS・JSを1つのTypeScriptファイルで記述。もう3ファイルを行き来する必要はありません。')), 'f1-desc');
f1Desc.css.styleManager.style.font.setColor('#a0a0a0');
f1Desc.css.styleManager.style.font.setLineHeight('1.6');

feature1.addChildren([f1Title, f1Desc]);

// Feature 2: 型安全
const feature2 = sid(div(), 'f2');
feature2.css.styleManager.style.flex.setFlexGrow('1');
feature2.css.styleManager.style.spacing.setPadding('32px');
feature2.css.styleManager.style.backgroundColor.setBackgroundColor('#1a1a1a');
feature2.css.styleManager.style.border.setBorderRadius('12px');

const f2Title = sid(h2(Text('型安全')), 'f2-title');
f2Title.css.styleManager.style.font.setFontSize('24px');
f2Title.css.styleManager.style.font.setFontWeight('600');
f2Title.css.styleManager.style.font.setColor('#ffffff');
f2Title.css.styleManager.style.spacing.setMarginBottom('12px');

const f2Desc = sid(p(Text('146以上のCSSプロパティすべてに型補完が効きます。タイポや無効な値をコンパイル時にキャッチ。')), 'f2-desc');
f2Desc.css.styleManager.style.font.setColor('#a0a0a0');
f2Desc.css.styleManager.style.font.setLineHeight('1.6');

feature2.addChildren([f2Title, f2Desc]);

// Feature 3: ゼロランタイム
const feature3 = sid(div(), 'f3');
feature3.css.styleManager.style.flex.setFlexGrow('1');
feature3.css.styleManager.style.spacing.setPadding('32px');
feature3.css.styleManager.style.backgroundColor.setBackgroundColor('#1a1a1a');
feature3.css.styleManager.style.border.setBorderRadius('12px');

const f3Title = sid(h2(Text('ゼロランタイム')), 'f3-title');
f3Title.css.styleManager.style.font.setFontSize('24px');
f3Title.css.styleManager.style.font.setFontWeight('600');
f3Title.css.styleManager.style.font.setColor('#ffffff');
f3Title.css.styleManager.style.spacing.setMarginBottom('12px');

const f3Desc = sid(p(Text('出力は純粋なHTML/CSS/JS。ランタイム依存なし。どこにでもデプロイできます。')), 'f3-desc');
f3Desc.css.styleManager.style.font.setColor('#a0a0a0');
f3Desc.css.styleManager.style.font.setLineHeight('1.6');

feature3.addChildren([f3Title, f3Desc]);

featuresRow.addChildren([feature1, feature2, feature3]);
featuresSection.addChildren([featuresTitle, featuresRow]);
wrapper.addChild(featuresSection);

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
