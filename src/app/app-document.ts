import type { HtmlTag } from '../html/elements/html-tag.js';
import type { Root } from '../html/elements/root.js';
import type { HTMLTagProtocol } from '../html/protocols/html-tag-protocol.js';
import type { State } from '../js/vanilla/state/state.js';
import { FileExporter } from '../publisher/file-exporter.js';
import type { AppContext } from './app.js';
import type { AppOptions } from './app-options.js';

/**
 * `app()` ファクトリが返す対話型アプリのファサードオブジェクト。
 *
 * - `state<T>()`: `Root.runtimeContext.state<T>()` に委譲
 * - `exportTo()`: ユーザー content を `<body>` 直下に append し `FileExporter` 経由で出力
 *
 * **再 export 制限**: `exportTo()` は 1 インスタンスにつき 1 回のみ。
 * 2 回目以降は `Error` を throw する。
 *
 * Requirements: 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.3
 * Boundary: src/app/app-document.ts
 */

/** `exportTo()` に渡せるビュー要素の型 */
export type AppView = HtmlTag;

export class AppDocument implements AppContext {
  private readonly _root: Root;
  private readonly _bodyEl: HtmlTag;
  private readonly _options: AppOptions;
  private _exported = false;

  /** @internal `app()` ファクトリからのみ生成される */
  constructor(root: Root, bodyEl: HtmlTag, options: AppOptions) {
    this._root = root;
    this._bodyEl = bodyEl;
    this._options = options;
  }

  /**
   * Req 2.1: リアクティブ state を生成する。
   * `Root.runtimeContext.state()` へ委譲するため、生成された State は
   * 同一ドキュメントの event handler / binding と同じ StateRegistry を参照する。
   */
  state<T>(initialValue: T): State<T> {
    return this._root.state(initialValue);
  }

  /**
   * Req 3.1, 3.2, 3.3: content を `<body>` 直下に append し HTML/CSS/JS を出力する。
   *
   * - `<main>` で包まない（SPA 用途のためユーザーの view ツリーをそのまま body 直下に配置）
   * - `wrapDOMReady: true` のとき生成 JS を `DOMContentLoaded` でラップする
   * - 書き込み不可パスでは `ExportableError('invalidPath')` が透過する
   *
   * @throws {Error} 同一 AppDocument で 2 回目以降の呼び出し時
   * @throws {ExportableError} outputPath が無効または書き込み失敗時
   */
  exportTo(content: AppView | readonly AppView[], outputPath: string): void {
    if (this._exported) {
      throw new Error(
        'AppDocument.exportTo can only be called once. Create a new app() instance to export again.',
      );
    }

    const views = Array.isArray(content) ? content : [content];
    for (const view of views) {
      this._bodyEl.addChild(view as unknown as HTMLTagProtocol);
      this._root.flushDescendants(view as unknown as HTMLTagProtocol);
    }

    new FileExporter({ wrapDOMReady: this._options.wrapDOMReady ?? false }).exportFromRoot(
      this._root,
      outputPath,
    );

    this._exported = true;
  }
}
