/**
 * each テンプレート捕捉モジュール
 *
 * `State<T[]>.each(fn)` が仮想 `State<Item>` を生成し、`fn` を 1 回評価して
 * `HtmlTag` テンプレートを得る処理を実装する。
 * テンプレート内の `VanillaCommand` を `EachTemplateSnapshot` に格納し、
 * `EachBinding<U>` を返す。
 *
 * Requirements: 3.5, 3.6, 4.7
 * Design: R-5 決定 / each テンプレート捕捉フロー
 */

import type { HtmlTag } from '../../../html/elements/html-tag.js';
import { renderCommand, type VanillaCommand } from '../commands.js';
import type { ElementTarget } from '../element-target.js';
import type { ArrayItem, EachBinding, StateImpl } from './state.js';
import { createTemplateState } from './template-derived-state.js';

// ────────────────────────────────────────────────────────────
// EachTemplateSnapshot
// ────────────────────────────────────────────────────────────

/**
 * each テンプレートの捕捉情報。
 *
 * design.md の Data Models セクション:
 * - `itemStateIdPattern`: "{parent}.item{i}" パターン
 * - `templateCommands`: テンプレート HtmlTag の `_pending` から取り出した命令列
 */
export interface EachTemplateSnapshot {
  /** スロット ID パターン。ランタイムが "{i}" を実際のインデックスに置換する */
  itemStateIdPattern: string;
  /** テンプレート内の VanillaCommand（_pending からスナップショット） */
  templateCommands: VanillaCommand[];
  /**
   * 6.1: closure 形式 factory 関数文字列。
   * `function(arrayId, idx, draftole) { ... return _e0; }` 形式。
   * テンプレートが空でも空ボディを持つ有効な factory が出力される。
   */
  factoryCode?: string;
  /** factory コード生成方式。closure（新形）/ static-placeholder（旧形）。 */
  factoryKind?: 'closure' | 'static-placeholder';
  /**
   * each-closure-fix: closure 経路で build-phase 直後に保持する template HtmlTag。
   * emit-phase で tagPath 注入と factoryCode 生成のために再走査する。
   * factoryCode 確定後は不要となるため optional。
   */
  _templateRoot?: HtmlTag;
}

/**
 * `captureEachTemplate` の戻り値型。
 * design.md の EachBinding<U> を拡張し `_snapshot` フィールドを追加する。
 */
export interface EachBindingWithSnapshot<U> extends EachBinding<U> {
  readonly _snapshot: EachTemplateSnapshot;
}

// ────────────────────────────────────────────────────────────
// captureEachTemplate
// ────────────────────────────────────────────────────────────

/**
 * `State<T[]>` の each テンプレートを捕捉して `EachBindingWithSnapshot<U>` を返す。
 *
 * 手順:
 * 1. 仮想スロット State を生成（`_runtimeId = "{arrayStateId}.itemTemplate"`）
 * 2. `fn(virtualState)` を 1 回呼び出してテンプレート `HtmlTag` を得る
 * 3. テンプレート HtmlTag の `_pending` をスナップショットとして取り出す
 * 4. `EachTemplateSnapshot` に格納
 * 5. `EachBindingWithSnapshot<U>` を返す
 *
 * @param state - 配列型の State（例: `State<Todo[]>`）
 * @param fn - 要素ごとのビルダ関数（ビルド時に 1 回のみ呼ばれる）
 */
export function captureEachTemplate<T, U extends HtmlTag | readonly HtmlTag[]>(
  state: StateImpl<T[]>,
  fn: (item: StateImpl<ArrayItem<T[]>>) => U,
): EachBindingWithSnapshot<U> {
  const arrayStateId = state._runtimeId;

  // 1. 仮想スロット State を生成
  //    _runtimeId = "{arrayStateId}.itemTemplate"（テンプレートビルド専用）
  const virtualState = createTemplateState<ArrayItem<T[]>>(
    arrayStateId,
    state._registry,
  );

  // 2. fn を 1 回だけ呼び出してテンプレート HtmlTag を得る
  const templateTag = fn(virtualState);

  // 3. テンプレート HtmlTag の _pending をスナップショット
  //    HtmlTag が配列の場合は最初の要素から取り出す
  //    （addChild を呼ばずに pending をスナップショット）
  const templateCommands: VanillaCommand[] = extractPendingCommands(templateTag);

  // 4. EachTemplateSnapshot を構築
  //    6.1: closure 形式の factoryCode を同時に生成して snapshot に格納する。
  //    テンプレートが配列の場合は最初の要素をルートとして扱う（既存仕様準拠）。
  const rootTag: HtmlTag = Array.isArray(templateTag)
    ? ((templateTag as readonly HtmlTag[])[0] as HtmlTag)
    : (templateTag as HtmlTag);

  // テンプレートツリー内に reactive バインディング（bind-text/value/class-*/style/attr）
  // があるかを判定する。バインディングを持つ場合は新形 closure factory
  // (`function(arrayId, idx, draftole) { ... }`) を出力し、無い場合は旧形
  // 静的 factory (`function(itemId, idx) { _root_c{i} ... }`) を出力する。
  // 旧 API（mvp-demo1 等）は後者の経路を維持して byte-equality を保つ。
  const hasBindings = templateHasBindings(rootTag);
  const snapshot: EachTemplateSnapshot = hasBindings
    ? {
        itemStateIdPattern: `${arrayStateId}.item{i}`,
        templateCommands,
        // closure 経路: factoryCode は render-phase フック (resolveEachFactories) で確定
        factoryCode: undefined,
        factoryKind: 'closure',
        _templateRoot: rootTag,
      }
    : {
        itemStateIdPattern: `${arrayStateId}.item{i}`,
        templateCommands,
        // static-placeholder 経路: build-time に確定（旧 API・byte-equality 維持）
        factoryCode: buildStaticFactoryCode(rootTag),
        factoryKind: 'static-placeholder',
      };

  // 5. EachBindingWithSnapshot を返す
  return {
    _kind: 'each' as const,
    _stateId: arrayStateId,
    _template: templateTag,
    _snapshot: snapshot,
  };
}

// ────────────────────────────────────────────────────────────
// 内部ユーティリティ
// ────────────────────────────────────────────────────────────

/**
 * テンプレート結果（HtmlTag または HtmlTag[]）から `_pending` コマンドを取り出す。
 * `addChild` を呼ばずにスナップショットのみ取得する。
 */
function extractPendingCommands(template: HtmlTag | readonly HtmlTag[]): VanillaCommand[] {
  if (Array.isArray(template)) {
    // 複数タグの場合は全タグの _pending を結合
    return (template as HtmlTag[]).flatMap((tag) => [...tag._pending]);
  }
  // 単一 HtmlTag
  return [...(template as HtmlTag)._pending];
}

// ────────────────────────────────────────────────────────────
// buildFactoryCode（6.1: closure 形式 factory 生成）
// ────────────────────────────────────────────────────────────

/**
 * `buildFactoryCode` のコンテキスト。
 * - `arrayStateId`: 親 `each` の配列 State ID（runtime 解決の prefix）
 * - `itemStateIdPattern`: スロット ID パターン。`{i}` 含む（例: `todos.item{i}`）
 */
export interface BuildFactoryContext {
  readonly arrayStateId: string;
  readonly itemStateIdPattern: string;
}

/**
 * テンプレート HtmlTag ツリーから closure ベースの factory 関数文字列を生成する。
 *
 * 出力形式:
 * ```js
 * function(itemId, idx, draftole) {
 *   const _e0 = document.createElement("li");
 *   _e0.setAttribute("class", "...");
 *   const _e1 = document.createElement("span");
 *   _e0.appendChild(_e1);
 *   __draftole__.bindText(_e1, itemId);
 *   return _e0;
 * }
 * ```
 *
 * - インナー要素は `_e0`, `_e1`, ... と採番（`_e0` が root）
 * - `document.createElement(tagName)` で構築（`querySelector` を一切使わない）
 * - `_pending` バインディングは target を `ClosureRefTarget` に書き換えて
 *   `renderCommand` 経由で JS 行を生成
 * - state 解決は `__draftole__.state(${arrayId}.item${idx})` 形式
 *   （task 5.1 決定の string-path-based API に従う）
 *
 * Requirements: 3.3, 4.1, 4.2, 4.3, 4.4, 4.5
 */
export function buildFactoryCode(
  tag: HtmlTag,
  context: BuildFactoryContext,
): string {
  const lines: string[] = [];
  const counter = { next: 0 };

  // 走査して全要素のローカル変数を確定し、createElement / 属性 / append / pending を出力
  const rootVar = walkAndEmit(tag, null, lines, counter, context);

  lines.push(`return ${rootVar};`);

  // インデント付き本体
  const body = lines.map((l) => `  ${l}`).join('\n');
  return `function(itemId, idx, draftole) {\n${body}\n}`;
}

// ────────────────────────────────────────────────────────────
// Task 2.2: emitAttributesExcludingId
// ────────────────────────────────────────────────────────────

/**
 * factory コード生成時、各 tag の `id` 属性を出力から除外して属性付与行を返す。
 *
 * - `id` キーの属性は per-iteration HTML id 一意性違反防止のため除外する（Req 2.1, 4.4）
 * - `class` / `data-*` 等の他の属性は維持する
 * - 元 `tag._attributes` 配列は mutate しない（ローカルコピーで対応）
 *
 * @param tag - 処理対象の HtmlTag
 * @param varName - 当該要素のローカル変数名（例: `_e0`）
 * @returns factory コード行の配列（`setAttribute(...)` 形式）
 *
 * Requirements: 2.1, 4.4
 * Design: design.md § walkAndEmit:stripIds / emitAttributesExcludingId
 */
function emitAttributesExcludingId(tag: HtmlTag, varName: string): string[] {
  const attributes = (tag.attributes ?? []) as ReadonlyArray<{
    key: string;
    attributeValue: { type: string; value?: string; name?: string };
  }>;
  const result: string[] = [];
  for (const attr of attributes) {
    // id 属性は factory 出力から除外（per-iteration 重複防止）
    if (attr.key === 'id') continue;
    const av = attr.attributeValue;
    const key = attr.key;
    if (av.type === 'keyValue') {
      result.push(
        `${varName}.setAttribute(${JSON.stringify(key)}, ${JSON.stringify(String(av.value ?? ''))});`,
      );
    } else if (av.type === 'boolean') {
      result.push(`${varName}.setAttribute(${JSON.stringify(key)}, "");`);
    } else if (av.type === 'custom') {
      result.push(
        `${varName}.setAttribute(${JSON.stringify(`data-${av.name ?? ''}`)}, ${JSON.stringify(String(av.value ?? ''))});`,
      );
    }
  }
  return result;
}

/**
 * 再帰的に HtmlTag ツリーを走査し、各要素の createElement / 属性付与 /
 * 親 appendChild / `_pending` バインディング行を `lines` に追記する。
 *
 * @returns 当該要素に割り当てた closure ローカル変数名（例: `_e0`）
 */
function walkAndEmit(
  tag: HtmlTag,
  parentVar: string | null,
  lines: string[],
  counter: { next: number },
  context: BuildFactoryContext,
): string {
  const varName = `_e${counter.next}`;
  counter.next += 1;

  // 1) document.createElement
  //    tagType が未指定のモック等は 'div' にフォールバック
  const tagName = String((tag as { tagType?: unknown }).tagType ?? 'div');
  lines.push(`const ${varName} = document.createElement(${JSON.stringify(tagName)});`);

  // 2) 静的属性付与（_attributes）— id を除いて emit（Task 2.2: emitAttributesExcludingId）
  //    HtmlAttributeValue 判別共用体を unwrap する（task 8.2 Bug A 修正）。
  //    `String(attr.attributeValue)` だと `[object Object]` になるため、
  //    `.type` で分岐して `value` を取り出す。
  //
  //    class 属性は protoRender 後の `_attributes` 経由でこのループが拾う
  //    ため、`css:` 由来クラスも含めて `setAttribute("class", "...")` として
  //    出力される（render-phase フック前提）。
  //
  //    id 属性は per-iteration HTML id 一意性違反防止のため factory 出力から除外する
  //    （Req 2.1, 4.4, design.md: walkAndEmit:stripIds）。
  for (const attrLine of emitAttributesExcludingId(tag, varName)) {
    lines.push(attrLine);
  }

  // 3) `_pending` バインディングを ClosureRefTarget に書き換えて emit
  //    - target の kind（deferred-self / sel）を問わず closure-ref（_eN）に書き換える。
  //      factory 内の要素は document.createElement で生成されるため querySelector 不要。
  //    - `appendChild` 命令は step 5 の再帰ウォークで重複出力するためスキップ。
  //    （Task 2.2: Req 1.4, 2.4, design.md: walkAndEmit:rewriteDeferredSelf）
  for (const cmd of tag._pending) {
    if (cmd.type === 'appendChild') continue;
    const rewritten = rewriteCommandTarget(cmd, varName, context);
    lines.push(renderCommand(rewritten));
  }

  // 4) 親へ appendChild（root はスキップ）
  if (parentVar !== null) {
    lines.push(`${parentVar}.appendChild(${varName});`);
  }

  // 5) 子要素を再帰（addChild 経路の `children` ＋ appendChild 経路の `_appendedChildren`）
  const children = ((tag as { children?: ReadonlyArray<unknown> }).children ?? []);
  const appended = ((tag as { _appendedChildren?: ReadonlyArray<unknown> })._appendedChildren ?? []);
  for (const child of children) {
    walkAndEmit(child as HtmlTag, varName, lines, counter, context);
  }
  for (const child of appended) {
    walkAndEmit(child as HtmlTag, varName, lines, counter, context);
  }

  return varName;
}

// ────────────────────────────────────────────────────────────
// templateHasBindings — closure / static factory 切替判定
// ────────────────────────────────────────────────────────────

/**
 * テンプレート HtmlTag ツリー全体に reactive バインディング（`bind-*` 系）が
 * 含まれているかを判定する純関数。`appendChild` のような構造命令は除外する。
 * `addChild` 経路の `children` と `appendChild` 経路の `_appendedChildren` の
 * 両方を再帰的に走査する。
 */
function templateHasBindings(tag: HtmlTag): boolean {
  for (const cmd of tag._pending) {
    if (
      cmd.type === 'bind-text' ||
      cmd.type === 'bind-value' ||
      cmd.type === 'bind-checked' ||
      cmd.type === 'bind-class-all' ||
      cmd.type === 'bind-class-add' ||
      cmd.type === 'bind-style' ||
      cmd.type === 'bind-attr' ||
      cmd.type === 'bind-each'
    ) {
      return true;
    }
  }
  const children = ((tag as { children?: ReadonlyArray<unknown> }).children ?? []);
  for (const child of children) {
    if (templateHasBindings(child as HtmlTag)) return true;
  }
  const appended = ((tag as { _appendedChildren?: ReadonlyArray<unknown> })._appendedChildren ?? []);
  for (const child of appended) {
    if (templateHasBindings(child as HtmlTag)) return true;
  }
  return false;
}

// ────────────────────────────────────────────────────────────
// buildStaticFactoryCode — 旧形プレースホルダ factory（byte-equality 維持用）
// ────────────────────────────────────────────────────────────

/**
 * バインディングを持たない each テンプレート向けの旧形 factory コードを生成する。
 *
 * 出力形式（mvp-demo1 baseline と byte-equal）:
 * ```js
 * function(itemId, idx) {
 *     const _root = document.createElement("li");
 *     _root.id = "each-todo-item";
 *     ...
 *     return _root;
 *   }
 * ```
 *
 * - 変数名は `_root` / `_root_c0` / `_root_c0_c0` 形式
 * - 属性付与は `id` / `class` のみ DOM プロパティ直書き、それ以外は `setAttribute`
 * - 子要素は `addChild` (`children`) と `appendChild` (`_appendedChildren`) 両経路を結合
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4 — 旧 API 経路の出力同等性
 */
function buildStaticFactoryCode(tag: HtmlTag): string {
  const lines: string[] = [];
  appendStaticCreateCode(tag, '_root', lines);
  lines.push('return _root;');
  return `function(itemId, idx) {\n    ${lines.join('\n    ')}\n  }`;
}

function appendStaticCreateCode(tag: HtmlTag, varName: string, lines: string[]): void {
  const tagName = String((tag as { tagType?: unknown }).tagType ?? 'div');
  lines.push(`const ${varName} = document.createElement(${JSON.stringify(tagName)});`);

  const attributes = (tag.attributes ?? []) as ReadonlyArray<{
    key: string;
    attributeValue: { type: string; value?: string; name?: string };
  }>;
  for (const attr of attributes) {
    const av = attr.attributeValue;
    const key = attr.key;
    if (av.type === 'keyValue') {
      const v = String(av.value ?? '');
      if (key === 'class') {
        lines.push(`${varName}.className = ${JSON.stringify(v)};`);
      } else if (key === 'id') {
        lines.push(`${varName}.id = ${JSON.stringify(v)};`);
      } else {
        lines.push(`${varName}.setAttribute(${JSON.stringify(key)}, ${JSON.stringify(v)});`);
      }
    } else if (av.type === 'boolean') {
      lines.push(`${varName}.setAttribute(${JSON.stringify(key)}, "");`);
    } else if (av.type === 'custom') {
      lines.push(
        `${varName}.setAttribute(${JSON.stringify(`data-${av.name ?? ''}`)}, ${JSON.stringify(String(av.value ?? ''))});`,
      );
    }
  }

  // `addChild` 経路の children と `appendChild` 経路の _appendedChildren を結合
  const children = (tag as { children?: ReadonlyArray<unknown> }).children ?? [];
  const appended = (tag as { _appendedChildren?: ReadonlyArray<unknown> })._appendedChildren ?? [];
  const all: HtmlTag[] = [...(children as HtmlTag[]), ...(appended as HtmlTag[])];
  all.forEach((child, i) => {
    const childVar = `${varName}_c${i}`;
    appendStaticCreateCode(child, childVar, lines);
    lines.push(`${varName}.appendChild(${childVar});`);
  });
}

/**
 * `_pending` 内 VanillaCommand の `target` を `ClosureRefTarget { varName }`
 * に書き換える。`stateId` も itemStateIdPattern の `{i}` を実際のランタイム
 * 値（factory 引数の `itemId`）に置換する必要があるが、`renderCommand`
 * が `stateId` を JSON.stringify でクォートする仕様のため、ここでは
 * `stateId` のリテラル値を「そのまま展開可能なプレースホルダ文字列」として
 * 残し、最終的に runtime の `__draftole__.state(stateId)` がリテラル ID を
 * 解決する設計とする（task 5.1 決定の string-path-based API）。
 *
 * - `stateId` がスロット ID パターン（例: `todos.itemTemplate.text`）の場合、
 *   `arrayStateId.itemTemplate` プレフィックスを factory 引数 `itemId`
 *   への直参照（rest なしなら `itemId`、rest ありなら `itemId + "..."`）に
 *   置き換えるため、`stateId` を文字列リテラルに含めず raw 命令で出力する。
 *
 */
function rewriteCommandTarget(
  cmd: VanillaCommand,
  varName: string,
  context: BuildFactoryContext,
): VanillaCommand {
  // ElementTarget を持つコマンドのみ書き換え対象
  if (!('target' in cmd) || cmd.target === undefined || cmd.target === null) {
    return cmd;
  }

  // factory コード生成では target の kind を問わず closure-ref に書き換える。
  // 要素は document.createElement で生成され _eN に格納されるため、
  // deferred-self / sel いずれの target も closure-ref に統一する（Req 1.4）。
  const newTarget: ElementTarget = { kind: 'closure-ref', varName };

  // stateId の動的解決：テンプレートスロット ID プレフィックスを差し替える。
  // captureEachTemplate が `${arrayStateId}.itemTemplate` を仮想 _runtimeId に
  // 設定しているため、これを `${arrayStateId}.item${idx}` プレフィックスに
  // 読み替える（ただしリテラル文字列内では idx を埋め込めないため、
  // バインディング行は raw 命令で動的連結式を出力する）。
  const slotPrefix = `${context.arrayStateId}.itemTemplate`;
  const itemPrefix = `${context.arrayStateId}.item`;

  // stateId を持つコマンドの判定
  const hasStateId = 'stateId' in cmd && typeof (cmd as { stateId?: unknown }).stateId === 'string';
  if (hasStateId) {
    const original = (cmd as { stateId: string }).stateId;
    if (original.startsWith(slotPrefix)) {
      // 動的 stateId 行を raw 命令として直接出力する。
      // factory 引数 `itemId` を直接参照する形（rest なしなら `itemId`、
      // rest ありなら `itemId + ".rest"`）で解決。
      const rest = original.slice(slotPrefix.length); // 例: ".text" または ""
      const dynamicId = rest.length === 0
        ? `itemId`
        : `itemId + ${JSON.stringify(rest)}`;
      // raw コマンドとして個別レンダー
      return buildRawBindCommand(cmd, varName, dynamicId, itemPrefix);
    }
  }

  // ElementTarget のみ書き換え（stateId はリテラルのまま）
  return { ...cmd, target: newTarget } as VanillaCommand;
}

/**
 * 動的 stateId（factory 引数 `itemId` への直参照式、例: `itemId` や
 * `itemId + ".text"`）を持つバインディング命令を raw 文字列に組み立てる。
 * `renderCommand` は stateId を JSON.stringify する仕様のため、動的式を
 * 埋め込むには raw 命令経由で出力する必要がある。
 *
 * NOTE: `_itemPrefix` パラメータは現状未使用（旧実装との後方互換配慮で
 * シグネチャを温存）。
 */
function buildRawBindCommand(
  cmd: VanillaCommand,
  varName: string,
  dynamicStateId: string,
  _itemPrefix: string,
): VanillaCommand {
  // 各バインド種別ごとに raw 行を構築
  const tgt = varName; // closure-ref はそのまま識別子
  let line: string;
  switch (cmd.type) {
    case 'bind-text': {
      const transform = cmd.transform === undefined ? '' : `, ${cmd.transform.code}`;
      line = `__draftole__.bindText(${tgt}, ${dynamicStateId}${transform});`;
      break;
    }
    case 'bind-value': {
      const transform = cmd.transform === undefined ? '' : `, ${cmd.transform.code}`;
      line = `__draftole__.bindValue(${tgt}, ${dynamicStateId}${transform});`;
      break;
    }
    case 'bind-checked': {
      const transform = cmd.transform === undefined ? '' : `, ${cmd.transform.code}`;
      line = `__draftole__.bindChecked(${tgt}, ${dynamicStateId}${transform});`;
      break;
    }
    case 'bind-class-all': {
      const transform = cmd.transform === undefined ? '' : `, ${cmd.transform.code}`;
      line = `__draftole__.bindClassAll(${tgt}, ${dynamicStateId}${transform});`;
      break;
    }
    case 'bind-class-add': {
      const transform = cmd.transform === undefined ? '' : `, ${cmd.transform.code}`;
      line = `__draftole__.bindClassAdd(${tgt}, ${dynamicStateId}${transform});`;
      break;
    }
    case 'bind-style': {
      const transform = cmd.transform === undefined ? '' : `, ${cmd.transform.code}`;
      line = `__draftole__.bindStyle(${tgt}, ${JSON.stringify(cmd.prop)}, ${dynamicStateId}${transform});`;
      break;
    }
    case 'bind-attr': {
      const transform = cmd.transform === undefined ? '' : `, ${cmd.transform.code}`;
      line = `__draftole__.bindAttr(${tgt}, ${JSON.stringify(cmd.attr)}, ${dynamicStateId}${transform});`;
      break;
    }
    default:
      // 予期しない型は元コマンドの target だけ書き換えてフォールバック
      return { ...cmd, target: { kind: 'closure-ref', varName } } as VanillaCommand;
  }
  return { type: 'raw', code: line };
}
