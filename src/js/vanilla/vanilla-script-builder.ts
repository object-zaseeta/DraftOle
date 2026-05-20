/**
 * `VanillaScriptBuilder` クラス本体（命令蓄積器 + `render()`）。
 *
 * 設計書 `design.md` の「vanilla-script-builder」「VanillaScope」節に対応する。
 *
 * 責務:
 * - トップレベル命令キュー、`onDomReady` ブロック用の単一キュー、子 Builder を用いた
 *   関数本体 / `onDomReady` / `forEach` / `ifThen` / イベントハンドラ本体の組み立て。
 * - `render()` は冪等で副作用を持たず、`append` 順を保った JS 文字列を返す（Req 7.4）。
 * - `hasDomReady` は `onDomReady` が 1 度でも呼ばれたかを反映する（wrapDOMReady 併用判定に使用）。
 * - 出力に `jQuery` / `$` を含まない（Req 1.5, 7.1、`commands.ts` の語彙集約による担保）。
 *
 * 公開 API は `createVanillaScript()` ファクトリのみ。クラス本体は外部 import しない。
 */

import { renderCommand, renderCommands, type VanillaCommand } from './commands.js';

/**
 * `ifThen` の条件や `let` の値、`call` の引数に渡す最小インターフェース。
 * `.code` を備えた任意の値オブジェクト（`JsExpr` / `ElementRef` 等）が適合する。
 */
export interface ScopeExpr {
  readonly code: string;
}

/**
 * スコープ内で利用できる制御・値組み立て API。
 *
 * Task 3.1 で提供する最小セット：`raw` / `let` / `call` / `return` / `ifThen`。
 * `query` / `on` / `classList.*` 等は後続タスクで別ファイルから拡張される想定。
 */
export interface VanillaScope {
  /**
   * 内部 API：現在スコープのキューに任意の `VanillaCommand` を追加する。
   *
   * このフックは `event-api` / `query-api` / `dom-api` / `tree-api` などの
   * ユーザ向け関数が、Scope インターフェース自体を `on` / `query` / `classList.*`
   * 等で肥大化させずに命令を append できるようにするためのエスケープハッチ。
   * 利用者コードからの直接呼び出しは非推奨（命令種別は内部詳細）。
   */
  _append(cmd: VanillaCommand): void;

  /**
   * 内部 API：現在スコープ用に子スコープを構築するためのフック。
   * `event-api` のハンドラ本体組み立てなど、子キューで命令を蓄積して
   * まとめて `renderCommands` に掛ける用途に利用する。
   */
  _childScope(queue: VanillaCommand[]): VanillaScope;

  /** 任意 JS 式を式として埋め込む。副作用として命令は発行しない（`JsExpr` 相当を返す）。 */
  raw(code: string): ScopeExpr;

  /**
   * `const name = <value.code>;` 命令を現在スコープに append し、`name` を指す値オブジェクトを返す。
   * 設計では `const`/`let` の区別は内部詳細であり、常に `const` を出力する。
   */
  let(name: string, value: ScopeExpr): ScopeExpr;

  /**
   * 関数呼び出し式 `name(args...)` を現在スコープに `expr` 命令として append する。
   * 戻り値は式として再利用可能なオブジェクト（呼び出し結果を別文脈で使いたい場合）。
   */
  call(name: string, args?: readonly ScopeExpr[]): ScopeExpr;

  /** `return;` を発行する。 */
  return(): void;

  /** `if (cond) { then } else? { orElse }` を発行する。 */
  ifThen(
    condition: ScopeExpr,
    then: (s: VanillaScope) => void,
    orElse?: (s: VanillaScope) => void,
  ): void;
}

/**
 * `render()` で JS 文字列を得るアキュムレータの公開ビュー。
 */
export interface VanillaScript {
  /** 生成される JS 文字列。末尾改行は含めない。 */
  render(): string;
  /**
   * `render()` 出力が最外層で `DOMContentLoaded` リスナーを含むか。
   * `wrapDOMReady` 併用の要否判定に利用する。
   */
  readonly hasDomReady: boolean;
}

/**
 * `VanillaScript` に加えて命令 append と制御フロー API を公開する Builder 型。
 * 公開 API からは `createVanillaScript()` 経由でのみ取得できる。
 */
export interface VanillaScriptBuilder extends VanillaScript {
  /** 内部 API：任意の `VanillaCommand` をトップレベルキューに追加する。 */
  append(cmd: VanillaCommand): void;

  /** `onDomReady` ブロックを開き、ハンドラ内で append された命令を DOMContentLoaded 内に合流する。 */
  onDomReady(body: (s: VanillaScope) => void): void;

  /** トップレベルに関数定義を追加する。 */
  declareFunction(
    name: string,
    params: readonly string[],
    body: (s: VanillaScope) => void,
  ): void;

  /** `declareFunction` の省略形。`fn(name, body)` なら params は空配列。 */
  fn(name: string, body: (s: VanillaScope) => void): void;
  fn(name: string, params: readonly string[], body: (s: VanillaScope) => void): void;
}

// ─────────────────────────────────────────────────────────────────────────────
// 内部実装
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 子スコープのキューに命令を append する `VanillaScope` 実装。
 * 親 Builder からも共通に利用されるため関数として切り出す。
 */
function createScope(queue: VanillaCommand[]): VanillaScope {
  const scope: VanillaScope = {
    _append(cmd) {
      queue.push(cmd);
    },
    _childScope(childQueue) {
      return createScope(childQueue);
    },
    raw(code) {
      return { code };
    },
    let(name, value) {
      queue.push({ type: 'declareConst', name, expr: value.code });
      return { code: name };
    },
    call(name, args) {
      const argList = (args ?? []).map((a) => a.code).join(', ');
      const code = `${name}(${argList})`;
      queue.push({ type: 'expr', code });
      return { code };
    },
    return() {
      queue.push({ type: 'raw', code: 'return;' });
    },
    ifThen(condition, then, orElse) {
      const thenQueue: VanillaCommand[] = [];
      then(createScope(thenQueue));
      const thenCode = renderCommands(thenQueue, '  ');
      if (orElse !== undefined) {
        const elseQueue: VanillaCommand[] = [];
        orElse(createScope(elseQueue));
        const elseCode = renderCommands(elseQueue, '  ');
        queue.push({
          type: 'if',
          condition: condition.code,
          thenCode,
          elseCode,
        });
      } else {
        queue.push({ type: 'if', condition: condition.code, thenCode });
      }
    },
  };
  return scope;
}

/**
 * `VanillaScriptBuilder` の具象実装。外部には型として露出せず、
 * `createVanillaScript()` 経由でインターフェース型として提供する。
 */
class VanillaScriptBuilderImpl implements VanillaScriptBuilder {
  /** トップレベル命令キュー（`append` / `declareFunction` の順序を保つ）。 */
  private readonly topCommands: VanillaCommand[] = [];
  /** 単一の `onDomReady` 合流キュー（複数呼び出しはここに順次追加される）。 */
  private readonly onDomReadyCommands: VanillaCommand[] = [];
  /** `onDomReady` が 1 度でも呼ばれたかを示すフラグ（`hasDomReady` の裏付け）。 */
  private _hasDomReady = false;

  get hasDomReady(): boolean {
    return this._hasDomReady;
  }

  append(cmd: VanillaCommand): void {
    this.topCommands.push(cmd);
  }

  onDomReady(body: (s: VanillaScope) => void): void {
    this._hasDomReady = true;
    body(createScope(this.onDomReadyCommands));
  }

  declareFunction(
    name: string,
    params: readonly string[],
    body: (s: VanillaScope) => void,
  ): void {
    const fnQueue: VanillaCommand[] = [];
    body(createScope(fnQueue));
    const bodyCode = renderCommands(fnQueue, '  ');
    this.topCommands.push({ type: 'declareFunction', name, params, bodyCode });
  }

  fn(name: string, body: (s: VanillaScope) => void): void;
  fn(name: string, params: readonly string[], body: (s: VanillaScope) => void): void;
  fn(
    name: string,
    paramsOrBody: readonly string[] | ((s: VanillaScope) => void),
    maybeBody?: (s: VanillaScope) => void,
  ): void {
    if (typeof paramsOrBody === 'function') {
      this.declareFunction(name, [], paramsOrBody);
    } else {
      if (maybeBody === undefined) {
        throw new Error('fn(): body function is required when params are provided');
      }
      this.declareFunction(name, paramsOrBody, maybeBody);
    }
  }

  render(): string {
    const parts: string[] = [];
    // トップレベル命令（append 順、declareFunction 含む）
    for (const cmd of this.topCommands) {
      parts.push(renderCommand(cmd));
    }
    // 末尾に DOMContentLoaded ブロック（呼ばれていれば）
    if (this._hasDomReady) {
      const bodyCode = renderCommands(this.onDomReadyCommands, '  ');
      parts.push(renderCommand({ type: 'domReady', bodyCode }));
    }
    return parts.join('\n');
  }
}

/**
 * `VanillaScriptBuilder` インスタンスを生成する公開ファクトリ。
 *
 * クラス実装は非公開であり、このファクトリ経由でのみ取得できる。
 * `Root` は内部でこのファクトリを使用して単一の builder を遅延生成する。
 * 直接利用する場合は `append` / `fn` / `onDomReady` / `render` を呼ぶ。
 *
 * @returns 新しい `VanillaScriptBuilder` インスタンス
 *
 * @example
 * ```typescript
 * const builder = createVanillaScript();
 * builder.onDomReady(s => s.call('init'));
 * console.log(builder.render());
 * ```
 */
export function createVanillaScript(): VanillaScriptBuilder {
  return new VanillaScriptBuilderImpl();
}
