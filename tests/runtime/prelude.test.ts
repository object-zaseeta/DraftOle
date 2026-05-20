/**
 * DraftOle Runtime Prelude - 単体テスト (Node.js + dynamic import)
 *
 * prelude.ts の IIFE を Node.js 環境に動的ロードし、
 * globalThis.__draftole__ に公開されたランタイム API を検証する。
 *
 * Req 2.4: FIFO 更新・購読者への同期通知
 * Req 2.6: バッチング（同一 microtask 内の通知を 1 回にまとめる）
 * Req 3.3: 等値変化なしなら再通知しない
 * Req 3.6: 配列要素の追加・削除・値更新（each 差分）
 * Req 5.3: グローバルに `__draftole__` のみ公開
 */

// @vitest-environment node

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// -----------------------------------------------------------------------
// 型定義
// -----------------------------------------------------------------------

interface RuntimeState<T> {
  get(): T;
  set(v: T): void;
  subscribe(fn: (v: T) => void): () => void;
}

interface DraftoleRuntime {
  initState<T>(id: string, initial: T): void;
  state<T>(id: string): RuntimeState<T>;
  bindText(el: Element, stateId: string, transform?: (t: unknown) => string): void;
  bindValue(el: Element, stateId: string, transform?: (t: unknown) => unknown): void;
  bindClassAll(el: Element, stateId: string, transform?: (t: unknown) => string): void;
  bindClassAdd(el: Element, stateId: string, transform?: (t: unknown) => string): void;
  bindStyle(el: Element, prop: string, stateId: string, transform?: (t: unknown) => string): void;
  bindChecked(el: Element, stateId: string, transform?: (t: unknown) => unknown): void;
  bindEach(
    parent: Element,
    stateId: string,
    factory: (itemId: string, idx: number) => Element
  ): void;
}

// -----------------------------------------------------------------------
// ランタイムローダー（グローバル設定 → dynamic import）
// -----------------------------------------------------------------------
// Node.js では `window` がグローバルに存在しないため、
// globalThis.window = globalThis を設定してから prelude.ts を dynamic import する。
// vitest の static import はモジュール評価前に解析されるため、
// setup は beforeAll で行い、dynamic import でロードする。

// globalThis を window プロパティ付きの型として扱うためのヘルパー
type GlobalWithWindow = typeof globalThis & {
  window: typeof globalThis;
  __draftole__: DraftoleRuntime | undefined;
};

let rt: DraftoleRuntime;

beforeAll(async () => {
  // window を globalThis に設定（prelude.ts の IIFE が window を参照するため）
  (globalThis as GlobalWithWindow).window = globalThis;

  // dynamic import で prelude.ts をロード（副作用のみ：window.__draftole__ を設定）
  await import('../../src/runtime/prelude.ts');

  // globalThis.__draftole__ から runtime を取得
  const loaded = (globalThis as GlobalWithWindow).__draftole__;
  if (loaded === undefined) {
    throw new Error('__draftole__ が設定されていません。prelude.ts のロードに失敗しました。');
  }
  rt = loaded;
});

// -----------------------------------------------------------------------
// テストヘルパー
// -----------------------------------------------------------------------

/** microtask キューを空にする（複数回の queueMicrotask を消化） */
function flushMicrotasks(): Promise<void> {
  return new Promise<void>((resolve) => {
    queueMicrotask(() => queueMicrotask(() => resolve()));
  });
}

/** 簡易 Element モック（jsdom 不使用環境用） */
interface MockElement {
  tagName: string;
  textContent: string;
  value: string;
  checked: boolean;
  className: string;
  classList: {
    _classes: Set<string>;
    add(cls: string): void;
    remove(cls: string): void;
    contains(cls: string): boolean;
  };
  style: {
    _props: Map<string, string>;
    setProperty(prop: string, val: string): void;
    getPropertyValue(prop: string): string;
  };
  _children: MockElement[];
  readonly children: { length: number; [i: number]: MockElement };
  readonly lastChild: MockElement | null;
  appendChild(child: MockElement): MockElement;
  removeChild(child: MockElement): MockElement;
}

function createMockElement(tag: string = 'div'): MockElement {
  const _children: MockElement[] = [];

  const childrenProxy = new Proxy(_children, {
    get(target, prop) {
      if (prop === 'length') return target.length;
      const idx = typeof prop === 'string' ? Number(prop) : NaN;
      if (!isNaN(idx)) return target[idx];
      return undefined;
    },
  });

  const el: MockElement = {
    tagName: tag.toUpperCase(),
    textContent: '',
    value: '',
    checked: false,
    className: '',
    classList: {
      _classes: new Set<string>(),
      add(cls: string): void { this._classes.add(cls); },
      remove(cls: string): void { this._classes.delete(cls); },
      contains(cls: string): boolean { return this._classes.has(cls); },
    },
    style: {
      _props: new Map<string, string>(),
      setProperty(prop: string, val: string): void { this._props.set(prop, val); },
      getPropertyValue(prop: string): string { return this._props.get(prop) ?? ''; },
    },
    _children,
    get children() { return childrenProxy; },
    get lastChild(): MockElement | null {
      return _children.length > 0 ? (_children[_children.length - 1] ?? null) : null;
    },
    appendChild(child: MockElement): MockElement {
      _children.push(child);
      return child;
    },
    removeChild(child: MockElement): MockElement {
      const idx = _children.indexOf(child);
      if (idx >= 0) _children.splice(idx, 1);
      return child;
    },
  };

  return el;
}

// テスト間で State ID の衝突を避けるためユニーク ID を生成
let _idCounter = 0;
function uid(prefix: string = 'state'): string {
  return `${prefix}_${++_idCounter}`;
}

// -----------------------------------------------------------------------
// テストスイート
// -----------------------------------------------------------------------

describe('prelude.ts ランタイム', () => {

  // --------------------------------------------------------------------
  // 1. 初期化（Req 1.2）
  // --------------------------------------------------------------------
  describe('1. initState / state', () => {
    it('initState で状態を初期化できる', () => {
      const id = uid('count');
      rt.initState(id, 0);
      const s = rt.state<number>(id);
      expect(s.get()).toBe(0);
    });

    it('二重 initState は無視される（初期値が上書きされない）', () => {
      const id = uid('msg');
      rt.initState(id, 'hello');
      rt.initState(id, 'world'); // 二重登録 → 無視
      expect(rt.state<string>(id).get()).toBe('hello');
    });

    it('未登録 ID で state() を呼ぶと Error をスロー', () => {
      expect(() => rt.state('__nonexistent_state_xyz__')).toThrow(/unknown state/);
    });

    it('文字列・数値・真偽値・オブジェクトなど任意の型を初期化できる', () => {
      const strId = uid('str');
      const numId = uid('num');
      const boolId = uid('bool');
      const objId = uid('obj_init');
      rt.initState(strId, 'hello');
      rt.initState(numId, 3.14);
      rt.initState(boolId, true);
      rt.initState(objId, { x: 1 });
      expect(rt.state<string>(strId).get()).toBe('hello');
      expect(rt.state<number>(numId).get()).toBeCloseTo(3.14);
      expect(rt.state<boolean>(boolId).get()).toBe(true);
      expect(rt.state<{ x: number }>(objId).get()).toEqual({ x: 1 });
    });
  });

  // --------------------------------------------------------------------
  // 2. get / set（Req 2.4）
  // --------------------------------------------------------------------
  describe('2. get / set', () => {
    it('set した値を get で取得できる', async () => {
      const id = uid('x');
      rt.initState(id, 10);
      const s = rt.state<number>(id);
      s.set(42);
      await flushMicrotasks();
      expect(s.get()).toBe(42);
    });

    it('set は即座に内部値を更新する（get は常に最新値）', () => {
      const id = uid('v');
      rt.initState(id, 'a');
      const s = rt.state<string>(id);
      s.set('b');
      // set 後、microtask より前でも get() は最新値を返す
      expect(s.get()).toBe('b');
    });

    it('複数の状態を独立して管理できる', async () => {
      const aId = uid('a');
      const bId = uid('b');
      rt.initState(aId, 1);
      rt.initState(bId, 2);
      rt.state<number>(aId).set(10);
      rt.state<number>(bId).set(20);
      await flushMicrotasks();
      expect(rt.state<number>(aId).get()).toBe(10);
      expect(rt.state<number>(bId).get()).toBe(20);
    });

    it('未登録状態に set しようとすると Error をスロー', () => {
      expect(() => {
        rt.state('__unknown_for_set__');
      }).toThrow(/unknown state/);
    });
  });

  // --------------------------------------------------------------------
  // 3. 購読通知（Req 2.4）
  // --------------------------------------------------------------------
  describe('3. subscribe / 購読通知', () => {
    it('subscribe は登録時に即時通知する（初期値）', () => {
      const id = uid('n');
      rt.initState(id, 99);
      const calls: number[] = [];
      rt.state<number>(id).subscribe((v) => calls.push(v));
      expect(calls).toEqual([99]);
    });

    it('set 後に microtask で購読者が通知される（Req 2.4）', async () => {
      const id = uid('n2');
      rt.initState(id, 0);
      const calls: number[] = [];
      rt.state<number>(id).subscribe((v) => calls.push(v));
      calls.length = 0; // 初回通知をクリア

      rt.state<number>(id).set(1);
      expect(calls).toEqual([]); // microtask 前はまだ通知されていない

      await flushMicrotasks();
      expect(calls).toEqual([1]);
    });

    it('unsubscribe 後は通知されない', async () => {
      const id = uid('u');
      rt.initState(id, 0);
      const calls: number[] = [];
      const unsub = rt.state<number>(id).subscribe((v) => calls.push(v));
      calls.length = 0; // 初回通知クリア

      unsub();
      rt.state<number>(id).set(1);
      await flushMicrotasks();
      expect(calls).toEqual([]);
    });

    it('複数の購読者が全員通知される', async () => {
      const id = uid('m');
      rt.initState(id, 0);
      const a: number[] = [];
      const b: number[] = [];
      rt.state<number>(id).subscribe((v) => a.push(v));
      rt.state<number>(id).subscribe((v) => b.push(v));
      a.length = 0;
      b.length = 0;

      rt.state<number>(id).set(5);
      await flushMicrotasks();
      expect(a).toEqual([5]);
      expect(b).toEqual([5]);
    });

    it('subscribe の返り値は unsubscribe 関数', () => {
      const id = uid('unsub_fn');
      rt.initState(id, 0);
      const unsub = rt.state<number>(id).subscribe(() => undefined);
      expect(typeof unsub).toBe('function');
    });
  });

  // --------------------------------------------------------------------
  // 4. バッチング（Req 2.6）
  // --------------------------------------------------------------------
  describe('4. バッチング（Req 2.6）', () => {
    it('同期で複数 set → 購読者は 1 回だけ呼ばれる（最新値）', async () => {
      const id = uid('batch');
      rt.initState(id, 0);
      const calls: number[] = [];
      rt.state<number>(id).subscribe((v) => calls.push(v));
      calls.length = 0; // 初回通知クリア

      // 同期的に 3 回 set
      rt.state<number>(id).set(1);
      rt.state<number>(id).set(2);
      rt.state<number>(id).set(3);

      expect(calls).toEqual([]); // まだ通知されていない

      await flushMicrotasks();
      // バッチングにより最終値 3 で 1 回のみ通知
      expect(calls).toEqual([3]);
      expect(calls.length).toBe(1);
    });

    it('複数の状態が同期で更新されても、それぞれ 1 回通知', async () => {
      const pId = uid('p');
      const qId = uid('q');
      rt.initState(pId, 0);
      rt.initState(qId, 0);
      const pCalls: number[] = [];
      const qCalls: number[] = [];
      rt.state<number>(pId).subscribe((v) => pCalls.push(v));
      rt.state<number>(qId).subscribe((v) => qCalls.push(v));
      pCalls.length = 0;
      qCalls.length = 0;

      rt.state<number>(pId).set(10);
      rt.state<number>(pId).set(20);
      rt.state<number>(qId).set(100);
      rt.state<number>(qId).set(200);

      await flushMicrotasks();
      expect(pCalls).toEqual([20]);
      expect(qCalls).toEqual([200]);
    });

    it('set → flush → set は 2 回の通知を生成する（異なる microtask バッチ）', async () => {
      const id = uid('two_batch');
      rt.initState(id, 0);
      const calls: number[] = [];
      rt.state<number>(id).subscribe((v) => calls.push(v));
      calls.length = 0;

      // 第 1 バッチ
      rt.state<number>(id).set(1);
      await flushMicrotasks();
      expect(calls).toEqual([1]);

      // 第 2 バッチ
      rt.state<number>(id).set(2);
      await flushMicrotasks();
      expect(calls).toEqual([1, 2]);
    });
  });

  // --------------------------------------------------------------------
  // 5. 等値変化なし → 再通知しない（Req 3.3）
  // --------------------------------------------------------------------
  describe('5. 等値スキップ（Req 3.3）', () => {
    it('同じ値を set しても通知されない', async () => {
      const id = uid('same');
      rt.initState(id, 42);
      const calls: number[] = [];
      rt.state<number>(id).subscribe((v) => calls.push(v));
      calls.length = 0;

      rt.state<number>(id).set(42); // 変化なし
      await flushMicrotasks();
      expect(calls).toEqual([]);
    });

    it('異なる値の場合は通知される', async () => {
      const id = uid('diff');
      rt.initState(id, 1);
      const calls: number[] = [];
      rt.state<number>(id).subscribe((v) => calls.push(v));
      calls.length = 0;

      rt.state<number>(id).set(2);
      await flushMicrotasks();
      expect(calls).toEqual([2]);
    });

    it('オブジェクト参照の比較は === で行われる', async () => {
      const id = uid('obj_ref');
      const obj = { v: 1 };
      rt.initState(id, obj);
      const calls: unknown[] = [];
      rt.state<unknown>(id).subscribe((v) => calls.push(v));
      calls.length = 0;

      rt.state<unknown>(id).set(obj); // 同じ参照 → 通知なし
      await flushMicrotasks();
      expect(calls).toEqual([]);

      const obj2 = { v: 1 };
      rt.state<unknown>(id).set(obj2); // 異なる参照 → 通知あり
      await flushMicrotasks();
      expect(calls).toEqual([obj2]);
    });

    it('null → null の連続 set は通知しない', async () => {
      const id = uid('null_test');
      rt.initState<null>(id, null);
      const calls: null[] = [];
      rt.state<null>(id).subscribe((v) => calls.push(v));
      calls.length = 0;

      rt.state<null>(id).set(null);
      await flushMicrotasks();
      expect(calls).toEqual([]);
    });
  });

  // --------------------------------------------------------------------
  // 6. each 差分（Req 3.6）
  // --------------------------------------------------------------------
  describe('6. bindEach 差分更新（Req 3.6）', () => {
    it('初期配列で子要素が生成される', async () => {
      const id = uid('list');
      rt.initState(id, ['a', 'b', 'c']);
      const parent = createMockElement('ul');
      const createdIds: string[] = [];

      rt.bindEach(parent as Element, id, (itemId, idx) => {
        createdIds.push(itemId);
        const el = createMockElement('li');
        el.textContent = String(idx);
        return el as Element;
      });

      await flushMicrotasks();
      expect(parent._children.length).toBe(3);
      expect(createdIds).toHaveLength(3);
      expect(createdIds[0]).toBe(`${id}.item0`);
      expect(createdIds[1]).toBe(`${id}.item1`);
      expect(createdIds[2]).toBe(`${id}.item2`);
    });

    it('配列に要素を追加すると子要素が追加される（Req 3.6 追加）', async () => {
      const id = uid('arr_add');
      rt.initState(id, ['x', 'y']);
      const parent = createMockElement('ul');

      rt.bindEach(
        parent as Element,
        id,
        () => createMockElement('li') as Element
      );
      await flushMicrotasks();

      expect(parent._children.length).toBe(2);

      rt.state<string[]>(id).set(['x', 'y', 'z']);
      await flushMicrotasks();
      await flushMicrotasks();
      expect(parent._children.length).toBe(3);
    });

    it('配列から要素を削除すると子要素が削除される（Req 3.6 削除）', async () => {
      const id = uid('arr_del');
      rt.initState(id, ['a', 'b', 'c']);
      const parent = createMockElement('ul');

      rt.bindEach(
        parent as Element,
        id,
        () => createMockElement('li') as Element
      );
      await flushMicrotasks();

      expect(parent._children.length).toBe(3);

      rt.state<string[]>(id).set(['a']);
      await flushMicrotasks();
      await flushMicrotasks();
      expect(parent._children.length).toBe(1);
    });

    it('スロット State が "{stateId}.item{i}" 形式で作成される', async () => {
      const id = uid('items');
      rt.initState(id, [10, 20]);
      const parent = createMockElement('ul');

      rt.bindEach(
        parent as Element,
        id,
        () => createMockElement('li') as Element
      );
      await flushMicrotasks();

      expect(() => rt.state<number>(`${id}.item0`)).not.toThrow();
      expect(() => rt.state<number>(`${id}.item1`)).not.toThrow();
      expect(rt.state<number>(`${id}.item0`).get()).toBe(10);
      expect(rt.state<number>(`${id}.item1`).get()).toBe(20);
    });

    it('配列値が更新されるとスロット State が更新通知を受ける（Req 3.6 値更新）', async () => {
      const id = uid('vals');
      rt.initState(id, [1, 2]);
      const parent = createMockElement('ul');

      rt.bindEach(
        parent as Element,
        id,
        () => createMockElement('li') as Element
      );
      await flushMicrotasks();

      const item0Calls: number[] = [];
      rt.state<number>(`${id}.item0`).subscribe((v) => item0Calls.push(v));
      item0Calls.length = 0; // 初回通知クリア

      rt.state<number[]>(id).set([99, 2]); // item0 の値が変わる
      await flushMicrotasks();
      await flushMicrotasks();

      expect(item0Calls).toContain(99);
    });

    it('空配列を設定すると全子要素が削除される', async () => {
      const id = uid('arr_empty');
      rt.initState(id, [1, 2, 3]);
      const parent = createMockElement('ul');

      rt.bindEach(
        parent as Element,
        id,
        () => createMockElement('li') as Element
      );
      await flushMicrotasks();

      expect(parent._children.length).toBe(3);

      rt.state<number[]>(id).set([]);
      await flushMicrotasks();
      await flushMicrotasks();
      expect(parent._children.length).toBe(0);
    });
  });

  // --------------------------------------------------------------------
  // 7. 例外伝播遮断（Design: Error Handling）
  // --------------------------------------------------------------------
  describe('7. 例外伝播遮断', () => {
    it('購読者が例外をスローしても他の購読者に伝播しない', async () => {
      const id = uid('err');
      rt.initState(id, 0);
      const received: number[] = [];

      // 例外をスローする購読者
      rt.state<number>(id).subscribe(() => {
        throw new Error('subscriber error');
      });

      // 正常な購読者
      rt.state<number>(id).subscribe((v) => received.push(v));

      // 初回通知のクリア
      received.length = 0;

      rt.state<number>(id).set(1);
      await flushMicrotasks();

      // 例外にもかかわらず正常な購読者は通知を受ける
      expect(received).toEqual([1]);
    });

    it('購読登録時（初回通知）の例外も外部に伝播しない', () => {
      const id = uid('init_err');
      rt.initState(id, 42);
      const received: number[] = [];

      // 初回通知で例外をスローする購読者登録が外部例外にならない
      expect(() => {
        rt.state<number>(id).subscribe(() => {
          throw new Error('initial subscriber error');
        });
      }).not.toThrow();

      // 後続の購読者は正常に登録できる
      rt.state<number>(id).subscribe((v) => received.push(v));
      expect(received).toEqual([42]);
    });

    it('flush 中に set しても無限ループしない（再入保護）', async () => {
      const id = uid('loop');
      rt.initState(id, 0);
      let count = 0;

      rt.state<number>(id).subscribe((v) => {
        count++;
        if (v < 2) {
          // flush 中に set を呼び出す（再入テスト）
          rt.state<number>(id).set(v + 1);
        }
      });

      await flushMicrotasks();
      await flushMicrotasks();
      await flushMicrotasks();
      await flushMicrotasks();

      // スタックオーバーフローせずに完了（count は有限）
      expect(count).toBeGreaterThanOrEqual(1);
      expect(count).toBeLessThan(1000); // 無限ループでないことを確認
    });

    it('複数の購読者が例外をスローしても残りの購読者が通知される', async () => {
      const id = uid('multi_err');
      rt.initState(id, 0);
      const log: string[] = [];

      rt.state<number>(id).subscribe(() => { throw new Error('err1'); });
      rt.state<number>(id).subscribe(() => { log.push('ok1'); });
      rt.state<number>(id).subscribe(() => { throw new Error('err2'); });
      rt.state<number>(id).subscribe(() => { log.push('ok2'); });

      log.length = 0; // 初回通知クリア

      rt.state<number>(id).set(1);
      await flushMicrotasks();

      expect(log).toEqual(['ok1', 'ok2']);
    });
  });

  // --------------------------------------------------------------------
  // 8. バインディングヘルパー（カバレッジ向上）
  // --------------------------------------------------------------------
  describe('8. バインディングヘルパー', () => {
    it('bindText: 状態値を textContent に反映する', async () => {
      const id = uid('bt');
      rt.initState(id, 'hello');
      const el = createMockElement('span');

      rt.bindText(el as Element, id);
      expect(el.textContent).toBe('hello');

      rt.state<string>(id).set('world');
      await flushMicrotasks();
      expect(el.textContent).toBe('world');
    });

    it('bindText: transform 関数が指定された場合に適用される', async () => {
      const id = uid('bt_transform');
      rt.initState(id, 42);
      const el = createMockElement('span');

      rt.bindText(el as Element, id, (v) => `value=${String(v)}`);
      expect(el.textContent).toBe('value=42');
    });

    it('bindValue: 状態値を input.value に反映する', async () => {
      const id = uid('bv');
      rt.initState(id, 'initial');
      const el = createMockElement('input');

      rt.bindValue(el as Element, id);
      expect(el.value).toBe('initial');

      rt.state<string>(id).set('updated');
      await flushMicrotasks();
      expect(el.value).toBe('updated');
    });

    it('bindValue: transform 関数が指定された場合に適用される', async () => {
      const id = uid('bv_transform');
      rt.initState(id, 42);
      const el = createMockElement('input');

      rt.bindValue(el as Element, id, (v) => `num=${String(v)}`);
      expect(el.value).toBe('num=42');

      rt.state<number>(id).set(99);
      await flushMicrotasks();
      expect(el.value).toBe('num=99');
    });

    it('bindValue: transform なしの場合は従来通り String(v) が使われる', async () => {
      const id = uid('bv_no_transform');
      rt.initState(id, 123);
      const el = createMockElement('input');

      rt.bindValue(el as Element, id);
      expect(el.value).toBe('123');
    });

    it('bindClassAll: className を全置換する', async () => {
      const id = uid('bca');
      rt.initState(id, 'active');
      const el = createMockElement('div');

      rt.bindClassAll(el as Element, id);
      expect(el.className).toBe('active');

      rt.state<string>(id).set('inactive');
      await flushMicrotasks();
      expect(el.className).toBe('inactive');
    });

    it('bindClassAdd: クラスを追加・削除する', async () => {
      const id = uid('bcadd');
      rt.initState(id, 'red');
      const el = createMockElement('div');

      rt.bindClassAdd(el as Element, id);
      expect(el.classList.contains('red')).toBe(true);

      rt.state<string>(id).set('blue');
      await flushMicrotasks();
      expect(el.classList.contains('red')).toBe(false);
      expect(el.classList.contains('blue')).toBe(true);
    });

    it('bindStyle: スタイルプロパティを設定する', async () => {
      const id = uid('bs');
      rt.initState(id, 'red');
      const el = createMockElement('div');

      rt.bindStyle(el as Element, 'color', id);
      expect(el.style.getPropertyValue('color')).toBe('red');

      rt.state<string>(id).set('blue');
      await flushMicrotasks();
      expect(el.style.getPropertyValue('color')).toBe('blue');
    });

    it('bindChecked: checked プロパティを設定する', async () => {
      const id = uid('bchk');
      rt.initState(id, false);
      const el = createMockElement('input');

      rt.bindChecked(el as Element, id);
      expect(el.checked).toBe(false);

      rt.state<boolean>(id).set(true);
      await flushMicrotasks();
      expect(el.checked).toBe(true);
    });

    it('bindChecked: transform 関数が指定された場合に適用される', async () => {
      const id = uid('bchk_transform');
      rt.initState(id, 'yes');
      const el = createMockElement('input');

      rt.bindChecked(el as Element, id, (v) => v === 'yes');
      expect(el.checked).toBe(true);

      rt.state<string>(id).set('no');
      await flushMicrotasks();
      expect(el.checked).toBe(false);
    });

    it('bindChecked: transform なしの場合は従来通り Boolean(v) が使われる', async () => {
      const id = uid('bchk_no_transform');
      rt.initState(id, 1);
      const el = createMockElement('input');

      rt.bindChecked(el as Element, id);
      expect(el.checked).toBe(true);

      rt.state<number>(id).set(0);
      await flushMicrotasks();
      expect(el.checked).toBe(false);
    });
  });

  // --------------------------------------------------------------------
  // 9. bindEach 追加カバレッジ（内部ブランチ）
  // --------------------------------------------------------------------
  describe('9. bindEach 内部ブランチカバレッジ', () => {
    it('ensureItemState: 既存スロットに同値を設定しても pending に追加されない', async () => {
      const id = uid('slot_same');
      rt.initState(id, [10, 20]);
      const parent = createMockElement('ul');

      rt.bindEach(
        parent as Element,
        id,
        () => createMockElement('li') as Element
      );
      await flushMicrotasks();

      // 同じ値で更新 → スロット State は変化なしで通知されない
      const item0Calls: number[] = [];
      rt.state<number>(`${id}.item0`).subscribe((v) => item0Calls.push(v));
      item0Calls.length = 0;

      rt.state<number[]>(id).set([10, 99]); // item0 は同値, item1 は変化
      await flushMicrotasks();
      await flushMicrotasks();

      // item0 は同値のため通知なし
      expect(item0Calls).toEqual([]);

      const item1Calls: number[] = [];
      rt.state<number>(`${id}.item1`).subscribe((v) => item1Calls.push(v));
      item1Calls.length = 0;

      rt.state<number[]>(id).set([10, 99]); // item1 も同値
      await flushMicrotasks();
      await flushMicrotasks();
      expect(item1Calls).toEqual([]);
    });

    it('bindEach: lastChild が null の場合も安全に削除できる', async () => {
      const id = uid('last_null');
      rt.initState(id, [] as number[]);
      const parent = createMockElement('ul');

      // 空配列から始める
      rt.bindEach(
        parent as Element,
        id,
        () => createMockElement('li') as Element
      );
      await flushMicrotasks();
      expect(parent._children.length).toBe(0);

      // 1要素追加して削除
      rt.state<number[]>(id).set([1]);
      await flushMicrotasks();
      await flushMicrotasks();
      expect(parent._children.length).toBe(1);

      rt.state<number[]>(id).set([]);
      await flushMicrotasks();
      await flushMicrotasks();
      expect(parent._children.length).toBe(0);
    });
  });

  // --------------------------------------------------------------------
  // 10. propagateToParent エラー分岐（Req 1.3 / 1.4）
  //
  // slot エントリは bindEach 経由でしか親バックリンクを持たないので、
  // bindEach で初期化した後で親 state の中身を細工して
  // propagateToParent の 3 つのエラー経路を発火させる。
  // 各エラーは throw ではなく console.warn でスキップされる。
  // --------------------------------------------------------------------
  describe('10. propagateToParent エラー経路（Req 1.3 / 1.4）', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('親 state が配列でなくなった場合、console.warn を発出してスキップする', async () => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      const parentId = uid('prop_not_array');
      rt.initState(parentId, [10, 20]);
      const parent = createMockElement('ul');
      rt.bindEach(
        parent as Element,
        parentId,
        () => createMockElement('li') as Element
      );
      await flushMicrotasks();

      const slotId = `${parentId}.item0`;

      // 親 state を非配列に上書き（強制的に防御的経路へ）
      rt.state<unknown>(parentId).set('not-an-array');
      await flushMicrotasks();

      warnSpy.mockClear();

      // slot を set すると propagateToParent が呼ばれ、配列でないため warn 経路を通る
      rt.state<unknown>(slotId).set(999);
      await flushMicrotasks();

      const allMessages = warnSpy.mock.calls.map((c) => String(c[0]));
      expect(
        allMessages.some((m) => m.includes('is not an array'))
      ).toBe(true);
    });

    it('親 state のインデックス範囲外（上限超過）の場合、console.warn を発出してスキップする', async () => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      const parentId = uid('prop_idx_oor');
      rt.initState(parentId, [1, 2, 3]);
      const parent = createMockElement('ul');
      rt.bindEach(
        parent as Element,
        parentId,
        () => createMockElement('li') as Element
      );
      await flushMicrotasks();

      const slotId = `${parentId}.item2`;

      // 親配列を縮めて slot が指す index を範囲外にする
      rt.state<number[]>(parentId).set([1]);
      await flushMicrotasks();
      await flushMicrotasks();

      warnSpy.mockClear();

      // 縮んだ後の slot を set → index 範囲外で warn
      rt.state<number>(slotId).set(999);
      await flushMicrotasks();

      const allMessages = warnSpy.mock.calls.map((c) => String(c[0]));
      expect(
        allMessages.some((m) => m.includes('out of range'))
      ).toBe(true);
    });
  });

  // --------------------------------------------------------------------
  // 11. ensureItemState の queueMicrotask 経路（Req 1.3 / 1.4）
  //
  // bindEach の最初の subscribe 起動時、step 1 の ensureItemState ループは
  // 全 index について新規 slot 作成パスを通る。本テストではあらかじめ
  // 親 state を bindEach なしで配列として登録し、別の bindEach（同じ
  // stateId は使えないので別 id）を経由した後で、同じ slot id に対して
  // 再度 ensureItemState の "既存スロットを別値で更新" 経路（line 266）を踏ませる。
  //
  // 既存テスト 9 は "同値" 経路だけを通すため、line 266 の
  // `if (!isFlushing) queueMicrotask(flush)` 真分岐がカバーされる。
  // --------------------------------------------------------------------
  describe('11. ensureItemState の既存スロット更新で queueMicrotask が発火する（Req 1.3）', () => {
    it('既存スロット異値更新 → microtask flush で購読者へ通知される', async () => {
      const id = uid('slot_diff_update');
      rt.initState(id, [1, 2]);
      const parent = createMockElement('ul');
      rt.bindEach(
        parent as Element,
        id,
        () => createMockElement('li') as Element
      );
      await flushMicrotasks();

      // 既存スロットを購読
      const slot0Calls: number[] = [];
      rt.state<number>(`${id}.item0`).subscribe((v) => slot0Calls.push(v));
      slot0Calls.length = 0;

      // 親配列の同一スロットを「異値」で更新 → ensureItemState の既存スロット更新パス
      // line 263-267 が走り、line 266 の queueMicrotask(flush) が発火する
      rt.state<number[]>(id).set([42, 2]);
      await flushMicrotasks();
      await flushMicrotasks();

      expect(slot0Calls).toContain(42);
    });

    it('initState で先行登録された slot id を bindEach が拾うと、初回 subscribe (isFlushing=false) で既存スロット更新の queueMicrotask 経路を通る', async () => {
      const id = uid('slot_preinit');
      // 親 state より先に "slot id" として initState する。
      // bindEach の初回 subscribe は同期実行（isFlushing=false）で
      // ensureItemState を呼び、slot が既存・値が違うので line 264-266 経路を踏む。
      rt.initState(`${id}.item0`, 'stale');
      rt.initState(`${id}.item1`, 'old');
      rt.initState(id, ['fresh-a', 'fresh-b']); // 親 state
      const parent = createMockElement('ul');

      const slot0Calls: string[] = [];
      const slot1Calls: string[] = [];
      // 先行登録された slot を購読しておく（初回は古い値を受け取る）
      rt.state<string>(`${id}.item0`).subscribe((v) => slot0Calls.push(v));
      rt.state<string>(`${id}.item1`).subscribe((v) => slot1Calls.push(v));
      slot0Calls.length = 0;
      slot1Calls.length = 0;

      // bindEach の初回 subscribe は同期実行のため isFlushing=false。
      // ensureItemState は既存 slot を検出し、entry.value !== value で更新パスを通る。
      // line 266: queueMicrotask(flush) を発火する真分岐。
      rt.bindEach(
        parent as Element,
        id,
        () => createMockElement('li') as Element
      );

      await flushMicrotasks();
      await flushMicrotasks();

      // queueMicrotask により slot 購読者に新値が届くことを確認
      expect(slot0Calls).toContain('fresh-a');
      expect(slot1Calls).toContain('fresh-b');
    });
  });

  // --------------------------------------------------------------------
  // 12. unsubscribe の安全パス（Req 1.3）
  //
  // line 313-315: state エントリが既に削除済みのケース。
  // 実際には states.delete を直接公開していないが、未知 id の状態に
  // 対する unsubscribe を想定したガードである。`states.get(id)` が
  // undefined を返す状況は通常発生しないため、defensive コードとして
  // 直接到達不能。本テストは通常パス（エントリ存在時の正しい delete）の
  // 回帰のみカバーする。
  // --------------------------------------------------------------------
  describe('12. unsubscribe 通常パス（Req 1.3）', () => {
    it('unsubscribe 後の二重呼び出しは安全に no-op になる', () => {
      const id = uid('unsub_twice');
      rt.initState(id, 0);
      const unsub = rt.state<number>(id).subscribe(() => undefined);
      expect(() => {
        unsub();
        unsub(); // 二重呼び出し
      }).not.toThrow();
    });
  });

  // --------------------------------------------------------------------
  // 13. bindClassAdd / bindStyle / bindClassAll transform 分岐（Req 1.3）
  // --------------------------------------------------------------------
  describe('13. bindClassAdd / bindStyle / bindClassAll transform 分岐', () => {
    it('bindClassAdd: transform が空文字を返すとクラスは追加されない', async () => {
      const id = uid('bcadd_empty');
      rt.initState(id, 'ignored');
      const el = createMockElement('div');

      // transform が常に空文字を返す → newClass === ""
      rt.bindClassAdd(el as Element, id, () => '');
      // 初回 prevClass="" と newClass="" → 削除も追加もしない
      expect(el.classList._classes.size).toBe(0);

      // 値を変えても transform は "" のまま → 引き続きクラスなし
      rt.state<string>(id).set('changed');
      await flushMicrotasks();
      expect(el.classList._classes.size).toBe(0);
    });

    it('bindClassAdd: transform が同一クラス文字列を返すと remove も add もスキップされる', async () => {
      const id = uid('bcadd_same');
      rt.initState(id, 'a');
      const el = createMockElement('div');

      rt.bindClassAdd(el as Element, id, () => 'fixed');
      expect(el.classList.contains('fixed')).toBe(true);

      // remove を観測するため記録
      const removed: string[] = [];
      const origRemove = el.classList.remove.bind(el.classList);
      el.classList.remove = (cls: string): void => {
        removed.push(cls);
        origRemove(cls);
      };

      rt.state<string>(id).set('b'); // transform は "fixed" を返す → prev === new
      await flushMicrotasks();

      // prev === new のため remove は呼ばれない
      expect(removed).toEqual([]);
      expect(el.classList.contains('fixed')).toBe(true);
    });

    it('bindClassAdd: transform なし時は String(v) がそのまま使われる', async () => {
      const id = uid('bcadd_no_transform');
      rt.initState(id, 'first');
      const el = createMockElement('div');

      rt.bindClassAdd(el as Element, id);
      expect(el.classList.contains('first')).toBe(true);

      rt.state<string>(id).set('second');
      await flushMicrotasks();
      expect(el.classList.contains('first')).toBe(false);
      expect(el.classList.contains('second')).toBe(true);
    });

    it('bindClassAll: transform 指定時は変換結果が className に反映される', async () => {
      const id = uid('bcall_transform');
      rt.initState(id, 1);
      const el = createMockElement('div');

      rt.bindClassAll(el as Element, id, (v) => `cls-${String(v)}`);
      expect(el.className).toBe('cls-1');

      rt.state<number>(id).set(2);
      await flushMicrotasks();
      expect(el.className).toBe('cls-2');
    });

    it('bindStyle: transform 指定時は変換結果がスタイル値に反映される', async () => {
      const id = uid('bs_transform');
      rt.initState(id, 12);
      const el = createMockElement('div');

      rt.bindStyle(el as Element, 'font-size', id, (v) => `${String(v)}px`);
      expect(el.style.getPropertyValue('font-size')).toBe('12px');

      rt.state<number>(id).set(24);
      await flushMicrotasks();
      expect(el.style.getPropertyValue('font-size')).toBe('24px');
    });

    it('bindStyle: transform なし時は String(v) がそのまま使われる', async () => {
      const id = uid('bs_no_transform');
      rt.initState(id, '10px');
      const el = createMockElement('div');

      rt.bindStyle(el as Element, 'margin', id);
      expect(el.style.getPropertyValue('margin')).toBe('10px');

      rt.state<string>(id).set('20px');
      await flushMicrotasks();
      expect(el.style.getPropertyValue('margin')).toBe('20px');
    });
  });

  // --------------------------------------------------------------------
  // 14. bindEach 追加エッジ（Req 1.3）
  //
  // - 配列の同じ値を再度 set しても pending には積まれない（line 450 偽分岐）
  // - 初期 subscribe 時に pending.size === 0 の経路（line 456 偽分岐）
  // --------------------------------------------------------------------
  describe('14. bindEach pending.size / lastChild 分岐（Req 1.3）', () => {
    it('初期 subscribe で空配列の場合、microtask flush は不要', async () => {
      const id = uid('be_empty_initial');
      rt.initState(id, [] as number[]);
      const parent = createMockElement('ul');

      rt.bindEach(
        parent as Element,
        id,
        () => createMockElement('li') as Element
      );

      // 初期 [] のため pending.size === 0 で line 456 偽分岐
      await flushMicrotasks();
      expect(parent._children.length).toBe(0);
    });

    it('既存配列と全要素同値の再 set でも子要素数が変化しない', async () => {
      const id = uid('be_same_arr');
      rt.initState(id, [1, 2, 3]);
      const parent = createMockElement('ul');

      rt.bindEach(
        parent as Element,
        id,
        () => createMockElement('li') as Element
      );
      await flushMicrotasks();
      expect(parent._children.length).toBe(3);

      // 同値配列を新規参照として set → 親 state は変化通知が走るが
      // 各 slot は同値で pending に積まれない（line 450 偽分岐）
      rt.state<number[]>(id).set([1, 2, 3]);
      await flushMicrotasks();
      await flushMicrotasks();
      expect(parent._children.length).toBe(3);
    });
  });
});
