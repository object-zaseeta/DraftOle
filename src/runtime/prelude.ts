/**
 * DraftOle Runtime Prelude
 *
 * ブラウザ実行用購読エンジン本体。IIFE 形式でグローバルに
 * `__draftole__` を 1 つだけ公開する（Req 5.3）。
 *
 * 責務:
 *   - 状態値保持（Req 5.2）
 *   - 購読登録（Req 5.2）
 *   - 通知バッチング（microtask キュー + isFlushing ガード）（Req 2.6）
 *   - 配列差分（each 用インデックスベース差分）（Req 3.6）
 *
 * target: ES2019 / module: none
 */

// -----------------------------------------------------------------------
// 型定義
// -----------------------------------------------------------------------

interface RuntimeState<T> {
  get(): T;
  set(v: T): void;
  subscribe(fn: (v: T) => void): () => void;
}

interface DraftoleRuntime {
  /** 状態の初期化（state-init コマンドから呼ばれる）（Req 1.2） */
  initState<T>(id: string, initial: T): void;

  /** 状態ハンドル取得（bind-* / state-set から呼ばれる） */
  state<T>(id: string): RuntimeState<T>;

  /** バインディング登録ヘルパ群（Req 4.1） */
  bindText(el: Element, stateId: string, transform?: (t: unknown) => string): void;

  /** バインディング登録ヘルパ群（Req 4.2） */
  bindValue(el: Element, stateId: string, transform?: (t: unknown) => unknown): void;

  /** クラス名全置換（Req 4.5） */
  bindClassAll(el: Element, stateId: string, transform?: (t: unknown) => string): void;

  /** クラス追加（差分）（Req 4.3） */
  bindClassAdd(el: Element, stateId: string, transform?: (t: unknown) => string): void;

  /** スタイル登録（Req 4.4） */
  bindStyle(el: Element, prop: string, stateId: string, transform?: (t: unknown) => string): void;

  /** checked バインディング */
  bindChecked(el: Element, stateId: string, transform?: (t: unknown) => unknown): void;

  /** 配列差分描画（Req 3.6） */
  bindEach(
    parent: Element,
    stateId: string,
    factory: (itemId: string, idx: number) => Element
  ): void;
}

// -----------------------------------------------------------------------
// IIFE 本体
// -----------------------------------------------------------------------

(function (): void {
  // -----------------------------------------------------------------------
  // 内部データ構造
  // -----------------------------------------------------------------------

  /**
   * State エントリ型（内部表現）。
   *
   * - root state（`initState` 経由）: `parent` は `undefined`
   * - slot state（`each` 由来 / `ensureItemState` 経由）:
   *   `parent: { id: parentId, index: idx }` を保持
   *
   * `parent` は slot 初期化時のみ設定し、以降のライフタイム中は不変。
   * 既存コードが `parent` を読まない場合は従来通り動作する（後方互換）。
   *
   * 参照: design.md "Components and Interfaces / Runtime / store / StateEntry 型拡張"
   */
  type StateEntry = {
    value: unknown;
    subs: Set<(v: unknown) => void>;
    parent?: { id: string; index: number };
  };

  /** 状態ストア */
  const states = new Map<string, StateEntry>();

  /** 通知バッチング用セット（microtask でフラッシュ） */
  let pending = new Set<string>();

  /** 再入ガード（Req 2.6） */
  let isFlushing = false;

  /**
   * 内部伝播フラグ（Task 2.2 / Req 5.2）。
   *
   * `propagateToParent` から `setState(parentId, newArr)` を呼ぶ際に true を立てる。
   * これにより flush 中の "set during flush" 警告を slot→parent 伝播パスでのみ抑制し、
   * ユーザー由来（subscriber コールバック内からの直接 set など）の警告は維持する。
   *
   * 参照: design.md "setState（改修）" Implementation Notes / "Risks & Open Questions"
   */
  let isInternalPropagation = false;

  // -----------------------------------------------------------------------
  // 内部ユーティリティ
  // -----------------------------------------------------------------------

  /**
   * 状態エントリを取得。未登録の場合は Error をスロー（Req エラーハンドリング）。
   */
  function getEntry(id: string): StateEntry {
    const entry = states.get(id);
    if (entry === undefined) {
      throw new Error("unknown state: " + id);
    }
    return entry;
  }

  /**
   * 通知バッチフラッシュ（Req 2.6）。
   * 再入中の .set は pending に積まれ、while ループで消化される。
   */
  function flush(): void {
    // 再入ガード: 既にフラッシュ中ならこの呼び出しは不要
    // （queueMicrotask が重複発行された場合の安全弁）
    // 内部の setState 経路は `isFlushing` で再入を抑止しており、外部から
    // flush() を直接呼べる public API も無いため、`isFlushing === true`
    // の早期 return 経路は到達不能な防御的コード（task 7.1 分類 (a)）。
    /* v8 ignore start */
    if (isFlushing) {
      return;
    }
    /* v8 ignore stop */
    isFlushing = true;
    try {
      while (pending.size > 0) {
        const ids = pending;
        pending = new Set<string>();
        ids.forEach(function (id: string): void {
          const entry = states.get(id);
          // pending に追加された ID は setState() 内で必ず states に登録済み。
          // state を削除する public API も無いため `entry === undefined` は到達不能（task 7.1 分類 (a)）。
          /* v8 ignore start */
          if (entry === undefined) return;
          /* v8 ignore stop */
          const value = entry.value;
          entry.subs.forEach(function (sub: (v: unknown) => void): void {
            try {
              sub(value);
            } catch (err: unknown) {
              // 1 購読者の例外が他へ伝播しないようにする（Req エラーハンドリング）
              console.error("[DraftOle] subscriber error for state '" + id + "':", err);
            }
          });
        });
      }
    } finally {
      isFlushing = false;
    }
  }

  /**
   * 状態に値をセットし、バッチング通知をスケジュールする（Req 2.6）。
   * 値が同一（===）の場合はスキップ（Req 3.3）。
   *
   * slot エントリ（`parent` メタデータ付き）の場合、値更新後に
   * `propagateToParent` を呼び出して親配列 state を index 置換コピーで
   * 更新する（Req 1.1〜1.3, 6.1〜6.2 / design.md "setState（改修）"）。
   */
  function setState(id: string, v: unknown): void {
    const entry = getEntry(id);
    if (entry.value === v) return; // Req 3.3: 変化時のみ通知
    entry.value = v;
    pending.add(id);
    if (!isFlushing) {
      queueMicrotask(flush);
    } else if (!isInternalPropagation) {
      // isFlushing 中の .set は pending に積んだだけで、
      // 外側の while ループが消化する（無限ループ防止）
      // ただし直接再入でない場合（subscribe 内から set）は
      // console.warn でガード発動を記録する。
      // slot→parent 伝播はライブラリ内部の意図的連鎖なので警告を抑制する
      // （Task 2.2 / Req 5.2 / design.md "setState（改修）" Implementation Notes）。
      console.warn(
        "[DraftOle] state '" + id + "' was set during flush; will be processed in next batch."
      );
    }

    // slot → 親配列への伝播（Task 2.1）。
    // 親メタデータが無い root state はスキップ（既存挙動を維持）。
    if (entry.parent !== undefined) {
      propagateToParent(entry.parent, v);
    }
  }

  /**
   * slot エントリの値変更を親配列 state へ伝播する（Task 2.1）。
   *
   * 動作:
   *   1. 親 state の現在値を取得し、配列であることを確認する
   *   2. index が範囲内であることを確認する
   *   3. `slice()` で浅いコピーを作成し、当該 index を新値で置換する
   *   4. `setState(parentId, newArr)` で親 state を更新（既存通知経路に乗せる）
   *
   * 防御的ケース（親未登録 / 配列でない / index 範囲外）は throw せず
   * `console.warn` を出してスキップする（Req エラーハンドリング）。
   *
   * 参照: design.md "propagateToParent（新規 private 関数）"
   */
  function propagateToParent(meta: { id: string; index: number }, newSlotValue: unknown): void {
    const parentEntry = states.get(meta.id);
    // 親メタデータは `ensureItemState` 経由でしか付与されず、`ensureItemState` は親 state を
    // 必ず登録した上で slot を作る。state は登録後に削除する public API が無いため、
    // ここの parent 未登録分岐は到達不能な防御的コード（task 7.1 分類 (a)）。
    /* v8 ignore start */
    if (parentEntry === undefined) {
      console.warn(
        "[DraftOle] propagateToParent: parent state '" + meta.id + "' not found; skipping propagation."
      );
      return;
    }
    /* v8 ignore stop */
    const parentValue = parentEntry.value;
    if (!Array.isArray(parentValue)) {
      console.warn(
        "[DraftOle] propagateToParent: parent state '" + meta.id + "' is not an array; skipping propagation."
      );
      return;
    }
    if (meta.index < 0 || meta.index >= parentValue.length) {
      console.warn(
        "[DraftOle] propagateToParent: index " + String(meta.index) +
          " out of range for parent state '" + meta.id + "' (length=" + String(parentValue.length) + "); skipping propagation."
      );
      return;
    }
    const newArr = parentValue.slice();
    newArr[meta.index] = newSlotValue;
    // 内部連鎖フラグを立てて parent へ set。flush 中に呼ばれた場合の
    // "set during flush" 警告をこのパスに限り抑制する（Task 2.2 / Req 5.2）。
    const prev = isInternalPropagation;
    isInternalPropagation = true;
    try {
      setState(meta.id, newArr);
    } finally {
      isInternalPropagation = prev;
    }
  }

  /**
   * each 用スロット State の ID を生成。
   * 設計 R-5: "{parentId}.item{i}" 形式（Req 3.6）
   */
  function itemStateId(parentId: string, idx: number): string {
    return parentId + ".item" + String(idx);
  }

  /**
   * each 用スロット State を初期化（未登録の場合のみ）。
   */
  function ensureItemState(parentId: string, idx: number, value: unknown): string {
    const id = itemStateId(parentId, idx);
    if (!states.has(id)) {
      // 新規 slot 作成時のみ親バックリンクを埋め込む（design: ensureItemState 改修）。
      // 既存 slot の値更新パスでは parent フィールドを書き換えない（不変前提）。
      states.set(id, {
        value: value,
        subs: new Set(),
        parent: { id: parentId, index: idx },
      });
    } else {
      // 既存スロットの値を更新（Req R-6: 値を arr[i] で上書き）
      const entry = states.get(id)!;
      if (entry.value !== value) {
        entry.value = value;
        pending.add(id);
        if (!isFlushing) {
          queueMicrotask(flush);
        }
      }
    }
    return id;
  }

  // -----------------------------------------------------------------------
  // 公開 API
  // -----------------------------------------------------------------------

  const runtime: DraftoleRuntime = {
    /**
     * 状態を初期化（state-init コマンドから呼ばれる）（Req 1.2）。
     * 既登録の場合は無視（二重初期化防止）。
     */
    initState<T>(id: string, initial: T): void {
      if (!states.has(id)) {
        states.set(id, { value: initial, subs: new Set() });
      }
    },

    /**
     * 状態ハンドルを取得。
     * 未登録 ID に対しては Error をスロー（Req エラーハンドリング）。
     */
    state<T>(id: string): RuntimeState<T> {
      getEntry(id); // 存在確認（未登録なら throw）
      return {
        get(): T {
          return getEntry(id).value as T;
        },
        set(v: T): void {
          setState(id, v);
        },
        subscribe(fn: (v: T) => void): () => void {
          const entry = getEntry(id);
          const sub = fn as (v: unknown) => void;
          entry.subs.add(sub);
          // 初回即時通知（購読登録時点の現在値を送る）
          try {
            fn(entry.value as T);
          } catch (err: unknown) {
            console.error("[DraftOle] subscriber error (initial) for state '" + id + "':", err);
          }
          // unsubscribe 関数を返す
          return function (): void {
            const e = states.get(id);
            // subscribe を作るには getEntry(id) で states に登録済みになる必要があり、
            // state を削除する public API も無いため `e === undefined` 分岐は到達不能（task 7.1 分類 (a)）。
            /* v8 ignore start */
            if (e !== undefined) {
              e.subs.delete(sub);
            }
            /* v8 ignore stop */
          };
        },
      };
    },

    /**
     * textContent バインディング（Req 4.1）。
     * transform が指定された場合は状態値を変換して適用する。
     */
    bindText(
      el: Element,
      stateId: string,
      transform?: (t: unknown) => string
    ): void {
      runtime.state<unknown>(stateId).subscribe(function (v: unknown): void {
        const text = transform !== undefined ? transform(v) : String(v);
        el.textContent = text;
      });
    },

    /**
     * input.value バインディング（Req 4.2）。
     */
    bindValue(el: Element, stateId: string, transform?: (t: unknown) => unknown): void {
      runtime.state<unknown>(stateId).subscribe(function (v: unknown): void {
        (el as HTMLInputElement).value = transform !== undefined ? String(transform(v)) : String(v);
      });
    },

    /**
     * className 全置換バインディング（Req 4.5）。
     */
    bindClassAll(
      el: Element,
      stateId: string,
      transform?: (t: unknown) => string
    ): void {
      runtime.state<unknown>(stateId).subscribe(function (v: unknown): void {
        const cls = transform !== undefined ? transform(v) : String(v);
        el.className = cls;
      });
    },

    /**
     * クラス追加（差分）バインディング（Req 4.3）。
     * 旧クラス削除 → 新クラス付与 の差分操作（Req 4.3 AC 3）。
     */
    bindClassAdd(
      el: Element,
      stateId: string,
      transform?: (t: unknown) => string
    ): void {
      let prevClass = "";
      runtime.state<unknown>(stateId).subscribe(function (v: unknown): void {
        const newClass = transform !== undefined ? transform(v) : String(v);
        if (prevClass !== "" && prevClass !== newClass) {
          el.classList.remove(prevClass);
        }
        if (newClass !== "" && newClass !== prevClass) {
          el.classList.add(newClass);
        }
        prevClass = newClass;
      });
    },

    /**
     * style プロパティバインディング（Req 4.4）。
     */
    bindStyle(
      el: Element,
      prop: string,
      stateId: string,
      transform?: (t: unknown) => string
    ): void {
      runtime.state<unknown>(stateId).subscribe(function (v: unknown): void {
        const val = transform !== undefined ? transform(v) : String(v);
        (el as HTMLElement).style.setProperty(prop, val);
      });
    },

    /**
     * checked バインディング（input[type=checkbox] 等）。
     */
    bindChecked(el: Element, stateId: string, transform?: (t: unknown) => unknown): void {
      runtime.state<unknown>(stateId).subscribe(function (v: unknown): void {
        (el as HTMLInputElement).checked = transform !== undefined ? Boolean(transform(v)) : Boolean(v);
      });
    },

    /**
     * 配列差分描画バインディング（Req 3.6）。
     *
     * アルゴリズム（Req 3.6 AC 6, Design R-5, R-6）:
     *   1. 配列長増加 → factory で DOM 要素追加
     *   2. 配列長減少 → lastChild を removeChild
     *   3. 各スロット State を "{stateId}.item{i}" で仮想 State として更新
     */
    bindEach(
      parent: Element,
      stateId: string,
      factory: (itemId: string, idx: number) => Element
    ): void {
      runtime.state<unknown[]>(stateId).subscribe(function (arr: unknown[]): void {
        // Step 1: スロット State を更新 / 必要なら初期化
        for (let i = 0; i < arr.length; i++) {
          ensureItemState(stateId, i, arr[i]);
        }

        // Step 2: DOM 要素数と配列長を同期
        // 不足分を追加
        while (parent.children.length < arr.length) {
          const idx = parent.children.length;
          // 上の Step 1 で `ensureItemState` を全 index について呼び済みであり、
          // ここで slot が未登録になることは無い。万一未登録の場合でも
          // 親バックリンクを欠いた slot を直接 set してはならない（Task 2.1 の
          // 親伝播が機能しなくなるため）。`ensureItemState` 経由で必ず親メタ付きで作る。
          const itemId = ensureItemState(stateId, idx, arr[idx]);
          const childEl = factory(itemId, idx);
          parent.appendChild(childEl);
        }

        // 余剰分を削除
        while (parent.children.length > arr.length) {
          const last = parent.lastChild;
          // `parent.children.length > arr.length` の while ループに入った時点で必ず子要素が存在し、
          // `parent.lastChild` は非 null。`last === null` 分岐は到達不能な防御的コード（task 7.1 分類 (a)）。
          /* v8 ignore start */
          if (last !== null) {
            parent.removeChild(last);
          }
          /* v8 ignore stop */
        }

        // Step 3: 既存スロット State の値を最新値で更新（購読者への通知を発火）
        for (let i = 0; i < arr.length; i++) {
          const itemId = itemStateId(stateId, i);
          const entry = states.get(itemId);
          // Step 1 の `ensureItemState` が直前に全 index へ最新値を反映済みのため、
          // ここでの `entry.value !== arr[i]` 真分岐の中身（pending 追加）は通常経路で
          // 到達不能な防御的コード（task 7.1 分類 (a)）。`entry !== undefined` も
          // Step 1 通過後は必ず true で短絡しない。
          /* v8 ignore start */
          if (entry !== undefined && entry.value !== arr[i]) {
            entry.value = arr[i];
            pending.add(itemId);
          }
          /* v8 ignore stop */
        }
        // pending があれば microtask に通知をスケジュール
        if (pending.size > 0 && !isFlushing) {
          queueMicrotask(flush);
        }
      });
    },
  };

  // -----------------------------------------------------------------------
  // グローバル公開（Req 5.3: 単一名前空間のみ）
  // -----------------------------------------------------------------------

  (window as Window & typeof globalThis & { __draftole__: DraftoleRuntime })[
    "__draftole__"
  ] = runtime;
})();
