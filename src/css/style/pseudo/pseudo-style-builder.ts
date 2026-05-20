/**
 * 疑似クラス（:hover / :focus / :active）用 fluent スタイルビルダー。
 *
 * `Map<string, string>` に直接 CSS プロパティ（kebab-case）を書き込む。
 * `CSSPseudo.applyBuilder()` がこの Map を消費する。
 *
 * エスケープハッチ `.set(property, value)` により、メソッドに未定義の
 * CSS プロパティも任意に設定できる。
 */
export class PseudoStyleBuilder {
  private readonly _props = new Map<string, string>();

  color(v: string): this            { this._props.set('color', v); return this; }
  background(v: string): this       { this._props.set('background', v); return this; }
  backgroundColor(v: string): this  { this._props.set('background-color', v); return this; }
  opacity(v: string): this          { this._props.set('opacity', v); return this; }
  transform(v: string): this        { this._props.set('transform', v); return this; }
  boxShadow(v: string): this        { this._props.set('box-shadow', v); return this; }
  border(v: string): this           { this._props.set('border', v); return this; }
  borderColor(v: string): this      { this._props.set('border-color', v); return this; }
  borderRadius(v: string): this     { this._props.set('border-radius', v); return this; }
  fontSize(v: string): this         { this._props.set('font-size', v); return this; }
  fontWeight(v: string): this       { this._props.set('font-weight', v); return this; }
  textDecoration(v: string): this   { this._props.set('text-decoration', v); return this; }
  padding(v: string | number): this {
    this._props.set('padding', typeof v === 'number' ? `${v}px` : v);
    return this;
  }
  width(v: string): this            { this._props.set('width', v); return this; }
  height(v: string): this           { this._props.set('height', v); return this; }
  cursor(v: string): this           { this._props.set('cursor', v); return this; }
  transition(v: string): this       { this._props.set('transition', v); return this; }

  /** 任意の CSS プロパティを kebab-case で直接設定するエスケープハッチ */
  set(property: string, value: string): this {
    this._props.set(property, value);
    return this;
  }

  /** @internal CSSPseudo が Map を取得するための内部 API */
  toMap(): ReadonlyMap<string, string> {
    return this._props;
  }
}
