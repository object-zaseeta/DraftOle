/**
 * Task 7.1: `VanillaScript` + `VanillaScope` の統合シナリオ／クロスカッティングテスト。
 *
 * 本ファイルは他のユニットテスト（`vanilla-script-builder.test.ts` 等）を補完し、
 * 以下をカバーする：
 *
 * 1. 複数 API（event / query / dom / tree）を束ねたエンドツーエンドの出力スナップショット。
 * 2. `append` 呼び出し順 == `render()` 出力順の再検証（Req 7.4）。
 * 3. すべての公開 API を呼び出した出力に対する `jQuery` / `$` 混入の横断的な正規表現検証
 *    （Req 1.5, 7.1）。
 *
 * 対応 requirement: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4,
 *                   3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4,
 *                   5.1, 5.2, 5.3, 6.1, 6.2, 7.1, 7.4
 */

import { describe, expect, it } from 'vitest';

import {
  addClass,
  appendChild,
  attach,
  containsClass,
  createVanillaScript,
  filterNot,
  forEach,
  getText,
  getValue,
  length,
  on,
  onDomReady,
  query,
  queryAll,
  ref,
  remove,
  removeAll,
  removeClass,
  setStyle,
  setText,
  setValue,
  toggleClass,
} from '../../../src/js/vanilla/index.ts';

/**
 * すべての主要 API を 1 度以上叩いたスクリプトをレンダリングするヘルパ。
 * 個別テストが担保するのは「意味の正しさ」であり、本関数の出力は
 * クロスカッティング検査（jQuery/$ 非混入・スナップショット安定）の対象となる。
 */
function renderAllApis(): string {
  const script = createVanillaScript();

  // 関数宣言: updateCount（queryAll + filterNot + length）
  script.fn('updateCount', (s) => {
    const list = queryAll(s, '#todo-list .item');
    const remaining = filterNot(list, (it) => it.containsClass('done'));
    const count = length(remaining);
    const label = query(s, '#count');
    setText(s, label, count);
  });

  // 関数宣言: clearDone（queryAll + removeAll）
  script.fn('clearDone', (s) => {
    removeAll(s, queryAll(s, '#todo-list .item.done'));
  });

  // 関数宣言: addTodo（query + cache + value + appendChild + setValue）
  script.fn('addTodo', (s) => {
    const input = query<HTMLInputElement>(s, '#todo-input').cache('input');
    const list = query(s, '#todo-list');
    const text = getValue(input);
    appendChild(s, list, s.raw(`createTodoItem(${text.code})`));
    setValue(s, input, '');
  });

  // DOMContentLoaded: イベント登録・初期化
  onDomReady(script, (s) => {
    const addBtn = query(s, '#add-btn');
    const clearBtn = query(s, '#clear-btn');
    const input = query<HTMLInputElement>(s, '#todo-input');
    const firstItem = query(s, '.item');

    on(s, addBtn, 'click', (inner) => {
      inner.call('addTodo');
    });
    on(s, clearBtn, 'click', (inner) => {
      inner.call('clearDone');
    });
    on(s, input, 'keydown', (inner, e) => {
      inner.ifThen(e.key.eq('Enter'), (thenScope) => {
        thenScope.call('addTodo');
      });
    });

    // classList 系を一通り叩く
    toggleClass(s, firstItem, 'done');
    toggleClass(s, firstItem, 'active', firstItem.containsClass('done'));
    addClass(s, firstItem, 'seen');
    removeClass(s, firstItem, 'new');

    // containsClass 自由関数（JsBoolExpr を返す）の呼び出し
    const isDone = containsClass(firstItem, 'done');
    s.ifThen(isDone, (inner) => inner.call('noop'));

    // style 設定（WritableStyleKey 経由）
    setStyle(s, firstItem, 'borderColor', 'red');

    // getText を JsExpr として利用
    const txt = getText(firstItem);
    s.call('console.log', [txt]);

    // forEach による DOM 反復（すべての要素に remove）
    const all = queryAll(s, '#tmp .item');
    forEach(s, all, (inner, item) => {
      remove(inner, item);
    });

    // 単体 remove
    const doomed = query(s, '#doomed');
    remove(s, doomed);

    // 初期化呼び出し
    s.call('updateCount');
  });

  return script.render();
}

describe('VanillaScript + VanillaScope 統合シナリオ (Req 1.x / 2.x / 3.x / 4.x / 5.x / 7.4)', () => {
  it('全 API を束ねたレンダリング出力がスナップショットとして安定する', () => {
    // toMatchInlineSnapshot は初回に埋め込み、後続はリグレッション検知になる。
    expect(renderAllApis()).toMatchSnapshot();
  });

  it('append 順序と render 出力順序が一致する（Req 7.4）', () => {
    const script = createVanillaScript();
    // 意図順: raw1 → fn(a) → raw2 → fn(b) → raw3 → onDomReady
    script.append({ type: 'raw', code: '/* m1 */' });
    script.fn('a', (s) => s.return());
    script.append({ type: 'raw', code: '/* m2 */' });
    script.fn('b', (s) => s.return());
    script.append({ type: 'raw', code: '/* m3 */' });
    onDomReady(script, (s) => s.call('init'));
    const out = script.render();

    const positions = [
      out.indexOf('/* m1 */'),
      out.indexOf('function a('),
      out.indexOf('/* m2 */'),
      out.indexOf('function b('),
      out.indexOf('/* m3 */'),
      out.indexOf('init();'),
    ];
    // すべて見つかり、かつ単調増加
    expect(positions.every((p) => p >= 0)).toBe(true);
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]!);
    }
  });

  it('render() は冪等（Req 7.2 carried）', () => {
    const a = renderAllApis();
    const b = renderAllApis();
    expect(a).toBe(b);
  });
});

describe('jQuery / $ exclusion — 横断的な正規表現検査 (Req 1.5, 7.1)', () => {
  /**
   * 出力中の文字列リテラルを取り除いてから検査することで、
   * セレクタ（例 "#id"）に現れる `#` などの記号と、JS 識別子 `$` を区別する。
   */
  function stripStringLiterals(src: string): string {
    return src
      .replace(/"(?:[^"\\]|\\.)*"/g, '""')
      .replace(/'(?:[^'\\]|\\.)*'/g, "''");
  }

  it('全 API を束ねた出力に jQuery 識別子が現れない', () => {
    const out = renderAllApis();
    expect(out).not.toMatch(/\bjQuery\b/);
  });

  it('全 API を束ねた出力に単独の $ 識別子が現れない（文字列リテラル除外）', () => {
    const out = renderAllApis();
    const stripped = stripStringLiterals(out);
    // `$` が識別子として現れるパターン：直前が非英数、直後も非英数
    expect(stripped).not.toMatch(/(^|[^A-Za-z0-9_])\$(?![A-Za-z0-9_])/);
  });

  it('attach() 経由の出力にも jQuery / $ が現れない', () => {
    const cb = attach((scope, refs) => {
      setText(scope, refs.root, 'x');
      addClass(scope, refs.root, 'seen');
      setStyle(scope, refs.root, 'color', 'blue');
    });
    const out = cb({ root: 'root' });
    expect(out).not.toMatch(/\bjQuery\b/);
    const stripped = stripStringLiterals(out);
    expect(stripped).not.toMatch(/(^|[^A-Za-z0-9_])\$(?![A-Za-z0-9_])/);
  });

  it('ref() で構築した ElementRef を各 API に渡しても jQuery / $ が混入しない', () => {
    const script = createVanillaScript();
    script.fn('misc', (s) => {
      const el = ref('el');
      const input = ref<HTMLInputElement>('inp');
      setText(s, el, 'hi');
      setValue(s, input, '');
      toggleClass(s, el, 'x');
      setStyle(s, el, 'display', 'none');
      appendChild(s, el, ref('child'));
      remove(s, el);
    });
    const out = script.render();
    expect(out).not.toMatch(/\bjQuery\b/);
    expect(stripStringLiterals(out)).not.toMatch(/(^|[^A-Za-z0-9_])\$(?![A-Za-z0-9_])/);
  });
});
