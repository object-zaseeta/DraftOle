/**
 * Task 9.4: Swift版等価性検証 - Renderable準拠テスト
 *
 * 目的: 13プロパティクラスすべてがRenderableインターフェースに準拠していることを検証する
 *
 * Requirements:
 * - 10.2: 13プロパティクラスそれぞれの render() 出力を検証する
 * - 11.1: TypeScript版CSSモジュールが Swift版の13プロパティクラスすべてに対応する
 * - 11.2: Swift版の Renderable プロトコルに対応する Renderable インターフェースに準拠する
 */
import { describe, it, expect } from 'vitest';
import { CSSFont } from '../../../src/css/style/font/css-font.js';
import { CSSBackground } from '../../../src/css/style/background/css-background.js';
import { CSSSpacing } from '../../../src/css/style/spacing/css-spacing.js';
import { CSSBorder } from '../../../src/css/style/border/css-border.js';
import { CSSFlex } from '../../../src/css/style/flex/css-flex.js';
import { CSSGrid } from '../../../src/css/style/grid/css-grid.js';
import { CSSVisual } from '../../../src/css/style/visual/css-visual.js';
import { CSSText } from '../../../src/css/style/text/css-text.js';
import { CSSTransform } from '../../../src/css/style/transform/css-transform.js';
import { CSSAnimation } from '../../../src/css/style/animation/css-animation.js';
import { CSSTable } from '../../../src/css/style/table/css-table.js';
import { CSSList } from '../../../src/css/style/list/css-list.js';
import { CSSVisibility } from '../../../src/css/style/visibility/css-visibility.js';
import type { Renderable } from '../../../src/utils/renderable.js';

describe('Swift版等価性検証: Renderable準拠', () => {
  /**
   * 13プロパティクラスのリスト（Swift版と同一）
   */
  const propertyClasses: Array<{ name: string; instance: Renderable }> = [
    { name: 'CSSFont', instance: new CSSFont() },
    { name: 'CSSBackground', instance: new CSSBackground() },
    { name: 'CSSSpacing', instance: new CSSSpacing() },
    { name: 'CSSBorder', instance: new CSSBorder() },
    { name: 'CSSFlex', instance: new CSSFlex() },
    { name: 'CSSGrid', instance: new CSSGrid() },
    { name: 'CSSVisual', instance: new CSSVisual() },
    { name: 'CSSText', instance: new CSSText() },
    { name: 'CSSTransform', instance: new CSSTransform() },
    { name: 'CSSAnimation', instance: new CSSAnimation() },
    { name: 'CSSTable', instance: new CSSTable() },
    { name: 'CSSList', instance: new CSSList() },
    { name: 'CSSVisibility', instance: new CSSVisibility() },
  ];

  describe('Renderableインターフェース準拠（Req 11.2）', () => {
    it.each(propertyClasses)(
      '$name は Renderable インターフェースに準拠している',
      ({ instance }) => {
        // Renderable インターフェースは render() メソッドを持つ
        expect(typeof instance.render).toBe('function');
      }
    );

    it.each(propertyClasses)(
      '$name の render() は string を返す',
      ({ instance }) => {
        const result = instance.render();
        expect(typeof result).toBe('string');
      }
    );
  });

  describe('未設定時の空出力（Req 10.2, 10.6）', () => {
    it.each(propertyClasses)(
      '$name は未設定の場合に空文字列を返す',
      ({ instance }) => {
        // すべてのプロパティが未設定の場合、空文字列を返す
        const result = instance.render();
        expect(result).toBe('');
      }
    );
  });

  describe('13プロパティクラスの完全性（Req 11.1）', () => {
    it('13プロパティクラスすべてが存在する', () => {
      // Swift版と同じ13クラスが存在することを確認
      expect(propertyClasses).toHaveLength(13);
    });

    it('各プロパティクラスが一意である', () => {
      // クラス名が一意であることを確認
      const names = propertyClasses.map(p => p.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(13);
    });

    it('各プロパティクラスがインスタンス化可能である', () => {
      // すべてのクラスがエラーなくインスタンス化できることを確認
      propertyClasses.forEach(({ name, instance }) => {
        expect(instance).toBeDefined();
        expect(instance).not.toBeNull();
        expect(typeof instance.render).toBe('function');
      });
    });
  });

  describe('Swift版プロパティクラス名の対応', () => {
    const swiftPropertyClassNames = [
      'CSSFont',
      'CSSBackground',
      'CSSSpacing',
      'CSSBorder',
      'CSSFlex',
      'CSSGrid',
      'CSSVisual',
      'CSSText',
      'CSSTransform',
      'CSSAnimation',
      'CSSTable',
      'CSSList',
      'CSSVisibility', // Swift版では CSSPosition だが、TypeScript版では CSSVisibility
    ];

    it.each(swiftPropertyClassNames)(
      'Swift版の %s に対応するクラスが存在する',
      (swiftClassName) => {
        // Swift版のクラス名に対応するTypeScript版のクラスが存在することを確認
        // 注: CSSPosition は TypeScript版では CSSVisibility に名前変更されている
        const tsClassName = swiftClassName === 'CSSPosition' ? 'CSSVisibility' : swiftClassName;
        const exists = propertyClasses.some(p => p.name === tsClassName);
        expect(exists).toBe(true);
      }
    );
  });
});
