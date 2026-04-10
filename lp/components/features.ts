import { div, h2, p, section } from '../../dist/index.js';
import { color, font, space, radius } from '../tokens.ts';

const FeatureCard = (title: string, description: string) =>
  div(
    h2(title).fontSize(font.subheading).fontWeight(font.semibold).color(color.text).margin('0 0 12px 0'),
    p(description).color(color.muted).lineHeight('1.6'),
  ).flexGrow('1').padding(space.card).background(color.surface).cornerRadius(radius.card);

export const Features = () =>
  section(
    h2('なぜ DraftOle？')
      .fontSize(font.heading).fontWeight(font.bold).color(color.text)
      .textAlign('center').margin('0 0 48px 0'),
    div(
      FeatureCard('三位一体', 'HTML・CSS・JSを1つのTypeScriptファイルで記述。もう3ファイルを行き来する必要はありません。'),
      FeatureCard('型安全', '146以上のCSSプロパティすべてに型補完が効きます。タイポや無効な値をコンパイル時にキャッチ。'),
      FeatureCard('ゼロランタイム', '出力は純粋なHTML/CSS/JS。ランタイム依存なし。どこにでもデプロイできます。'),
    ).display('flex').gap(space.gapL),
  ).padding(space.section);
