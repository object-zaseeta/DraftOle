export const Breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type BreakpointKey = keyof typeof Breakpoints;

export interface BreakpointStyles {
  sm?: Partial<CSSStyleDeclaration>;
  md?: Partial<CSSStyleDeclaration>;
  lg?: Partial<CSSStyleDeclaration>;
  xl?: Partial<CSSStyleDeclaration>;
  [customPx: number]: Partial<CSSStyleDeclaration> | undefined;
}
