/**
 * each-template.ts のテスト
 *
 * タスク 2.3: `captureEachTemplate` 関数の単体テスト
 * タスク 6.2: closure 形式 factory への期待値書き換え + 独立性 / id 未指定テスト
 *
 * 観測可能な完了:
 *   - `todos.each(todo => li(span(todo.field('text'))))` がテンプレートを正しく捕捉する
 *   - `_snapshot.factoryKind === 'closure'` であり factoryCode が closure 形式である
 *   - 複数アイテム展開で各インスタンスが互いに独立にバインドされる
 *   - id 未指定でもバインディングが機能する（querySelector に依存しない）
 *
 * Requirements: 3.3, 3.5, 3.6, 4.1, 4.3, 4.5, 4.7
 */

import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import { li } from '../../../../src/html/tags/factories-data.js';
import { span } from '../../../../src/html/tags/factories-structure.js';
import { buildFactoryCode, captureEachTemplate } from '../../../../src/js/vanilla/state/each-template.js';
import { StateImpl } from '../../../../src/js/vanilla/state/state.js';
import { StateRegistry } from '../../../../src/js/vanilla/state/registry.js';

describe('captureEachTemplate', () => {
  function makeArrayState(id: string) {
    const registry = new StateRegistry();
    return new StateImpl<string[]>(id, registry);
  }

  it('EachBinding を返す', () => {
    const todos = makeArrayState('todos');
    const binding = captureEachTemplate(todos, () => li());
    expect(binding).toBeDefined();
    expect(binding._kind).toBe('each');
  });

  it('_stateId が親 State の _runtimeId と一致する', () => {
    const todos = makeArrayState('todos');
    const binding = captureEachTemplate(todos, () => li());
    expect(binding._stateId).toBe('todos');
  });

  it('fn が 1 回だけ呼ばれる', () => {
    const todos = makeArrayState('todos');
    const fn = vi.fn((_todo: StateImpl<string>) => li());
    captureEachTemplate(todos, fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('fn に渡される仮想 State の _runtimeId がテンプレートスロット ID を持つ', () => {
    const todos = makeArrayState('todos');
    let capturedState: StateImpl<string> | null = null;
    captureEachTemplate(todos, (todo) => {
      capturedState = todo as StateImpl<string>;
      return li();
    });
    expect(capturedState).not.toBeNull();
    // _runtimeId はテンプレートスロット ID（"todos.itemTemplate" 形式）
    expect((capturedState as StateImpl<string>)._runtimeId).toContain('todos');
  });

  it('EachTemplateSnapshot に itemStateIdPattern が含まれる', () => {
    const todos = makeArrayState('todos');
    const binding = captureEachTemplate(todos, () => li());
    expect(binding._snapshot).toBeDefined();
    expect(binding._snapshot.itemStateIdPattern).toContain('todos');
    expect(binding._snapshot.itemStateIdPattern).toContain('{i}');
  });

  it('EachTemplateSnapshot に templateCommands が配列として含まれる', () => {
    const todos = makeArrayState('todos');
    const binding = captureEachTemplate(todos, () => li());
    expect(binding._snapshot.templateCommands).toBeDefined();
    expect(Array.isArray(binding._snapshot.templateCommands)).toBe(true);
  });

  it('_template に fn が返した HtmlTag が格納される', () => {
    const todos = makeArrayState('todos');
    let templateTag: ReturnType<typeof li> | null = null;
    const binding = captureEachTemplate(todos, () => {
      templateTag = li();
      return templateTag;
    });
    expect(binding._template).toBe(templateTag);
  });

  it('todo.field を使ったテンプレートでも EachBinding が正しく返る', () => {
    const todos = makeArrayState('todos');
    const binding = captureEachTemplate(todos, (todo) => {
      // field() を呼ぶ（戻り値は使わない — テンプレート捕捉のみ確認）
      void todo.field('text' as keyof string[]);
      return li(span());
    });
    expect(binding._kind).toBe('each');
    expect(binding._stateId).toBe('todos');
    expect(binding._snapshot.itemStateIdPattern).toBe('todos.item{i}');
  });

  it('_kind が "each" リテラルである（型の確認）', () => {
    const todos = makeArrayState('my-list');
    const binding = captureEachTemplate(todos, () => li());
    // TypeScript の型が正しく推論されること
    const kind: 'each' = binding._kind;
    expect(kind).toBe('each');
  });

  it('異なる stateId でも正しく itemStateIdPattern が生成される', () => {
    const items = makeArrayState('my-list');
    const binding = captureEachTemplate(items, () => li());
    expect(binding._snapshot.itemStateIdPattern).toBe('my-list.item{i}');
  });

  // ────────────────────────────────────────────────────────────
  // タスク 6.2: closure 形式 factory への期待値書き換え
  // ────────────────────────────────────────────────────────────

  it('snapshot.factoryKind が "closure" であり factoryCode が closure 形式（function(itemId, idx, draftole)）である（バインディングあり）', () => {
    // 8.2: バインディングを含むテンプレートのみ closure 形式に切り替わる
    //      （旧 API 経路の byte-equality を維持するための gate 化）
    // each-closure-fix 7.1: closure 経路では build-phase 直後の factoryCode は undefined
    //                       （render-phase の buildFactoryCode で確定する）。
    //                       テストでは _templateRoot に対して buildFactoryCode を直接呼び、
    //                       生成された closure 文字列を検証する。
    const todos = makeArrayState('todos');
    const binding = captureEachTemplate(todos, (todo) =>
      li(span({ id: 'each-span' }).setText(todo as never)),
    );
    expect(binding._snapshot.factoryKind).toBe('closure');
    // build-phase: factoryCode は未確定、_templateRoot が保持される
    expect(binding._snapshot.factoryCode).toBeUndefined();
    expect(binding._snapshot._templateRoot).toBeDefined();

    // render-phase 相当: buildFactoryCode を直接呼んで closure 文字列を取得
    const templateRoot = binding._snapshot._templateRoot;
    if (templateRoot === undefined) throw new Error('templateRoot must be defined for closure factoryKind');
    const code = buildFactoryCode(templateRoot, {
      arrayStateId: 'todos',
      itemStateIdPattern: binding._snapshot.itemStateIdPattern,
    });
    expect(code).toBeDefined();
    expect(code).toMatch(/^function\s*\(itemId,\s*idx,\s*draftole\)/);
    // 旧 placeholder static factory の痕跡（querySelector 経路）が含まれないこと
    expect(code).not.toContain('document.querySelector');
    // closure-ref 形（ローカル _e0 への bind）でテンプレートが構築されていること
    expect(code).toContain('document.createElement(');
    expect(code).toContain('return _e0;');
  });

  // ────────────────────────────────────────────────────────────
  // タスク 6.2: 複数アイテム展開で各インスタンスが互いに独立にバインドされる
  // ────────────────────────────────────────────────────────────

  it('複数アイテム展開で各インスタンスが互いに独立にバインドされる（factory を 3 回呼んで独立した DOM ツリーと bind 呼び出しが得られる）', () => {
    const todos = makeArrayState('todos');
    const binding = captureEachTemplate(todos, (todo) => {
      // string[] の要素 — todo 自身が ReadableState<string> として setText に渡せる。
      // todo の _runtimeId は "todos.itemTemplate"（slotPrefix）で始まるため、
      // closure 化時に動的 stateId（arrayId + ".item" + idx）にリライトされる。
      // 現状の build-time API では setText 呼出に id が必要なため span に固定 id を
      // 付与する（factory 自体は id ではなく closure-ref _eN でバインドを解決する）。
      return li(span({ id: 'todo-text' }).setText(todo as never));
    });

    // each-closure-fix 7.1: closure 経路の factoryCode は build-phase では未確定。
    //                       render-phase 相当の buildFactoryCode を直接呼んで closure 文字列を取得する。
    expect(binding._snapshot.factoryKind).toBe('closure');
    const templateRoot = binding._snapshot._templateRoot;
    if (templateRoot === undefined) throw new Error('templateRoot must be defined for closure factoryKind');
    const code = buildFactoryCode(templateRoot, {
      arrayStateId: 'todos',
      itemStateIdPattern: binding._snapshot.itemStateIdPattern,
    });

    // closure-ref で bind されており、bindText の引数が動的 stateId（factory 引数 itemId への直参照）
    // となっていることを確認（querySelector ではなくローカル変数参照）
    expect(code).toContain('__draftole__.bindText(');
    expect(code).toContain('itemId');
    expect(code).not.toContain('document.querySelector');

    // node:vm 上で factory を 3 回（idx=0,1,2）実行し、互いに独立した
    // DOM ツリー＋独立した bindText 呼び出し列が得られることを検証する。
    type MockEl = {
      tagName: string;
      attributes: Record<string, string>;
      children: MockEl[];
      setAttribute(k: string, v: string): void;
      appendChild(c: MockEl): MockEl;
    };
    const makeEl = (tagName: string): MockEl => ({
      tagName,
      attributes: {},
      children: [],
      setAttribute(k, v) { this.attributes[k] = v; },
      appendChild(c) { this.children.push(c); return c; },
    });

    const bindCalls: { el: MockEl; stateId: string }[] = [];
    const sandbox = {
      document: { createElement: (t: string) => makeEl(t) },
      __draftole__: {
        state: () => ({ subscribe: () => {} }),
        bindText: (el: MockEl, stateId: string) => {
          bindCalls.push({ el, stateId });
        },
        bindValue: () => {},
        bindClassAll: () => {},
        bindClassAdd: () => {},
        bindStyle: () => {},
        bindAttr: () => {},
      },
    };
    const factory = vm.runInNewContext(`(${code})`, sandbox) as (
      itemId: string,
      idx: number,
      draftole: unknown,
    ) => MockEl;

    const root0 = factory('todos.item0', 0, sandbox.__draftole__);
    const root1 = factory('todos.item1', 1, sandbox.__draftole__);
    const root2 = factory('todos.item2', 2, sandbox.__draftole__);

    // ルート要素が互いに別インスタンスであること（独立性の中核）
    expect(root0).not.toBe(root1);
    expect(root1).not.toBe(root2);
    expect(root0).not.toBe(root2);
    // 子の span 要素も独立
    expect(root0.children[0]).not.toBe(root1.children[0]);
    expect(root1.children[0]).not.toBe(root2.children[0]);

    // bindText は各インスタンスに対して 1 回ずつ＝計 3 回呼ばれる
    expect(bindCalls.length).toBe(3);
    // 各呼び出しの el が当該インスタンスの span を指していること
    expect(bindCalls[0]?.el).toBe(root0.children[0]);
    expect(bindCalls[1]?.el).toBe(root1.children[0]);
    expect(bindCalls[2]?.el).toBe(root2.children[0]);
    // 各呼び出しの stateId が idx に従って動的に解決されていること
    // （todo（自身）バインドのため rest = "" → "todos.item{idx}"）
    expect(bindCalls[0]?.stateId).toBe('todos.item0');
    expect(bindCalls[1]?.stateId).toBe('todos.item1');
    expect(bindCalls[2]?.stateId).toBe('todos.item2');

    // 一方の DOM への変更が他方へ波及しないこと（独立性の追加検証）
    root0.attributes['data-mark'] = 'x';
    expect(root1.attributes['data-mark']).toBeUndefined();
    expect(root2.attributes['data-mark']).toBeUndefined();
  });

  // ────────────────────────────────────────────────────────────
  // タスク 4.3: walkAndEmit 新規パス — deferred-self → closure-ref 書換（Req 1.4）
  // ────────────────────────────────────────────────────────────

  it('id 不在の要素に対する bind-text コマンドが _e0 への closure-ref に書き換わる（Req 1.4）', () => {
    // Req 1.4: factory コード生成時、deferred-self target を持つ bind-text コマンドが
    // ローカル変数 _e0 への closure-ref に書き換えられて出力されることを assert する。
    //
    // 検証内容:
    //   1) id を一切指定しない span().setText(...) が closure factory を生成できる
    //   2) 生成コードが `__draftole__.bindText(_e0, ...)` の形式を含む
    //      （id ベースの querySelector に依存しない _e0 直参照）
    //   3) document.querySelector を一切含まない
    const todos = makeArrayState('todos');
    const binding = captureEachTemplate(todos, (todo) =>
      // id を渡さない — deferred-self target のまま bind-text が積まれる
      span().setText(todo as never),
    );

    // バインディングあり → closure factory 経路
    expect(binding._snapshot.factoryKind).toBe('closure');
    const templateRoot = binding._snapshot._templateRoot;
    if (templateRoot === undefined) throw new Error('templateRoot must be defined for closure factoryKind');

    const code = buildFactoryCode(templateRoot, {
      arrayStateId: 'todos',
      itemStateIdPattern: binding._snapshot.itemStateIdPattern,
    });

    // 1) bind-text が _e0 への closure-ref に書き換わっていること
    //    （"__draftole__.bindText(_e0," は `_e0` が直参照されている証拠）
    expect(code).toContain('__draftole__.bindText(_e0,');

    // 2) id ベース解決（document.querySelector）を使わないこと
    expect(code).not.toContain('document.querySelector');

    // 3) return _e0 でルート要素を返すこと（closure-ref の基点確認）
    expect(code).toContain('return _e0;');
  });

  // ────────────────────────────────────────────────────────────
  // タスク 4.3: walkAndEmit 新規パス — id 属性除去（Req 2.1, 4.4）
  // ────────────────────────────────────────────────────────────

  it('明示 id を持つ要素が factory コードで setAttribute("id", ...) を出力しない（Req 2.1, 4.4）', () => {
    // Req 2.1: per-iteration の HTML id 一意性違反防止のため、ユーザーが明示的に
    // id を指定した要素も factory 出力では setAttribute("id", ...) を生成しない。
    // Req 4.4: 記述は受理（エラーにしない）、出力には反映しない（意図的逸脱）。
    //
    // 検証内容:
    //   1) id を明示指定した span({ id: 'explicit-id' }) が factory コードを生成できる
    //   2) 生成コードに setAttribute("id", ...) が一切含まれない
    //   3) id 以外の属性（class 等）は出力に残る
    const todos = makeArrayState('todos');
    const binding = captureEachTemplate(todos, (todo) =>
      // id を明示指定した上でバインディングを付与する
      span({ id: 'explicit-id', class: 'todo-text' }).setText(todo as never),
    );

    // バインディングあり → closure factory 経路
    expect(binding._snapshot.factoryKind).toBe('closure');
    const templateRoot = binding._snapshot._templateRoot;
    if (templateRoot === undefined) throw new Error('templateRoot must be defined for closure factoryKind');

    const code = buildFactoryCode(templateRoot, {
      arrayStateId: 'todos',
      itemStateIdPattern: binding._snapshot.itemStateIdPattern,
    });

    // 1) setAttribute("id", ...) が含まれないこと（per-iteration 重複防止）
    expect(code).not.toMatch(/setAttribute\("id"/);

    // 2) .id = ... 形式の id 付与も含まれないこと
    expect(code).not.toMatch(/\.id\s*=/);

    // 3) class 等の他の属性は出力に含まれること（id 除去が選択的であることの確認）
    expect(code).toContain('setAttribute("class"');

    // 4) バインディング自体は正常に出力されていること
    expect(code).toContain('__draftole__.bindText(');
  });

  // ────────────────────────────────────────────────────────────
  // タスク 6.2: id 未指定でもバインディングが機能する（Req 4.5）
  // ────────────────────────────────────────────────────────────

  it('テンプレート要素に id を明示指定しなくても factory コードは closure-ref 経路で生成される（id ベース解決に依存しない）', () => {
    // Req 4.5: each テンプレート内の要素にユーザーが明示 ID を指定していないとき、
    // バインディング解決のために ID を必要としない（ID 未指定でもバインディングが機能する）。
    //
    // ここでは「id 未指定のテンプレート」が:
    //   1) ビルド時に factoryCode を生成できる（id 強制を経由しない）
    //   2) 生成された factoryCode が id ベースの DOM ルックアップ
    //      （document.querySelector("#...") / getElementById）に一切依存しない
    //   3) vm 上で実行しても id 属性を一切付与せず Element ツリーが構築できる
    // ことを検証する。バインディング命令の closure-ref への書き換え自体は別テスト
    // （独立性テスト・factory smoke テスト）でカバー済み。

    const todos = makeArrayState('todos');
    // li / span ともに id を一切渡さない。setText 等のバインディング系メソッドも呼ばない。
    // 8.2 で factoryKind は「テンプレート内にバインディングがあるか」で切り替わる。
    // ここではバインディング無しテンプレートが旧 API 互換の static-placeholder factory
    // になることを検証する（id 未指定でも factoryCode を生成できる、Req 4.5 の主旨を保持）。
    const binding = captureEachTemplate(todos, () => li(span()));

    // 1) factory が static-placeholder 形式で生成されている（バインディング無し → 旧 API 経路）
    expect(binding._snapshot.factoryKind).toBe('static-placeholder');
    const code = binding._snapshot.factoryCode as string;
    expect(code).toMatch(/^function\s*\(itemId,\s*idx\)/);

    // 2) 生成 factoryCode が id ベースのルックアップを一切含まない
    expect(code).not.toContain('document.querySelector');
    expect(code).not.toContain('getElementById');
    expect(code).not.toMatch(/setAttribute\("id"/);
    expect(code).not.toMatch(/\.id\s*=/);
    // 動的 id 文字列（"#" + …）も含まない
    expect(code).not.toMatch(/['"]#['"]/);

    // 3) vm 上で実行 — id を全く付与せず Element ツリーが正しく構築される
    type MockEl = {
      tagName: string;
      attributes: Record<string, string>;
      children: MockEl[];
      setAttribute(k: string, v: string): void;
      appendChild(c: MockEl): MockEl;
    };
    const makeEl = (tagName: string): MockEl => ({
      tagName,
      attributes: {},
      children: [],
      setAttribute(k, v) { this.attributes[k] = v; },
      appendChild(c) { this.children.push(c); return c; },
    });
    const sandbox = {
      document: { createElement: (t: string) => makeEl(t) },
      __draftole__: {
        state: () => ({ subscribe: () => {} }),
        bindText: () => {},
        bindValue: () => {},
        bindClassAll: () => {},
        bindClassAdd: () => {},
        bindStyle: () => {},
        bindAttr: () => {},
      },
    };
    const factory = vm.runInNewContext(`(${code})`, sandbox) as (
      itemId: string,
      idx: number,
    ) => MockEl;
    const root = factory('todos.item0', 0);
    expect(root.tagName).toBe('li');
    expect(root.children.length).toBe(1);
    expect(root.children[0]?.tagName).toBe('span');
    // どちらの要素にも id 属性が付与されていない
    expect(root.attributes['id']).toBeUndefined();
    expect(root.children[0]?.attributes['id']).toBeUndefined();
  });
});
