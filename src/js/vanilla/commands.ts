/**
 * 内部命令レコード `VanillaCommand` 判別共用体と JS 文字列化関数。
 *
 * 設計書 `design.md` の「commands: VanillaCommand」「renderCommand」「renderCommands」に対応。
 * 本モジュールは全 API が発行する命令の代数的データ型と、それらを JS 文字列へ
 * 変換する純関数を 1 箇所に集約する。`jQuery` / `$` を出力に含めない制約を
 * コードレビュー可能にする責務を負う（Req 1.5, 7.1）。
 */

import type { JsExpr } from './types.js';
import type { ElementTarget } from './element-target.js';
import type { HtmlTag } from '../../html/elements/html-tag.js';

// 旧 `ElementTarget`（`'var' | 'sel'`）は `element-target.ts` 由来の
// 新共用体（`'sel' | 'closure-ref'`）に統一された（task 5.4）。
// `closure-ref` バリアントは旧 `'var'` バリアントの後継で、
// `varName` を裸の識別子として埋め込む（factory コード内のローカル変数名）。
export type { ElementTarget };
export type { SelectorTarget, ClosureRefTarget } from './element-target.js';

/**
 * each テンプレートの捕捉情報。
 * `each-template.ts` との循環 import を避けるためここで独立定義する。
 * （`each-template.ts` が `commands.ts` を import するため循環になる）
 *
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
 * バニラ JS ビルダーが発行する内部命令の判別共用体。
 * 各バリアントは `type` で識別され、`renderCommand` により JS 文字列に変換される。
 */
export type VanillaCommand =
  | { type: 'addEventListener'; target: ElementTarget; event: string; handlerCode: string }
  | { type: 'domReady'; bodyCode: string }
  | { type: 'declareFunction'; name: string; params: readonly string[]; bodyCode: string }
  | { type: 'declareConst'; name: string; expr: string }
  | { type: 'classListToggle'; target: ElementTarget; name: string; force?: string }
  | { type: 'classListAdd'; target: ElementTarget; name: string }
  | { type: 'classListRemove'; target: ElementTarget; name: string }
  | { type: 'setProp'; target: ElementTarget; prop: 'textContent' | 'value'; expr: string }
  | { type: 'setStyle'; target: ElementTarget; key: string; expr: string }
  | { type: 'appendChild'; parent: ElementTarget; child: ElementTarget }
  | { type: 'remove'; target: ElementTarget }
  | { type: 'forEach'; listExpr: string; itemVar: string; bodyCode: string }
  | { type: 'if'; condition: string; thenCode: string; elseCode?: string }
  | { type: 'expr'; code: string }
  | { type: 'raw'; code: string }
  // ── reactive-state 拡張（Req 1.2, 2.2, 4.1–4.7） ──────────────────────
  | { type: 'state-init'; id: string; initial: JsExpr }
  | { type: 'state-set'; id: string; value: JsExpr }
  | { type: 'state-update'; id: string; body: JsExpr }
  | { type: 'bind-text'; target: ElementTarget; stateId: string; transform?: JsExpr }
  | { type: 'bind-value'; target: ElementTarget; stateId: string; transform?: JsExpr }
  | { type: 'bind-checked'; target: ElementTarget; stateId: string; transform?: JsExpr }
  | { type: 'bind-class-all'; target: ElementTarget; stateId: string; transform?: JsExpr }
  | { type: 'bind-class-add'; target: ElementTarget; stateId: string; transform?: JsExpr }
  | { type: 'bind-style'; target: ElementTarget; prop: string; stateId: string; transform?: JsExpr }
  | { type: 'bind-attr'; target: ElementTarget; attr: string; stateId: string; transform?: JsExpr }
  | { type: 'bind-each'; target: ElementTarget; stateId: string; template: EachTemplateSnapshot }
  // ── Computed 派生状態（方針 B: Computed をランタイム状態として初期化） ────
  | { type: 'derive-state'; sourceId: string; derivedId: string; transformBody: JsExpr }
  // ── handler-serialization 拡張（Req 4.1, 4.4） ──────────────────────────
  | { type: 'handler-body'; target: ElementTarget; event: string; code: string; params: readonly string[] };

/**
 * 文字列値を JS 文字列リテラルとして安全にクォート・エスケープする。
 * セレクタ・クラス名・テキスト値・イベント名などすべての静的文字列に適用する。
 */
function quote(value: string): string {
  return JSON.stringify(value);
}

/**
 * `ElementTarget` を JS 式文字列に変換する内部ユーティリティ。
 * - `{ kind: 'closure-ref', varName }` → `varName`（裸の識別子をそのまま出力）
 * - `{ kind: 'sel', selector }` → `document.querySelector("selector")`
 */
export function renderElementTarget(target: ElementTarget): string {
  switch (target.kind) {
    case 'closure-ref':
      return target.varName;
    case 'sel':
      return `document.querySelector(${quote(target.selector)})`;
    case 'deferred-self':
      throw new TypeError(
        'renderElementTarget: deferred-self target must be resolved before rendering',
      );
    default: {
      const _exhaustive: never = target;
      throw new TypeError(
        `renderElementTarget: unknown ElementTarget variant: ${String(_exhaustive)}`,
      );
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Task 1.4: CommandWithTarget 型・rewriteCommandTarget・hasCommandTarget
// ────────────────────────────────────────────────────────────────────────────

/**
 * `target: ElementTarget` プロパティを持つ `VanillaCommand` バリアントの集合型。
 * `Extract` により target を持たない variant（`domReady`, `declareFunction` 等）
 * は集合から除外される。
 *
 * Requirements: 1.4, 4.1, 4.2
 */
export type CommandWithTarget = Extract<VanillaCommand, { target: ElementTarget }>;

/**
 * `CommandWithTarget` の target を書き換えた新しいオブジェクトを返すヘルパ。
 * ジェネリック `C` を維持することで呼び出し側の variant 型が保たれる。
 * `as C` キャストはこの関数内のみに局所化する。
 *
 * Requirements: 1.4, 4.1, 4.2
 */
export function rewriteCommandTarget<C extends CommandWithTarget>(
  cmd: C,
  target: ElementTarget,
): C {
  return { ...cmd, target } as C;
}

/**
 * `VanillaCommand` が `CommandWithTarget` であるかを判定する型ガード。
 * `target` プロパティが存在し、かつ `kind` フィールドを持つオブジェクトであることを検査する。
 *
 * Requirements: 1.4, 4.1
 */
export function hasCommandTarget(cmd: VanillaCommand): cmd is CommandWithTarget {
  return (
    'target' in cmd &&
    (cmd as { target?: unknown }).target !== undefined &&
    typeof (cmd as { target: { kind: string } }).target.kind === 'string'
  );
}

/**
 * `appendChild` コマンドの parent / child 双方の `ElementTarget` を書き換えた
 * 新しいオブジェクトを返すヘルパ。
 *
 * `rewriteCommandTarget` は `.target` 単一フィールド専用（`CommandWithTarget` 制約）
 * であるため、`parent`/`child` の 2 フィールドを持つ `appendChild` には使えない。
 * 本ヘルパはその専用版として提供する。
 *
 * Requirements: 1.4, 4.3
 */
export type AppendChildCommand = Extract<VanillaCommand, { type: 'appendChild' }>;

export function rewriteAppendChildTargets(
  cmd: AppendChildCommand,
  parentRef: ElementTarget,
  childRef: ElementTarget,
): AppendChildCommand {
  return { ...cmd, parent: parentRef, child: childRef };
}

/**
 * 命令レコードを完全な JS 文字列（1 文または複数行ブロック）に変換する純関数。
 * `switch` + `default: never` チェックにより命令追加時のコンパイルエラーで漏れを検知する。
 *
 * - セレクタ・クラス名・テキスト値等の静的文字列は `JSON.stringify` でクォートされる。
 * - 出力に `jQuery` / `$` 識別子を含めない（`raw` 命令で利用者が混入させた場合を除く）。
 */
export function renderCommand(cmd: VanillaCommand): string {
  switch (cmd.type) {
    case 'addEventListener': {
      const tgt = renderElementTarget(cmd.target);
      return `${tgt}.addEventListener(${quote(cmd.event)}, ${cmd.handlerCode});`;
    }
    case 'domReady':
      return `document.addEventListener("DOMContentLoaded", () => {\n${cmd.bodyCode}\n});`;
    case 'declareFunction': {
      const params = cmd.params.join(', ');
      return `function ${cmd.name}(${params}) {\n${cmd.bodyCode}\n}`;
    }
    case 'declareConst':
      return `const ${cmd.name} = ${cmd.expr};`;
    case 'classListToggle': {
      const tgt = renderElementTarget(cmd.target);
      return cmd.force === undefined
        ? `${tgt}.classList.toggle(${quote(cmd.name)});`
        : `${tgt}.classList.toggle(${quote(cmd.name)}, ${cmd.force});`;
    }
    case 'classListAdd': {
      const tgt = renderElementTarget(cmd.target);
      return `${tgt}.classList.add(${quote(cmd.name)});`;
    }
    case 'classListRemove': {
      const tgt = renderElementTarget(cmd.target);
      return `${tgt}.classList.remove(${quote(cmd.name)});`;
    }
    case 'setProp': {
      const tgt = renderElementTarget(cmd.target);
      return `${tgt}.${cmd.prop} = ${cmd.expr};`;
    }
    case 'setStyle': {
      const tgt = renderElementTarget(cmd.target);
      return `${tgt}.style.${cmd.key} = ${cmd.expr};`;
    }
    case 'appendChild': {
      const parentExpr = renderElementTarget(cmd.parent);
      const childExpr = renderElementTarget(cmd.child);
      return `${parentExpr}.appendChild(${childExpr});`;
    }
    case 'remove': {
      const tgt = renderElementTarget(cmd.target);
      return `${tgt}.remove();`;
    }
    case 'forEach':
      return `${cmd.listExpr}.forEach((${cmd.itemVar}) => {\n${cmd.bodyCode}\n});`;
    case 'if':
      return cmd.elseCode === undefined
        ? `if (${cmd.condition}) {\n${cmd.thenCode}\n}`
        : `if (${cmd.condition}) {\n${cmd.thenCode}\n} else {\n${cmd.elseCode}\n}`;
    case 'expr':
      return `${cmd.code};`;
    case 'raw':
      return cmd.code;
    // ── reactive-state 拡張種別（Req 1.2, 2.2, 4.1–4.7） ────────────────
    case 'state-init':
      return `__draftole__.initState(${quote(cmd.id)}, ${cmd.initial.code});`;
    case 'state-set':
      return `__draftole__.state(${quote(cmd.id)}).set(${cmd.value.code});`;
    case 'state-update':
      return `__draftole__.state(${quote(cmd.id)}).update(${cmd.body.code});`;
    case 'bind-text': {
      const tgt = renderElementTarget(cmd.target);
      return cmd.transform === undefined
        ? `__draftole__.bindText(${tgt}, ${quote(cmd.stateId)});`
        : `__draftole__.bindText(${tgt}, ${quote(cmd.stateId)}, ${cmd.transform.code});`;
    }
    case 'bind-value': {
      const tgt = renderElementTarget(cmd.target);
      return cmd.transform === undefined
        ? `__draftole__.bindValue(${tgt}, ${quote(cmd.stateId)});`
        : `__draftole__.bindValue(${tgt}, ${quote(cmd.stateId)}, ${cmd.transform.code});`;
    }
    case 'bind-checked': {
      const tgt = renderElementTarget(cmd.target);
      return cmd.transform === undefined
        ? `__draftole__.bindChecked(${tgt}, ${quote(cmd.stateId)});`
        : `__draftole__.bindChecked(${tgt}, ${quote(cmd.stateId)}, ${cmd.transform.code});`;
    }
    case 'bind-class-all': {
      const tgt = renderElementTarget(cmd.target);
      return cmd.transform === undefined
        ? `__draftole__.bindClassAll(${tgt}, ${quote(cmd.stateId)});`
        : `__draftole__.bindClassAll(${tgt}, ${quote(cmd.stateId)}, ${cmd.transform.code});`;
    }
    case 'bind-class-add': {
      const tgt = renderElementTarget(cmd.target);
      return cmd.transform === undefined
        ? `__draftole__.bindClassAdd(${tgt}, ${quote(cmd.stateId)});`
        : `__draftole__.bindClassAdd(${tgt}, ${quote(cmd.stateId)}, ${cmd.transform.code});`;
    }
    case 'bind-style': {
      const tgt = renderElementTarget(cmd.target);
      return cmd.transform === undefined
        ? `__draftole__.bindStyle(${tgt}, ${quote(cmd.prop)}, ${quote(cmd.stateId)});`
        : `__draftole__.bindStyle(${tgt}, ${quote(cmd.prop)}, ${quote(cmd.stateId)}, ${cmd.transform.code});`;
    }
    case 'bind-attr': {
      const tgt = renderElementTarget(cmd.target);
      return cmd.transform === undefined
        ? `__draftole__.bindAttr(${tgt}, ${quote(cmd.attr)}, ${quote(cmd.stateId)});`
        : `__draftole__.bindAttr(${tgt}, ${quote(cmd.attr)}, ${quote(cmd.stateId)}, ${cmd.transform.code});`;
    }
    case 'bind-each': {
      const tgt = renderElementTarget(cmd.target);
      // 6.1: closure 形式 factory（buildFactoryCode 出力）が snapshot に
      // セットされている場合はそれを使用する。
      // 後方互換のため、未セット時は旧プレースホルダを出力する。
      const factory = cmd.template.factoryCode
        ?? `function(itemId, idx) { /* template: ${cmd.template.itemStateIdPattern} */ }`;
      return `__draftole__.bindEach(${tgt}, ${quote(cmd.stateId)}, ${factory});`;
    }
    case 'derive-state':
      return `__draftole__.state(${quote(cmd.sourceId)}).subscribe(function(_v) { __draftole__.state(${quote(cmd.derivedId)}).set((${cmd.transformBody.code})(_v)); });`;
    case 'handler-body': {
      const tgt = renderElementTarget(cmd.target);
      return `${tgt}.addEventListener(${quote(cmd.event)}, function(${cmd.params.join(', ')}) { ${cmd.code} });`;
    }
    default: {
      // 命令種別の追加漏れを TypeScript コンパイル時に検知するための exhaustive check。
      const _exhaustive: never = cmd;
      void _exhaustive;
      throw new Error(
        `renderCommand: unknown command type: ${JSON.stringify(cmd satisfies never)}`,
      );
    }
  }
}

/**
 * 命令配列を `indent` を各行に付与して直列化する純関数。
 * 各命令の `renderCommand` 出力（複数行含む）を行単位で分割し、先頭に `indent` を付与する。
 * コマンド間は改行で結合する。空配列の場合は空文字を返す。
 */
export function renderCommands(cmds: readonly VanillaCommand[], indent: string): string {
  if (cmds.length === 0) return '';
  const lines: string[] = [];
  for (const cmd of cmds) {
    const rendered = renderCommand(cmd);
    for (const line of rendered.split('\n')) {
      // 空行はそのまま保持する（インデントだけを残さない）。
      lines.push(line.length === 0 ? '' : `${indent}${line}`);
    }
  }
  return lines.join('\n');
}
