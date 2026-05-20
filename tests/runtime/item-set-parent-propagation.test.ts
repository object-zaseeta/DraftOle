/**
 * Task 2.1: slot エントリの set 経路で親配列 state を index 置換コピーで更新する
 *
 * 検証内容:
 *   (a) `bindEach` で slot を初期化後、`runtime.state(slotId).set(newValue)` が
 *       親配列 state を「該当 index を置換した新しい配列参照」で更新する
 *   (b) 親 state の subscriber が microtask flush 後に最新値で発火する
 *
 * Boundary: src/runtime/prelude.ts のみが対象。Task 3.1 で本ファイルを拡張する。
 *
 * Requirements: 1.1, 1.2, 1.3, 6.1, 6.2
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

type GlobalWithWindow = typeof globalThis & {
  window: typeof globalThis;
  __draftole__: DraftoleRuntime | undefined;
};

let rt: DraftoleRuntime;

beforeAll(async () => {
  (globalThis as GlobalWithWindow).window = globalThis;
  await import('../../src/runtime/prelude.ts');
  const loaded = (globalThis as GlobalWithWindow).__draftole__;
  if (loaded === undefined) {
    throw new Error('__draftole__ が未設定');
  }
  rt = loaded;
});

// -----------------------------------------------------------------------
// テストヘルパー
// -----------------------------------------------------------------------

function flushMicrotasks(): Promise<void> {
  return new Promise<void>((resolve) => {
    queueMicrotask(() => queueMicrotask(() => resolve()));
  });
}

interface MockElement {
  tagName: string;
  textContent: string;
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
    _children,
    get children() { return childrenProxy as unknown as { length: number; [i: number]: MockElement }; },
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

let _idCounter = 0;
function uid(prefix: string = 'arr'): string {
  return `${prefix}_${++_idCounter}`;
}

// -----------------------------------------------------------------------
// テスト本体
// -----------------------------------------------------------------------

describe('Task 2.1: slot.set → 親配列 state への伝播', () => {
  it('(a) item.set で親配列の対応 index が新値で置換された新しい配列参照になる', async () => {
    const parentId = uid('arr');
    rt.initState<unknown[]>(parentId, ['a', 'b', 'c']);

    const parentEl = createMockElement('ul');
    rt.bindEach(parentEl as unknown as Element, parentId, (_itemId, _idx) => {
      return createMockElement('li') as unknown as Element;
    });

    // bindEach は subscribe 経由で初期実行されるため slot state が ensureItemState で作られている
    const slot1Id = `${parentId}.item1`;
    const before = rt.state<unknown[]>(parentId).get();
    expect(before).toEqual(['a', 'b', 'c']);

    rt.state<string>(slot1Id).set('B');

    // 同期で（または flush 後に）親配列が更新されている必要がある
    await flushMicrotasks();

    const after = rt.state<unknown[]>(parentId).get();
    expect(after).toEqual(['a', 'B', 'c']);
    // 配列参照が新しいこと（置換コピー）
    expect(after).not.toBe(before);
  });

  it('(b) 親 state の subscriber が microtask flush 後に最新値で発火する', async () => {
    const parentId = uid('arr');
    rt.initState<unknown[]>(parentId, [1, 2, 3]);

    const parentEl = createMockElement('ul');
    rt.bindEach(parentEl as unknown as Element, parentId, () => {
      return createMockElement('li') as unknown as Element;
    });

    // 初期 subscribe 通知を消化
    const received: unknown[][] = [];
    const unsubscribe = rt.state<unknown[]>(parentId).subscribe((v) => {
      received.push(v);
    });
    await flushMicrotasks();
    received.length = 0; // 初期通知を破棄

    rt.state<number>(`${parentId}.item0`).set(99);
    await flushMicrotasks();

    expect(received.length).toBeGreaterThanOrEqual(1);
    const last = received[received.length - 1];
    expect(last).toEqual([99, 2, 3]);

    unsubscribe();
  });
});

// -----------------------------------------------------------------------
// Task 2.2: 値同一スキップ + flush 中連鎖の警告抑制
// -----------------------------------------------------------------------

describe('Task 2.2: 値同一スキップと flush 中連鎖の警告抑制', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('(c) 同じ値で 2 度 item.set を呼んでも親 subscriber は 2 度目では発火しない', async () => {
    const parentId = uid('arr');
    rt.initState<unknown[]>(parentId, ['x', 'y', 'z']);

    const parentEl = createMockElement('ul');
    rt.bindEach(parentEl as unknown as Element, parentId, () => {
      return createMockElement('li') as unknown as Element;
    });

    const slot1Id = `${parentId}.item1`;
    const spy = vi.fn<(v: unknown[]) => void>();
    const unsubscribe = rt.state<unknown[]>(parentId).subscribe(spy);
    await flushMicrotasks();
    // 初回 subscribe 即時通知の 1 回をベースラインとして記録
    const baseline = spy.mock.calls.length; // === 1

    // 1 回目: 値変化あり → 親伝播 → flush で 1 回発火
    rt.state<string>(slot1Id).set('Y');
    await flushMicrotasks();
    expect(spy.mock.calls.length).toBe(baseline + 1);

    // 2 回目: 同じ値 → setState の === ガードで完全スキップ（伝播も走らない）
    rt.state<string>(slot1Id).set('Y');
    await flushMicrotasks();
    expect(spy.mock.calls.length).toBe(baseline + 1); // 増えていない

    unsubscribe();
  });

  it('(d) flush 外での item.set による slot→parent 伝播は "set during flush" 警告を出さない', async () => {
    const parentId = uid('arr');
    rt.initState<unknown[]>(parentId, ['a', 'b']);

    const parentEl = createMockElement('ul');
    rt.bindEach(parentEl as unknown as Element, parentId, () => {
      return createMockElement('li') as unknown as Element;
    });
    await flushMicrotasks();

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    rt.state<string>(`${parentId}.item0`).set('A');
    await flushMicrotasks();

    const flushWarnings = warnSpy.mock.calls.filter((args) =>
      typeof args[0] === 'string' && args[0].indexOf('set during flush') >= 0
    );
    expect(flushWarnings.length).toBe(0);
  });

  it('(d2) flush 中に親 subscriber 内から item.set してもライブラリ内部の伝播は警告抑制される', async () => {
    const parentId = uid('arr');
    rt.initState<unknown[]>(parentId, ['p', 'q']);

    const parentEl = createMockElement('ul');
    rt.bindEach(parentEl as unknown as Element, parentId, () => {
      return createMockElement('li') as unknown as Element;
    });
    await flushMicrotasks();

    // parent.subscribe 内で別 slot に対して item.set を発火させる。
    // この slot→parent 伝播は内部連鎖なので警告抑制される。
    let triggered = false;
    const unsub = rt.state<unknown[]>(parentId).subscribe(() => {
      if (!triggered) {
        triggered = true;
        rt.state<string>(`${parentId}.item1`).set('Q');
      }
    });
    await flushMicrotasks();

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    rt.state<string>(`${parentId}.item0`).set('P');
    await flushMicrotasks();

    const flushWarnings = warnSpy.mock.calls.filter((args) =>
      typeof args[0] === 'string' && args[0].indexOf('set during flush') >= 0
    );
    expect(flushWarnings.length).toBe(0);

    unsub();
  });

  it('(e) ユーザーが flush 中に直接 root state を set した場合は "set during flush" 警告が維持される', async () => {
    const userStateId = uid('user');
    const triggerId = uid('trig');
    rt.initState<number>(userStateId, 0);
    rt.initState<number>(triggerId, 0);

    // trigger の subscriber 内（= flush 中）から userState を直接 set する
    const unsub = rt.state<number>(triggerId).subscribe((v) => {
      if (v === 1) {
        rt.state<number>(userStateId).set(42);
      }
    });
    await flushMicrotasks();

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    rt.state<number>(triggerId).set(1);
    await flushMicrotasks();

    const flushWarnings = warnSpy.mock.calls.filter((args) =>
      typeof args[0] === 'string' && args[0].indexOf('set during flush') >= 0
    );
    expect(flushWarnings.length).toBeGreaterThanOrEqual(1);
    expect(flushWarnings[0]?.[0]).toContain(userStateId);

    unsub();
  });
});

// -----------------------------------------------------------------------
// Task 3.1: 拡張ケース — derived 伝播 / index 隔離 / 観測等価 / 親直接 set 非回帰
// -----------------------------------------------------------------------

describe('Task 3.1: slot→parent→derived 伝播契約の検証', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // (c equivalent) parent.subscribe → derived.set パターンを仕込んだ derived state が
  // item.set 経由でも再計算されることを確認する。
  // これは compile-time emit が生成する `parent.subscribe(_v => derived.set(filterFn(_v)))`
  // を pure JS で再現したもの。Req 2.1, 2.2, 2.3
  it('(c-derived) parent.subscribe → derived.set チェーンが item.set 起点で再計算される', async () => {
    const parentId = uid('arr');
    const derivedId = uid('derived');

    type Item = { id: number; done: boolean };
    const initial: Item[] = [
      { id: 1, done: false },
      { id: 2, done: false },
      { id: 3, done: true },
    ];
    rt.initState<Item[]>(parentId, initial);

    // derived state: 未完了件数（Swift で言う where { !$0.done }.count）
    const filterFn = (arr: Item[]): number => arr.filter((x) => !x.done).length;
    rt.initState<number>(derivedId, filterFn(initial));

    const parentEl = createMockElement('ul');
    rt.bindEach(parentEl as unknown as Element, parentId, () => {
      return createMockElement('li') as unknown as Element;
    });

    // compile-time emit が出すコードと同等のチェーンを pure JS で構築
    const unsubChain = rt.state<Item[]>(parentId).subscribe((v) => {
      rt.state<number>(derivedId).set(filterFn(v));
    });
    await flushMicrotasks();

    const derivedReceived: number[] = [];
    const unsubDerived = rt.state<number>(derivedId).subscribe((v) => {
      derivedReceived.push(v);
    });
    await flushMicrotasks();
    derivedReceived.length = 0; // 初期通知を破棄

    // item.set 経由で 1 件目を done = true にする → 未完了件数 2 → 1
    const slot0Id = `${parentId}.item0`;
    rt.state<Item>(slot0Id).set({ id: 1, done: true });
    await flushMicrotasks();

    // derived が再計算されて 1 になっていること
    expect(rt.state<number>(derivedId).get()).toBe(1);
    expect(derivedReceived.length).toBeGreaterThanOrEqual(1);
    expect(derivedReceived[derivedReceived.length - 1]).toBe(1);

    unsubDerived();
    unsubChain();
  });

  // (e equivalent) 5 要素配列で index=0 のみ更新したとき、index 1〜4 の slot
  // subscriber は発火しないこと。Req 1.4, 6.3
  it('(e-isolation) 5 要素配列で index=0 を更新すると他 index の slot subscriber は発火しない', async () => {
    const parentId = uid('arr');
    rt.initState<string[]>(parentId, ['a', 'b', 'c', 'd', 'e']);

    const parentEl = createMockElement('ul');
    rt.bindEach(parentEl as unknown as Element, parentId, () => {
      return createMockElement('li') as unknown as Element;
    });
    await flushMicrotasks();

    // 各 slot に subscriber を仕込む
    const spies: Array<ReturnType<typeof vi.fn>> = [];
    const unsubs: Array<() => void> = [];
    for (let i = 0; i < 5; i++) {
      const spy = vi.fn();
      spies.push(spy);
      unsubs.push(rt.state<string>(`${parentId}.item${i}`).subscribe(spy));
    }
    await flushMicrotasks();
    // 初期 subscribe 即時通知の baseline を記録
    const baselines = spies.map((s) => s.mock.calls.length);

    // index=0 のみ更新
    rt.state<string>(`${parentId}.item0`).set('A');
    await flushMicrotasks();

    // index=0 の subscriber は発火している
    const spy0 = spies[0];
    const base0 = baselines[0];
    if (spy0 === undefined || base0 === undefined) throw new Error('spy[0] missing');
    expect(spy0.mock.calls.length).toBe(base0 + 1);
    // index=1〜4 の subscriber は発火していない
    for (let i = 1; i < 5; i++) {
      const spyI = spies[i];
      const baseI = baselines[i];
      if (spyI === undefined || baseI === undefined) throw new Error('spy[i] missing');
      expect(spyI.mock.calls.length).toBe(baseI);
    }

    for (const u of unsubs) u();
  });

  // (f) item.set(v) と parent.set([...arr_with_index_replaced]) が観測上等価
  // Req 6.1, 6.2, 6.3
  it('(f-equivalence) item.set(v) と parent.set([置換配列]) が観測等価である', async () => {
    type Item = { id: number; done: boolean };
    const filterFn = (arr: Item[]): number => arr.filter((x) => !x.done).length;
    const initial: Item[] = [
      { id: 1, done: false },
      { id: 2, done: false },
      { id: 3, done: false },
    ];

    // ---- セットアップ A: item.set 経路 ----
    const parentIdA = uid('arr');
    const derivedIdA = uid('derived');
    rt.initState<Item[]>(parentIdA, initial.map((x) => ({ ...x })));
    rt.initState<number>(derivedIdA, filterFn(initial));
    const elA = createMockElement('ul');
    rt.bindEach(elA as unknown as Element, parentIdA, () => createMockElement('li') as unknown as Element);
    const unsubChainA = rt.state<Item[]>(parentIdA).subscribe((v) => {
      rt.state<number>(derivedIdA).set(filterFn(v));
    });
    await flushMicrotasks();

    const parentRecvA: Item[][] = [];
    const slotRecvA: Item[] = [];
    const unsubParentA = rt.state<Item[]>(parentIdA).subscribe((v) => parentRecvA.push(v));
    const unsubSlotA = rt.state<Item>(`${parentIdA}.item1`).subscribe((v) => slotRecvA.push(v));
    await flushMicrotasks();
    parentRecvA.length = 0;
    slotRecvA.length = 0;

    rt.state<Item>(`${parentIdA}.item1`).set({ id: 2, done: true });
    await flushMicrotasks();

    const derivedValueA = rt.state<number>(derivedIdA).get();
    const parentValueA = rt.state<Item[]>(parentIdA).get();

    // ---- セットアップ B: parent.set 直接経路 ----
    const parentIdB = uid('arr');
    const derivedIdB = uid('derived');
    rt.initState<Item[]>(parentIdB, initial.map((x) => ({ ...x })));
    rt.initState<number>(derivedIdB, filterFn(initial));
    const elB = createMockElement('ul');
    rt.bindEach(elB as unknown as Element, parentIdB, () => createMockElement('li') as unknown as Element);
    const unsubChainB = rt.state<Item[]>(parentIdB).subscribe((v) => {
      rt.state<number>(derivedIdB).set(filterFn(v));
    });
    await flushMicrotasks();

    const parentRecvB: Item[][] = [];
    const unsubParentB = rt.state<Item[]>(parentIdB).subscribe((v) => parentRecvB.push(v));
    await flushMicrotasks();
    parentRecvB.length = 0;

    const before = rt.state<Item[]>(parentIdB).get();
    const replaced = before.slice();
    replaced[1] = { id: 2, done: true };
    rt.state<Item[]>(parentIdB).set(replaced);
    await flushMicrotasks();

    const derivedValueB = rt.state<number>(derivedIdB).get();
    const parentValueB = rt.state<Item[]>(parentIdB).get();

    // ---- 観測等価アサーション ----
    expect(parentValueA).toEqual(parentValueB);
    expect(derivedValueA).toBe(derivedValueB);
    // 親 subscriber は両経路ともちょうど 1 回新値で発火
    expect(parentRecvA.length).toBe(parentRecvB.length);
    expect(parentRecvA[parentRecvA.length - 1]).toEqual(parentRecvB[parentRecvB.length - 1]);

    unsubSlotA();
    unsubParentA();
    unsubChainA();
    unsubParentB();
    unsubChainB();
  });

  // (g) parent.set 直接呼び出しでも derived が更新される（既存挙動の非回帰）
  // Req 6.3
  it('(g-regression) parent.set 直接呼び出しで derived が再計算される（既存パスの非回帰）', async () => {
    type Item = { id: number; done: boolean };
    const filterFn = (arr: Item[]): number => arr.filter((x) => !x.done).length;
    const parentId = uid('arr');
    const derivedId = uid('derived');

    const initial: Item[] = [
      { id: 1, done: false },
      { id: 2, done: false },
    ];
    rt.initState<Item[]>(parentId, initial);
    rt.initState<number>(derivedId, filterFn(initial));

    const parentEl = createMockElement('ul');
    rt.bindEach(parentEl as unknown as Element, parentId, () => createMockElement('li') as unknown as Element);

    const unsubChain = rt.state<Item[]>(parentId).subscribe((v) => {
      rt.state<number>(derivedId).set(filterFn(v));
    });
    await flushMicrotasks();

    expect(rt.state<number>(derivedId).get()).toBe(2);

    // parent.set を直接呼び出す（item.set を経由しない）
    rt.state<Item[]>(parentId).set([
      { id: 1, done: true },
      { id: 2, done: true },
    ]);
    await flushMicrotasks();

    expect(rt.state<number>(derivedId).get()).toBe(0);

    unsubChain();
  });
});
