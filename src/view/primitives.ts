import { a, button, h1, h2, h3, h4, h5, h6, img, p, section } from '../html/tags/index.js';
import { hstack, spacer, vstack } from '../html/layout/layout-factories.js';
import type { ButtonOptions, HeadingLevel, LinkOptions, View } from './types.js';
import type { StackOptions, SpacerOptions } from '../html/layout/layout-types.js';
import type { PairType } from '../html/elements/pair-type.js';
import type { SelfClosingType } from '../html/elements/self-closing-type.js';
import type { LayoutChild } from '../html/layout/layout-types.js';

export function VStack(options?: StackOptions, ...children: View[]): PairType {
  if (options !== undefined) {
    return vstack(options, ...(children as LayoutChild[]));
  }
  const [first, ...rest] = children as LayoutChild[];
  return first !== undefined ? vstack(first, ...rest) : vstack();
}

export function HStack(options?: StackOptions, ...children: View[]): PairType {
  if (options !== undefined) {
    return hstack(options, ...(children as LayoutChild[]));
  }
  const [first, ...rest] = children as LayoutChild[];
  return first !== undefined ? hstack(first, ...rest) : hstack();
}

export function Text(content: string): PairType {
  return p(content);
}

export function Image(src: string, alt: string): SelfClosingType {
  return img({ src, alt });
}

export function Section(...children: View[]): PairType {
  return section(...children);
}

export function Spacer(options?: SpacerOptions): PairType {
  return spacer(options);
}

export function Heading(level: HeadingLevel, content: string): PairType {
  switch (level) {
    case 1: return h1(content);
    case 2: return h2(content);
    case 3: return h3(content);
    case 4: return h4(content);
    case 5: return h5(content);
    case 6: return h6(content);
    default: throw new Error(`invalid heading level: ${level}`);
  }
}

export function Link(options: LinkOptions, ...children: View[]): PairType {
  const attrs: Record<string, string> = { href: options.href };
  if (options.target !== undefined) {
    attrs.target = options.target;
  }
  if (options.rel !== undefined) {
    attrs.rel = options.rel;
  } else if (options.target === '_blank') {
    attrs.rel = 'noopener noreferrer';
  }
  return a(attrs, ...children);
}

export function Button(options: ButtonOptions | undefined, ...children: View[]): PairType {
  const type = options?.type ?? 'button';
  return button({ type }, ...children);
}
