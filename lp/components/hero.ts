import { h1, p, section } from '../../dist/index.js';
import { color, font, space } from '../tokens.ts';
import { CtaButton } from './cta-button.ts';

export const Hero = () =>
  section(
    h1('HTML, CSS, JS — TypeScript ひとつで。')
      .fontSize(font.hero).fontWeight(font.bold).color(color.text)
      .margin('0 0 24px 0'),
    p('型安全なDSLでWebページを丸ごと生成')
      .fontSize(font.body).color(color.muted)
      .margin('0 0 40px 0'),
    CtaButton({ label: 'Get Started' }),
  ).padding(space.heroY).textAlign('center');
