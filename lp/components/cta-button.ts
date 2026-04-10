import { a } from '../../dist/index.js';
import { color, font, space, radius } from '../tokens.ts';

export const CtaButton = (label: string) =>
  a({ href: '#' }, label)
    .display('inline-block').padding(space.button)
    .background(color.accent).color(color.text)
    .fontSize(font.cta).fontWeight(font.semibold)
    .cornerRadius(radius.button).textDecoration('none');
