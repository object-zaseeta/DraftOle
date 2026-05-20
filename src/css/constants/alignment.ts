/**
 * Alignment 定数と型定義
 *
 * SwiftUI の Alignment に対応する CSS 値の定数を提供する。
 */

export const Alignment = {
  center:   'center',
  leading:  'flex-start',
  trailing: 'flex-end',
  top:      'flex-start',
  bottom:   'flex-end',
} as const;

export type AlignmentValue = typeof Alignment[keyof typeof Alignment];

export const ZStackAlignment = {
  center:        { alignItems: 'center',     justifyContent: 'center'     },
  topLeading:    { alignItems: 'flex-start', justifyContent: 'flex-start' },
  topTrailing:   { alignItems: 'flex-start', justifyContent: 'flex-end'   },
  bottomLeading: { alignItems: 'flex-end',   justifyContent: 'flex-start' },
  bottomTrailing:{ alignItems: 'flex-end',   justifyContent: 'flex-end'   },
  top:           { alignItems: 'flex-start', justifyContent: 'center'     },
  bottom:        { alignItems: 'flex-end',   justifyContent: 'center'     },
  leading:       { alignItems: 'center',     justifyContent: 'flex-start' },
  trailing:      { alignItems: 'center',     justifyContent: 'flex-end'   },
} as const;

export type ZStackAlignmentKey = keyof typeof ZStackAlignment;
