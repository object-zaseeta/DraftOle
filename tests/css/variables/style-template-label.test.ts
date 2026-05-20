/**
 * Task 1.3: __draftole_label__ ランタイムヘルパーのユニットテスト
 *
 * - StyleTemplate に対しては debugVarName を付与した frozen コピーを返し、
 *   元の StyleTemplate は変更されない（frozen のため）
 * - 非 StyleTemplate 値（プリミティブ、プレーンオブジェクト、null、undefined）は
 *   no-op で入力をそのまま返す
 * - 型シグネチャは `<T>(value: T, debugVarName: string): T` の identity であり、
 *   呼び出し側の型推論を変えない（コンパイル時 `tsc --noEmit` で検証）
 *
 * Requirements: 1.3 / Task 1.3
 */
import { describe, it, expect } from 'vitest';
import { __draftole_label__ } from '../../../src/css/variables/style-template-label.js';
import { createStyleTemplate } from '../../../src/css/variables/style-template.js';

describe('__draftole_label__', () => {
  it('StyleTemplate にラベルを付与した frozen コピーを返し、元は不変', () => {
    const tpl = createStyleTemplate({ properties: { display: 'flex' } });

    expect(tpl.debugVarName).toBeUndefined();

    const labeled = __draftole_label__(tpl, 'card');

    expect(labeled).not.toBe(tpl);
    expect(labeled.debugVarName).toBe('card');
    expect(labeled._kind).toBe('styleTemplate');
    expect(labeled.bodyHash).toBe(tpl.bodyHash);
    expect(labeled.properties).toEqual(tpl.properties);

    // 元の StyleTemplate は変更されない
    expect(tpl.debugVarName).toBeUndefined();
  });

  it('非 StyleTemplate なオブジェクトはそのまま返す（参照同一）', () => {
    const plain = { foo: 1 };
    const result = __draftole_label__(plain, 'whatever');
    expect(result).toBe(plain);
  });

  it('_kind だけ持つが bodyHash がないオブジェクトは no-op として返す', () => {
    const fakeish = { _kind: 'styleTemplate' as const };
    const result = __draftole_label__(fakeish, 'x');
    expect(result).toBe(fakeish);
  });

  it('プリミティブ（string / number）は入力をそのまま返す', () => {
    expect(__draftole_label__('hello', 'name')).toBe('hello');
    expect(__draftole_label__(42, 'name')).toBe(42);
  });

  it('null / undefined は入力をそのまま返す', () => {
    expect(__draftole_label__(null, 'name')).toBeNull();
    expect(__draftole_label__(undefined, 'name')).toBeUndefined();
  });

  it('型透過性: 戻り値型は入力型 T と一致する（コンパイル時に tsc --noEmit で検証）', () => {
    // 型透過性は実行時ではなく `tsc --noEmit` によって検証される。
    // ここでは入力型と戻り値型が同一として扱われることを最低限ランタイムで確認する。
    const tpl = createStyleTemplate({ properties: { color: 'red' } });
    const labeled = __draftole_label__(tpl, 'card');
    // labeled の静的型は StyleTemplate（identity）。プロパティアクセスが型エラーなく通る。
    const _bodyHash: string = labeled.bodyHash;
    expect(_bodyHash).toBe(tpl.bodyHash);

    const s: string = __draftole_label__('abc', 'name');
    expect(s).toBe('abc');

    const n: number = __draftole_label__(123, 'name');
    expect(n).toBe(123);
  });
});
