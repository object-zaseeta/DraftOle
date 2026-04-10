import { a } from '../../dist/index.js';
import { color, font, space, radius } from '../tokens.ts';

export interface CtaButtonProps {
  label: string;
  href?: string;
}

export const CtaButton = ({ label, href = '#' }: CtaButtonProps) =>
  a({ href }, label)
    .display('inline-block').padding(space.button)
    .background(color.accent).color(color.text)
    .fontSize(font.cta).fontWeight(font.semibold)
    .cornerRadius(radius.button).textDecoration('none');
