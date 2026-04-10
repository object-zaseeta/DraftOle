import { p, footer } from '../../dist/index.js';
import { color, font, space } from '../tokens.ts';
import { CtaButton } from './cta-button.ts';

export const FooterCta = () =>
  footer(
    p('TypeScript ひとつで、Webを作ろう。')
      .fontSize(font.subheading).color(color.text).margin('0 0 32px 0'),
    CtaButton('Get Started'),
    p('© 2026 DraftOle')
      .fontSize(font.small).color(color.subtle).margin('48px 0 0 0'),
  ).padding(space.footerY).textAlign('center');
