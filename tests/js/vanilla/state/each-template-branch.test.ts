/**
 * each-template.ts 分岐網羅補完テスト
 *
 * Task 5.2 (global-branch-90-percent): EachTemplateTests
 * 既存 `each-template*.test.ts` で未到達の分岐を補完する単体テスト。
 *
 * 観測条件:
 *   - `src/js/vanilla/state/each-template.ts` の branch カバレッジを 67.88% → ≥90% に引き上げる
 *
 * 対象分岐:
 *   1. closure-vs-static-placeholder factory decision (line 109-125) — hasBindings 両側
 *   2. `walkAndEmit` の appendChild スキップ (line 294)
 *   3. `rewriteCommandTarget` guard paths (line 444-446) — target を持たない command の早期 return
 *   4. `buildRawBindCommand` switch 全 case + transform 有無 (line 500-540):
 *      - bind-class-all / bind-class-add (transform 有/無)
 *      - bind-style / bind-attr (transform 有/無)
 *      - default fallthrough (bind-each)
 *   5. `buildStaticFactoryCode` の boolean / custom 属性経路 (line 403-409)
 *   6. `buildStaticFactoryCode` の non-class non-id キー (line 400-402)
 *
 * Requirements: 2.2 (global-branch-90-percent)
 * Boundary: EachTemplateTests
 */

import { describe, expect, it } from 'vitest';
import { HtmlAttribute } from '../../../../src/html/attributes/html-attribute.js';
import { li } from '../../../../src/html/tags/factories-data.js';
import { span } from '../../../../src/html/tags/factories-structure.js';
import {
  buildFactoryCode,
  captureEachTemplate,
} from '../../../../src/js/vanilla/state/each-template.js';
import { StateRegistry } from '../../../../src/js/vanilla/state/registry.js';
import { StateImpl } from '../../../../src/js/vanilla/state/state.js';

describe('each-template.ts — branch coverage 補完 (Task 5.2)', () => {
  // ────────────────────────────────────────────────────────────
  // 1. closure-vs-static-placeholder factory decision (line 109-125)
  //    hasBindings の true / false 両分岐を観測する
  // ────────────────────────────────────────────────────────────

  describe('1. closure-vs-static-placeholder factory decision (line 109-125)', () => {
    it('1-a: バインディング有りテンプレートは closure factory に分岐する (hasBindings === true)', () => {
      const registry = new StateRegistry();
      const todos = new StateImpl<string[]>('todos', registry);
      // _pending に bind-text を持つテンプレート（バインディング有り）
      const binding = captureEachTemplate(todos, (item) => {
        const tag = li();
        tag._pending.push({
          type: 'bind-text',
          target: { kind: 'deferred-self' },
          stateId: (item as { _runtimeId: string })._runtimeId,
        });
        return tag;
      });
      // closure 経路: factoryCode undefined, _templateRoot 保持
      expect(binding._snapshot.factoryKind).toBe('closure');
      expect(binding._snapshot.factoryCode).toBeUndefined();
      expect(binding._snapshot._templateRoot).toBeDefined();
    });

    it('1-b: バインディング無しテンプレートは static-placeholder factory に分岐する (hasBindings === false)', () => {
      const registry = new StateRegistry();
      const todos = new StateImpl<string[]>('todos', registry);
      const binding = captureEachTemplate(todos, () => li(span()));
      expect(binding._snapshot.factoryKind).toBe('static-placeholder');
      expect(typeof binding._snapshot.factoryCode).toBe('string');
      expect(binding._snapshot._templateRoot).toBeUndefined();
    });
  });

  // ────────────────────────────────────────────────────────────
  // 2. walkAndEmit の appendChild スキップ (line 294)
  //    _pending に appendChild 命令が含まれているとき continue で飛ばされる
  // ────────────────────────────────────────────────────────────

  describe('2. walkAndEmit appendChild スキップ (line 294)', () => {
    it('2-a: _pending に紛れた appendChild コマンドは factory コード出力からスキップされる', () => {
      const tag = li();
      // 通常 appendChild は children 経路で扱われるが、_pending に存在しても
      // walkAndEmit がスキップする経路を直接観測する。
      tag._pending.push({
        type: 'appendChild',
        parent: { kind: 'closure-ref', varName: '_e0' },
        child: { kind: 'closure-ref', varName: '_e1' },
      });
      // バインディング命令も並べて、appendChild だけスキップされたことを観測しやすくする。
      tag._pending.push({
        type: 'bind-text',
        target: { kind: 'deferred-self' },
        stateId: 'todos.itemTemplate',
      });

      const code = buildFactoryCode(tag, {
        arrayStateId: 'todos',
        itemStateIdPattern: 'todos.item{i}',
      });

      // bind-text 由来の bindText 呼び出しは出力に含まれる
      expect(code).toContain('__draftole__.bindText(_e0,');
      // 一方、_pending 由来の appendChild は出力されない（直接 _e0.appendChild(_e1) を呼ぶ行が無い）。
      // step 4 の root-skip ロジックにより親無しなら appendChild 行が出ない=root only。
      expect(code).not.toMatch(/_e0\.appendChild\(_e1\)/);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 3. rewriteCommandTarget guard paths (line 444-446)
  //    target を持たない command は早期 return される
  // ────────────────────────────────────────────────────────────

  describe('3. rewriteCommandTarget guard paths (line 444-446)', () => {
    it('3-a: target プロパティを持たない command (declareConst) はそのまま renderCommand に流される', () => {
      const tag = li();
      // declareConst には target プロパティが無い → guard で早期 return される
      tag._pending.push({
        type: 'declareConst',
        name: '_foo',
        expr: '42',
      });
      const code = buildFactoryCode(tag, {
        arrayStateId: 'todos',
        itemStateIdPattern: 'todos.item{i}',
      });
      // declareConst が renderCommand により `const _foo = 42;` として出力される（書き換えなし）
      expect(code).toContain('const _foo = 42;');
    });

    it('3-b: target を持つが stateId を持たない command は target のみ書き換えて返される', () => {
      // setStyle は target を持つが stateId を持たない（hasStateId === false 分岐）。
      const tag = li();
      tag._pending.push({
        type: 'setStyle',
        target: { kind: 'deferred-self' },
        key: 'color',
        expr: '"red"',
      });
      const code = buildFactoryCode(tag, {
        arrayStateId: 'todos',
        itemStateIdPattern: 'todos.item{i}',
      });
      // _e0.style への代入が出力される（書き換え後の closure-ref として）
      expect(code).toContain('_e0.style');
      expect(code).not.toContain('document.querySelector');
    });

    it('3-c: stateId を持つが slotPrefix に該当しない command はリテラルのまま target のみ書き換え', () => {
      // 非スロット state（slotPrefix = "todos.itemTemplate" に該当しない）
      const tag = li();
      tag._pending.push({
        type: 'bind-text',
        target: { kind: 'deferred-self' },
        stateId: 'globalSettings.title', // slotPrefix に該当しない
      });
      const code = buildFactoryCode(tag, {
        arrayStateId: 'todos',
        itemStateIdPattern: 'todos.item{i}',
      });
      // stateId がリテラル文字列のまま渡される（書き換え無し）
      expect(code).toContain('"globalSettings.title"');
      // 動的 itemId 連結式に書き換えられていない
      expect(code).not.toMatch(/bindText\(_e0,\s*itemId/);
    });
  });

  // ────────────────────────────────────────────────────────────
  // 4. buildRawBindCommand 全 switch case (line 500-540)
  //    bind-class-all / bind-class-add / bind-style / bind-attr ＋ default
  //    各 case の transform 有/無の両分岐を確認する
  // ────────────────────────────────────────────────────────────

  describe('4. buildRawBindCommand 全 switch case (line 500-540)', () => {
    it('4-a: bind-class-all (transform なし) → bindClassAll 呼び出し', () => {
      const tag = li();
      tag._pending.push({
        type: 'bind-class-all',
        target: { kind: 'closure-ref', varName: '_e0' },
        stateId: 'todos.itemTemplate',
      });
      const code = buildFactoryCode(tag, {
        arrayStateId: 'todos',
        itemStateIdPattern: 'todos.item{i}',
      });
      expect(code).toContain('__draftole__.bindClassAll(_e0, itemId);');
    });

    it('4-b: bind-class-all (transform あり) → bindClassAll の第3引数に transform', () => {
      const tag = li();
      tag._pending.push({
        type: 'bind-class-all',
        target: { kind: 'closure-ref', varName: '_e0' },
        stateId: 'todos.itemTemplate',
        transform: { code: 'function(v){return v.toUpperCase();}' },
      });
      const code = buildFactoryCode(tag, {
        arrayStateId: 'todos',
        itemStateIdPattern: 'todos.item{i}',
      });
      expect(code).toMatch(/bindClassAll\(_e0,\s*itemId,\s*function\(v\)/);
      expect(code).toContain('v.toUpperCase()');
    });

    it('4-c: bind-class-add (transform なし) → bindClassAdd 呼び出し', () => {
      const tag = li();
      tag._pending.push({
        type: 'bind-class-add',
        target: { kind: 'closure-ref', varName: '_e0' },
        stateId: 'todos.itemTemplate',
      });
      const code = buildFactoryCode(tag, {
        arrayStateId: 'todos',
        itemStateIdPattern: 'todos.item{i}',
      });
      expect(code).toContain('__draftole__.bindClassAdd(_e0, itemId);');
    });

    it('4-d: bind-class-add (transform あり) → bindClassAdd の第3引数に transform', () => {
      const tag = li();
      tag._pending.push({
        type: 'bind-class-add',
        target: { kind: 'closure-ref', varName: '_e0' },
        stateId: 'todos.itemTemplate',
        transform: { code: 'function(v){return "x-" + v;}' },
      });
      const code = buildFactoryCode(tag, {
        arrayStateId: 'todos',
        itemStateIdPattern: 'todos.item{i}',
      });
      expect(code).toMatch(/bindClassAdd\(_e0,\s*itemId,\s*function\(v\)/);
    });

    it('4-e: bind-style (transform なし) → bindStyle に prop と stateId', () => {
      const tag = li();
      tag._pending.push({
        type: 'bind-style',
        target: { kind: 'closure-ref', varName: '_e0' },
        prop: 'color',
        stateId: 'todos.itemTemplate',
      });
      const code = buildFactoryCode(tag, {
        arrayStateId: 'todos',
        itemStateIdPattern: 'todos.item{i}',
      });
      expect(code).toContain('__draftole__.bindStyle(_e0, "color", itemId);');
    });

    it('4-f: bind-style (transform あり) → bindStyle に prop, stateId, transform', () => {
      const tag = li();
      tag._pending.push({
        type: 'bind-style',
        target: { kind: 'closure-ref', varName: '_e0' },
        prop: 'background-color',
        stateId: 'todos.itemTemplate',
        transform: { code: 'function(v){return v;}' },
      });
      const code = buildFactoryCode(tag, {
        arrayStateId: 'todos',
        itemStateIdPattern: 'todos.item{i}',
      });
      expect(code).toMatch(
        /bindStyle\(_e0,\s*"background-color",\s*itemId,\s*function\(v\)/,
      );
    });

    it('4-g: bind-attr (transform なし) → bindAttr に attr と stateId', () => {
      const tag = li();
      tag._pending.push({
        type: 'bind-attr',
        target: { kind: 'closure-ref', varName: '_e0' },
        attr: 'title',
        stateId: 'todos.itemTemplate',
      });
      const code = buildFactoryCode(tag, {
        arrayStateId: 'todos',
        itemStateIdPattern: 'todos.item{i}',
      });
      expect(code).toContain('__draftole__.bindAttr(_e0, "title", itemId);');
    });

    it('4-h: bind-attr (transform あり) → bindAttr に attr, stateId, transform', () => {
      const tag = li();
      tag._pending.push({
        type: 'bind-attr',
        target: { kind: 'closure-ref', varName: '_e0' },
        attr: 'aria-label',
        stateId: 'todos.itemTemplate',
        transform: { code: 'function(v){return String(v);}' },
      });
      const code = buildFactoryCode(tag, {
        arrayStateId: 'todos',
        itemStateIdPattern: 'todos.item{i}',
      });
      expect(code).toMatch(
        /bindAttr\(_e0,\s*"aria-label",\s*itemId,\s*function\(v\)/,
      );
    });

    it('4-i: default fallthrough (bind-each など switch 外の型) は target だけ書き換えてフォールバックする', () => {
      // bind-each は switch 外なので default 経路に落ちる。
      // buildRawBindCommand の default は `{ ...cmd, target: { kind: 'closure-ref', varName } }` を返す。
      const tag = li();
      tag._pending.push({
        type: 'bind-each',
        target: { kind: 'deferred-self' },
        stateId: 'todos.itemTemplate',
        template: {
          itemStateIdPattern: 'todos.itemTemplate.item{i}',
          templateCommands: [],
        },
      });
      // エラーなく factory コードが生成される（renderCommand が bind-each を扱える）。
      const code = buildFactoryCode(tag, {
        arrayStateId: 'todos',
        itemStateIdPattern: 'todos.item{i}',
      });
      // bind-each は raw コマンドに変換されず、{ ...cmd, target: closure-ref } として
      // renderCommand に渡されるため bindEach 由来の出力（または対応 helper 呼び出し）を含む
      expect(typeof code).toBe('string');
      // querySelector に依存しないこと
      expect(code).not.toContain('document.querySelector');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 5. buildStaticFactoryCode の non-class non-id key / boolean / custom 属性
  //    (line 400-409) 静的 placeholder factory の属性分岐網羅
  // ────────────────────────────────────────────────────────────

  describe('5. buildStaticFactoryCode 属性分岐 (line 400-409)', () => {
    it('5-a: keyValue で class/id 以外のキー (例: data-foo) は setAttribute 出力', () => {
      // data-foo は HtmlAttribute.keyValue 経由で keyValue 属性として登録される（type === 'keyValue'）。
      // 旧 API 経路（バインディング無し）で静的 factory が生成される。
      const tag = li();
      tag.addHtmlAttribute(HtmlAttribute.keyValue('title' as never, 'tooltip'));
      const registry = new StateRegistry();
      const todos = new StateImpl<string[]>('todos', registry);
      const binding = captureEachTemplate(todos, () => tag);
      expect(binding._snapshot.factoryKind).toBe('static-placeholder');
      const code = binding._snapshot.factoryCode as string;
      // class/id 以外の key は setAttribute 行として出力される（line 401-402）
      expect(code).toContain('_root.setAttribute("title", "tooltip");');
    });

    it('5-b: boolean 属性 (例: disabled) は setAttribute(key, "") として出力', () => {
      const tag = li();
      tag.addHtmlAttribute(HtmlAttribute.boolean('disabled' as never));
      const registry = new StateRegistry();
      const todos = new StateImpl<string[]>('todos', registry);
      const binding = captureEachTemplate(todos, () => tag);
      expect(binding._snapshot.factoryKind).toBe('static-placeholder');
      const code = binding._snapshot.factoryCode as string;
      // boolean は setAttribute(key, "") として出力される（line 404）
      expect(code).toContain('_root.setAttribute("disabled", "");');
    });

    it('5-c: custom (data-*) 属性は setAttribute("data-NAME", value) として出力', () => {
      const tag = li();
      tag.addHtmlAttribute(HtmlAttribute.custom('theme', 'dark'));
      const registry = new StateRegistry();
      const todos = new StateImpl<string[]>('todos', registry);
      const binding = captureEachTemplate(todos, () => tag);
      expect(binding._snapshot.factoryKind).toBe('static-placeholder');
      const code = binding._snapshot.factoryCode as string;
      // custom は setAttribute("data-NAME", value) として出力される（line 405-408）
      expect(code).toContain('_root.setAttribute("data-theme", "dark");');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 6. emitAttributesExcludingId — boolean / custom 属性経路 (closure path)
  //    (line 241-247) closure factory 内でも boolean / custom が正しく出力される
  // ────────────────────────────────────────────────────────────

  describe('6. emitAttributesExcludingId — boolean / custom 属性経路 (closure path)', () => {
    it('6-a: closure factory 内で boolean 属性 (disabled) が setAttribute("disabled", "") として出力される', () => {
      const tag = li();
      tag.addHtmlAttribute(HtmlAttribute.boolean('disabled' as never));
      // closure 経路に入るためバインディング命令を 1 個積む
      tag._pending.push({
        type: 'bind-text',
        target: { kind: 'deferred-self' },
        stateId: 'todos.itemTemplate',
      });
      const code = buildFactoryCode(tag, {
        arrayStateId: 'todos',
        itemStateIdPattern: 'todos.item{i}',
      });
      // closure 経路の boolean 属性出力（line 241-242）
      expect(code).toContain('_e0.setAttribute("disabled", "");');
    });

    it('6-b: closure factory 内で custom (data-*) 属性が setAttribute("data-NAME", value) として出力される', () => {
      const tag = li();
      tag.addHtmlAttribute(HtmlAttribute.custom('theme', 'dark'));
      tag._pending.push({
        type: 'bind-text',
        target: { kind: 'deferred-self' },
        stateId: 'todos.itemTemplate',
      });
      const code = buildFactoryCode(tag, {
        arrayStateId: 'todos',
        itemStateIdPattern: 'todos.item{i}',
      });
      // closure 経路の custom 属性出力（line 243-247）
      expect(code).toContain('_e0.setAttribute("data-theme", "dark");');
    });
  });

  // ────────────────────────────────────────────────────────────
  // 7. walkAndEmit / templateHasBindings の `_appendedChildren` 経路
  //    (line 310-312, 346-349) — addChild ではなく appendChild 経由の子要素も
  //    factory コード出力 / バインディング検出に反映される
  // ────────────────────────────────────────────────────────────

  describe('7. _appendedChildren 経路 (line 310-312, 346-349)', () => {
    it('7-a: walkAndEmit が _appendedChildren に push された子要素も factory コードに含める', () => {
      // appendChild 経由で子要素を追加する（addChild とは別経路）。
      // 親 li の _appendedChildren に span が積まれ、walkAndEmit が
      // line 310-312 ループでその子を再帰処理する。
      const parent = li();
      const child = span();
      (parent as unknown as { appendChild: (c: unknown) => unknown }).appendChild(child);
      // closure 経路に入れるためバインディング命令を 1 個積む
      parent._pending.push({
        type: 'bind-text',
        target: { kind: 'deferred-self' },
        stateId: 'todos.itemTemplate',
      });
      const code = buildFactoryCode(parent, {
        arrayStateId: 'todos',
        itemStateIdPattern: 'todos.item{i}',
      });
      // 親 _e0 = li, 子 _e1 = span が createElement される
      expect(code).toContain('const _e0 = document.createElement("li")');
      expect(code).toContain('const _e1 = document.createElement("span")');
      // 子は appendChild で結合される
      expect(code).toContain('_e0.appendChild(_e1)');
    });

    it('7-b-no-binding: バインディング無し _appendedChildren を持つテンプレートは static-placeholder 経路に分岐する (templateHasBindings else path)', () => {
      // _appendedChildren を持つが子もバインディング無しのケース。
      // templateHasBindings 内の _appendedChildren ループで `if` 条件が false を
      // 返すケース（else path: ループ継続）を観測する。
      const registry = new StateRegistry();
      const todos = new StateImpl<string[]>('todos', registry);
      const binding = captureEachTemplate(todos, () => {
        const parent = li();
        const child1 = span();
        const child2 = span();
        // appendChild 経由（バインディング無し）
        (parent as unknown as { appendChild: (c: unknown) => unknown }).appendChild(child1);
        (parent as unknown as { appendChild: (c: unknown) => unknown }).appendChild(child2);
        return parent;
      });
      // バインディング無し → static-placeholder 経路
      expect(binding._snapshot.factoryKind).toBe('static-placeholder');
      const code = binding._snapshot.factoryCode as string;
      // _appendedChildren が静的 factory にも反映される（_root_c0 / _root_c1）
      expect(code).toContain('const _root_c0 = document.createElement("span")');
      expect(code).toContain('const _root_c1 = document.createElement("span")');
    });

    it('7-c: fn が HtmlTag 配列を返す場合も captureEachTemplate がルートを抽出する (Array.isArray ブランチ)', () => {
      // 複数 HtmlTag 配列を返すテンプレート関数。
      // captureEachTemplate 内の Array.isArray(templateTag) 判定で Array 側に分岐する。
      // 加えて extractPendingCommands の Array.isArray ブランチも観測される。
      const registry = new StateRegistry();
      const todos = new StateImpl<string[]>('todos', registry);
      const tag1 = li();
      tag1._pending.push({
        type: 'bind-text',
        target: { kind: 'deferred-self' },
        stateId: 'todos.itemTemplate',
      });
      const tag2 = span();
      const binding = captureEachTemplate(todos, () => [tag1, tag2] as const);
      // rootTag は配列の最初の要素として扱われる（バインディングを持つ tag1）
      expect(binding._snapshot.factoryKind).toBe('closure');
      // templateCommands は両 tag の _pending を結合
      expect(binding._snapshot.templateCommands.length).toBeGreaterThanOrEqual(1);
      expect(binding._snapshot._templateRoot).toBe(tag1);
    });

    it('7-b: templateHasBindings は _appendedChildren の子要素内バインディングも検出する', () => {
      // 親 li にはバインディング無し、appendChild 経由の子 span に bind-text を積む。
      // templateHasBindings が line 346-349 のループで _appendedChildren を再帰確認し、
      // 子のバインディングを検出することで closure 経路に分岐する。
      const registry = new StateRegistry();
      const todos = new StateImpl<string[]>('todos', registry);
      const binding = captureEachTemplate(todos, (item) => {
        const parent = li();
        const child = span();
        // 子 span に bind-text を直接注入（_appendedChildren 経由でしか参照されない）
        child._pending.push({
          type: 'bind-text',
          target: { kind: 'deferred-self' },
          stateId: (item as { _runtimeId: string })._runtimeId,
        });
        (parent as unknown as { appendChild: (c: unknown) => unknown }).appendChild(child);
        return parent;
      });
      // _appendedChildren 経由のバインディング検出 → closure 経路
      expect(binding._snapshot.factoryKind).toBe('closure');
      expect(binding._snapshot.factoryCode).toBeUndefined();
      expect(binding._snapshot._templateRoot).toBeDefined();
    });
  });
});
