// ── Design Tokens ──

export const color = {
  bg:         '#0a0a0a',
  surface:    '#1a1a1a',
  accent:     '#3b82f6',
  codeBg:     '#0d1b2a',
  text:       '#ffffff',
  muted:      '#a0a0a0',
  subtle:     '#666666',
  codeFg:     '#c0c0c0',
  codeAccent: '#7dd3fc',
} as const;

export const font = {
  family:     "'Inter', 'Noto Sans JP', sans-serif",
  mono:       "'Fira Code', monospace",
  hero:       '48px',
  heading:    '32px',
  subheading: '24px',
  body:       '20px',
  cta:        '18px',
  small:      '14px',
  bold:       '700',
  semibold:   '600',
} as const;

export const space = {
  section:  '80px 0',
  heroY:    '120px 0 80px',
  footerY:  '80px 0 40px',
  card:     '32px',
  block:    '24px',
  button:   '16px 40px',
  pageX:    '0 24px',
  gapL:     '32px',
  gapM:     '24px',
} as const;

export const radius = {
  card:   '12px',
  button: '8px',
} as const;

export const layout = {
  maxWidth: '1200px',
} as const;
