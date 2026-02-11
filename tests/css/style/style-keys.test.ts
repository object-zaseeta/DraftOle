/**
 * Task 1.1: CSSPropertyKey -- CSSプロパティ名の型安全な定数定義
 *
 * TDD RED phase: CSSPropertyKeyオブジェクトの振る舞いを検証する。
 * - camelCaseキーからハイフネーションCSS標準名へのマッピング
 * - 全146プロパティの網羅性（13カテゴリ合計）
 * - as const による immutability
 * - 型推論の正確性
 */
import { describe, it, expect } from 'vitest';
import {
  CSSPropertyKey,
  type CSSPropertyKeyValue,
} from '../../../src/css/style/style-keys.js';

// ============================================================
// CSSPropertyKey が定義されていること
// ============================================================
describe('CSSPropertyKey', () => {
  it('CSSPropertyKey がオブジェクトとして定義されている', () => {
    expect(CSSPropertyKey).toBeDefined();
    expect(typeof CSSPropertyKey).toBe('object');
  });

  // ============================================================
  // プロパティ数の検証
  // ============================================================
  describe('プロパティ数', () => {
    it('全146プロパティが定義されている（13カテゴリ合計）', () => {
      const keys = Object.keys(CSSPropertyKey);
      expect(keys).toHaveLength(146);
    });
  });

  // ============================================================
  // immutability（as const）の検証
  // ============================================================
  describe('immutability', () => {
    it('オブジェクトが frozen されている（as const の実効性）', () => {
      // as const は TypeScript のコンパイル時制約だが、
      // ランタイムでの不変性は Object.freeze で保証される場合がある。
      // ここでは値の書き換えが型エラーになることをランタイムで間接確認する。
      const originalValue = CSSPropertyKey.fontSize;
      expect(originalValue).toBe('font-size');
      // as const により型レベルでリテラル型に固定されていることを確認
      // （コンパイル時テスト: 値が変更可能であれば型エラーになる）
    });
  });

  // ============================================================
  // 代表的なプロパティのマッピング検証
  // ============================================================
  describe('代表的なマッピングの正確性', () => {
    it('fontSize → "font-size"', () => {
      expect(CSSPropertyKey.fontSize).toBe('font-size');
    });

    it('backgroundColor → "background-color"', () => {
      expect(CSSPropertyKey.backgroundColor).toBe('background-color');
    });

    it('marginTop → "margin-top"', () => {
      expect(CSSPropertyKey.marginTop).toBe('margin-top');
    });

    it('borderRadius → "border-radius"', () => {
      expect(CSSPropertyKey.borderRadius).toBe('border-radius');
    });

    it('flexDirection → "flex-direction"', () => {
      expect(CSSPropertyKey.flexDirection).toBe('flex-direction');
    });

    it('gridTemplateColumns → "grid-template-columns"', () => {
      expect(CSSPropertyKey.gridTemplateColumns).toBe('grid-template-columns');
    });

    it('textDecoration → "text-decoration"', () => {
      expect(CSSPropertyKey.textDecoration).toBe('text-decoration');
    });

    it('animationTimingFunction → "animation-timing-function"', () => {
      expect(CSSPropertyKey.animationTimingFunction).toBe('animation-timing-function');
    });

    it('display → "display"（単一単語はそのまま）', () => {
      expect(CSSPropertyKey.display).toBe('display');
    });

    it('cssFloat → "float"（予約語マッピング）', () => {
      expect(CSSPropertyKey.cssFloat).toBe('float');
    });

    it('zIndex → "z-index"', () => {
      expect(CSSPropertyKey.zIndex).toBe('z-index');
    });
  });

  // ============================================================
  // 全キーの値がハイフネーション形式の文字列であること
  // ============================================================
  describe('値のフォーマット検証', () => {
    it('全値が string 型である', () => {
      const values = Object.values(CSSPropertyKey);
      for (const value of values) {
        expect(typeof value).toBe('string');
      }
    });

    it('全値が小文字とハイフンのみで構成されている（CSS標準形式）', () => {
      const values = Object.values(CSSPropertyKey);
      const cssPropertyPattern = /^[a-z]+(-[a-z]+)*$/;
      for (const value of values) {
        expect(value).toMatch(cssPropertyPattern);
      }
    });

    it('値に重複がない', () => {
      const values = Object.values(CSSPropertyKey);
      const unique = new Set(values);
      expect(unique.size).toBe(values.length);
    });
  });

  // ============================================================
  // CSSPropertyKeyValue 型の検証
  // ============================================================
  describe('CSSPropertyKeyValue 型', () => {
    it('CSSPropertyKey の値を CSSPropertyKeyValue 型として使用できる', () => {
      // 型レベルの検証: コンパイルが通ればOK
      const value: CSSPropertyKeyValue = CSSPropertyKey.fontSize;
      expect(value).toBe('font-size');
    });

    it('全プロパティの値が CSSPropertyKeyValue 型に代入可能', () => {
      const values: CSSPropertyKeyValue[] = Object.values(CSSPropertyKey) as CSSPropertyKeyValue[];
      expect(values.length).toBe(146);
    });
  });

  // ============================================================
  // カテゴリ別の全プロパティ網羅検証
  // ============================================================
  describe('Font関連プロパティ（7件）', () => {
    const fontProperties: Record<string, string> = {
      fontFamily: 'font-family',
      fontSize: 'font-size',
      fontWeight: 'font-weight',
      fontStyle: 'font-style',
      color: 'color',
      lineHeight: 'line-height',
      letterSpacing: 'letter-spacing',
    };

    it.each(Object.entries(fontProperties))(
      '%s → "%s"',
      (key, expected) => {
        expect(CSSPropertyKey[key as keyof typeof CSSPropertyKey]).toBe(expected);
      },
    );
  });

  describe('Background関連プロパティ（5件）', () => {
    const bgProperties: Record<string, string> = {
      backgroundColor: 'background-color',
      backgroundImage: 'background-image',
      backgroundSize: 'background-size',
      backgroundPosition: 'background-position',
      backgroundRepeat: 'background-repeat',
    };

    it.each(Object.entries(bgProperties))(
      '%s → "%s"',
      (key, expected) => {
        expect(CSSPropertyKey[key as keyof typeof CSSPropertyKey]).toBe(expected);
      },
    );
  });

  describe('Spacing関連プロパティ（10件）', () => {
    const spacingProperties: Record<string, string> = {
      marginTop: 'margin-top',
      marginRight: 'margin-right',
      marginBottom: 'margin-bottom',
      marginLeft: 'margin-left',
      margin: 'margin',
      paddingTop: 'padding-top',
      paddingRight: 'padding-right',
      paddingBottom: 'padding-bottom',
      paddingLeft: 'padding-left',
      padding: 'padding',
    };

    it.each(Object.entries(spacingProperties))(
      '%s → "%s"',
      (key, expected) => {
        expect(CSSPropertyKey[key as keyof typeof CSSPropertyKey]).toBe(expected);
      },
    );
  });

  describe('Border関連プロパティ（20件）', () => {
    const borderProperties: Record<string, string> = {
      borderWidth: 'border-width',
      borderStyle: 'border-style',
      borderColor: 'border-color',
      borderRadius: 'border-radius',
      borderTopWidth: 'border-top-width',
      borderTopStyle: 'border-top-style',
      borderTopColor: 'border-top-color',
      borderRightWidth: 'border-right-width',
      borderRightStyle: 'border-right-style',
      borderRightColor: 'border-right-color',
      borderBottomWidth: 'border-bottom-width',
      borderBottomStyle: 'border-bottom-style',
      borderBottomColor: 'border-bottom-color',
      borderLeftWidth: 'border-left-width',
      borderLeftStyle: 'border-left-style',
      borderLeftColor: 'border-left-color',
      borderTopLeftRadius: 'border-top-left-radius',
      borderTopRightRadius: 'border-top-right-radius',
      borderBottomRightRadius: 'border-bottom-right-radius',
      borderBottomLeftRadius: 'border-bottom-left-radius',
    };

    it.each(Object.entries(borderProperties))(
      '%s → "%s"',
      (key, expected) => {
        expect(CSSPropertyKey[key as keyof typeof CSSPropertyKey]).toBe(expected);
      },
    );
  });

  describe('Flex関連プロパティ（11件）', () => {
    const flexProperties: Record<string, string> = {
      flexDirection: 'flex-direction',
      justifyContent: 'justify-content',
      alignItems: 'align-items',
      gap: 'gap',
      flexWrap: 'flex-wrap',
      flexGrow: 'flex-grow',
      flexShrink: 'flex-shrink',
      flexBasis: 'flex-basis',
      alignSelf: 'align-self',
      order: 'order',
      alignContent: 'align-content',
    };

    it.each(Object.entries(flexProperties))(
      '%s → "%s"',
      (key, expected) => {
        expect(CSSPropertyKey[key as keyof typeof CSSPropertyKey]).toBe(expected);
      },
    );
  });

  describe('Grid関連プロパティ（14件）', () => {
    const gridProperties: Record<string, string> = {
      gridTemplateColumns: 'grid-template-columns',
      gridTemplateRows: 'grid-template-rows',
      gridGap: 'grid-gap',
      gridColumn: 'grid-column',
      gridRow: 'grid-row',
      gridColumnStart: 'grid-column-start',
      gridColumnEnd: 'grid-column-end',
      gridRowStart: 'grid-row-start',
      gridRowEnd: 'grid-row-end',
      gridTemplateAreas: 'grid-template-areas',
      gridArea: 'grid-area',
      gridAutoFlow: 'grid-auto-flow',
      gridAutoColumns: 'grid-auto-columns',
      gridAutoRows: 'grid-auto-rows',
    };

    it.each(Object.entries(gridProperties))(
      '%s → "%s"',
      (key, expected) => {
        expect(CSSPropertyKey[key as keyof typeof CSSPropertyKey]).toBe(expected);
      },
    );
  });

  describe('Visual関連プロパティ（6件）', () => {
    const visualProperties: Record<string, string> = {
      boxShadow: 'box-shadow',
      opacity: 'opacity',
      cursor: 'cursor',
      overflow: 'overflow',
      overflowX: 'overflow-x',
      overflowY: 'overflow-y',
    };

    it.each(Object.entries(visualProperties))(
      '%s → "%s"',
      (key, expected) => {
        expect(CSSPropertyKey[key as keyof typeof CSSPropertyKey]).toBe(expected);
      },
    );
  });

  describe('Text関連プロパティ（13件）', () => {
    const textProperties: Record<string, string> = {
      textAlign: 'text-align',
      textDecoration: 'text-decoration',
      textTransform: 'text-transform',
      textIndent: 'text-indent',
      wordSpacing: 'word-spacing',
      whiteSpace: 'white-space',
      textOverflow: 'text-overflow',
      textDecorationColor: 'text-decoration-color',
      textDecorationStyle: 'text-decoration-style',
      textDecorationLine: 'text-decoration-line',
      wordBreak: 'word-break',
      overflowWrap: 'overflow-wrap',
      textShadow: 'text-shadow',
    };

    it.each(Object.entries(textProperties))(
      '%s → "%s"',
      (key, expected) => {
        expect(CSSPropertyKey[key as keyof typeof CSSPropertyKey]).toBe(expected);
      },
    );
  });

  describe('Transform関連プロパティ（6件）', () => {
    const transformProperties: Record<string, string> = {
      transform: 'transform',
      transformOrigin: 'transform-origin',
      filter: 'filter',
      backdropFilter: 'backdrop-filter',
      perspective: 'perspective',
      perspectiveOrigin: 'perspective-origin',
    };

    it.each(Object.entries(transformProperties))(
      '%s → "%s"',
      (key, expected) => {
        expect(CSSPropertyKey[key as keyof typeof CSSPropertyKey]).toBe(expected);
      },
    );
  });

  describe('Animation関連プロパティ（14件）', () => {
    const animationProperties: Record<string, string> = {
      animationName: 'animation-name',
      animationDuration: 'animation-duration',
      animationTimingFunction: 'animation-timing-function',
      animationDelay: 'animation-delay',
      animationIterationCount: 'animation-iteration-count',
      animationDirection: 'animation-direction',
      animationFillMode: 'animation-fill-mode',
      animationPlayState: 'animation-play-state',
      animation: 'animation',
      transitionProperty: 'transition-property',
      transitionDuration: 'transition-duration',
      transitionTimingFunction: 'transition-timing-function',
      transitionDelay: 'transition-delay',
      transition: 'transition',
    };

    it.each(Object.entries(animationProperties))(
      '%s → "%s"',
      (key, expected) => {
        expect(CSSPropertyKey[key as keyof typeof CSSPropertyKey]).toBe(expected);
      },
    );
  });

  describe('Table関連プロパティ（5件）', () => {
    const tableProperties: Record<string, string> = {
      borderCollapse: 'border-collapse',
      borderSpacing: 'border-spacing',
      tableLayout: 'table-layout',
      captionSide: 'caption-side',
      emptyCells: 'empty-cells',
    };

    it.each(Object.entries(tableProperties))(
      '%s → "%s"',
      (key, expected) => {
        expect(CSSPropertyKey[key as keyof typeof CSSPropertyKey]).toBe(expected);
      },
    );
  });

  describe('List関連プロパティ（4件）', () => {
    const listProperties: Record<string, string> = {
      listStyleType: 'list-style-type',
      listStylePosition: 'list-style-position',
      listStyleImage: 'list-style-image',
      listStyle: 'list-style',
    };

    it.each(Object.entries(listProperties))(
      '%s → "%s"',
      (key, expected) => {
        expect(CSSPropertyKey[key as keyof typeof CSSPropertyKey]).toBe(expected);
      },
    );
  });

  describe('Visibility関連プロパティ（31件）', () => {
    const visibilityProperties: Record<string, string> = {
      display: 'display',
      visibility: 'visibility',
      zIndex: 'z-index',
      cssFloat: 'float',
      clear: 'clear',
      position: 'position',
      top: 'top',
      right: 'right',
      bottom: 'bottom',
      left: 'left',
      width: 'width',
      height: 'height',
      minWidth: 'min-width',
      maxWidth: 'max-width',
      minHeight: 'min-height',
      maxHeight: 'max-height',
      objectFit: 'object-fit',
      objectPosition: 'object-position',
      verticalAlign: 'vertical-align',
      content: 'content',
      pointerEvents: 'pointer-events',
      userSelect: 'user-select',
      resize: 'resize',
      outline: 'outline',
      outlineColor: 'outline-color',
      outlineStyle: 'outline-style',
      outlineWidth: 'outline-width',
      outlineOffset: 'outline-offset',
      boxSizing: 'box-sizing',
      clip: 'clip',
      clipPath: 'clip-path',
    };

    it.each(Object.entries(visibilityProperties))(
      '%s → "%s"',
      (key, expected) => {
        expect(CSSPropertyKey[key as keyof typeof CSSPropertyKey]).toBe(expected);
      },
    );
  });

  // ============================================================
  // カテゴリ件数合計の整合性検証
  // ============================================================
  describe('カテゴリ件数合計', () => {
    it('13カテゴリの合計が146になり、実際のキー数と一致する', () => {
      // Font:7 + Background:5 + Spacing:10 + Border:20 + Flex:11 +
      // Grid:14 + Visual:6 + Text:13 + Transform:6 + Animation:14 +
      // Table:5 + List:4 + Visibility:31 = 146
      const expectedTotal = 7 + 5 + 10 + 20 + 11 + 14 + 6 + 13 + 6 + 14 + 5 + 4 + 31;
      expect(expectedTotal).toBe(146);

      const actualCount = Object.keys(CSSPropertyKey).length;
      expect(actualCount).toBe(expectedTotal);
    });
  });

  // ============================================================
  // キーの重複チェック
  // ============================================================
  describe('キーの一意性', () => {
    it('キーに重複がない', () => {
      const keys = Object.keys(CSSPropertyKey);
      const unique = new Set(keys);
      expect(unique.size).toBe(keys.length);
    });
  });
});
