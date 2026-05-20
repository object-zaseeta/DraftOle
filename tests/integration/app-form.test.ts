/**
 * app() → state() → input/button handler → exportTo() 統合テスト (Form)
 *
 * Boundary: tests/integration/app-form.test.ts
 *
 * 注: 統合テストは TypeScript transformer を経由しないため、
 * arrow handler の代わりに emitHandler() を直接使用する
 * (transformer がアロー関数を変換した結果と等価)。
 */

import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../src/app/app';
import { button, div, input, span } from '../../src/html/tags/index';
import { emitHandler } from '../../src/js/vanilla/emit-handler';

let tmpDir: string;

beforeEach(() => {
  tmpDir = join(tmpdir(), `app-form-test-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });
});

afterEach(() => {
  if (existsSync(tmpDir)) {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

describe('app() フォーム統合シナリオ', () => {
  it('input.value(state) + on("input") + click 送信で HTML/JS が生成される', () => {
    const doc = app({ title: 'Form', lang: 'ja', wrapDOMReady: true });
    const name = doc.state('');
    const submitted = doc.state('');

    const nameId = name._runtimeId;
    const submittedId = submitted._runtimeId;

    const preview = span().text(name.map((v: string) => (v.length > 0 ? v : '（未入力）')));
    const result = span().text(submitted.map((v: string) => (v.length > 0 ? `送信済み: ${v}` : '')));

    const nameInput = input({ type: 'text', placeholder: 'お名前を入力…' })
      .value(name)
      .on(
        'input',
        emitHandler(`__draftole__.state('${nameId}').set(e.target.value)`, ['e']),
      );

    const submitBtn = button({ type: 'button' }, '送信').on(
      'click',
      emitHandler(
        `__draftole__.state('${submittedId}').set(__draftole__.state('${nameId}').get()); ` +
          `__draftole__.state('${nameId}').set('')`,
      ),
    );

    const clearBtn = button({ type: 'button' }, 'クリア').on(
      'click',
      emitHandler(
        `__draftole__.state('${nameId}').set(''); __draftole__.state('${submittedId}').set('')`,
      ),
    );

    const view = div(preview, result, nameInput, submitBtn, clearBtn);

    doc.exportTo(view, tmpDir);

    expect(existsSync(join(tmpDir, 'index.html'))).toBe(true);
    expect(existsSync(join(tmpDir, 'script.js'))).toBe(true);

    const html = readFileSync(join(tmpDir, 'index.html'), 'utf8');
    const js = readFileSync(join(tmpDir, 'script.js'), 'utf8');

    // HTML: app() オプションが反映される
    expect(html).toContain('<title>Form</title>');
    expect(html).toContain('<html lang="ja">');
    expect(html).toContain('<input');
    expect(html).toContain('placeholder="お名前を入力…"');
    expect(html).toContain('送信');
    expect(html).toContain('クリア');

    // JS: wrapDOMReady: true → DOMContentLoaded ラップ
    expect(js).toContain('DOMContentLoaded');

    // JS: 2 つの state ID が両方含まれる
    expect(js).toContain(nameId);
    expect(js).toContain(submittedId);

    // JS: input イベントと click イベントが結線される
    expect(js).toMatch(/addEventListener\(['"]input['"]/);
    expect(js).toMatch(/addEventListener\(['"]click['"]/);

    // JS: input ハンドラ内で e.target.value から state.set が呼ばれる
    expect(js).toContain('e.target.value');
  });

  it('クリアハンドラは name と submitted の両 state を空文字に戻す', () => {
    const doc = app({ title: 'Form Clear', wrapDOMReady: false });
    const name = doc.state('alice');
    const submitted = doc.state('alice');

    const nameId = name._runtimeId;
    const submittedId = submitted._runtimeId;

    const clearBtn = button({ type: 'button' }, 'クリア').on(
      'click',
      emitHandler(
        `__draftole__.state('${nameId}').set(''); __draftole__.state('${submittedId}').set('')`,
      ),
    );

    doc.exportTo(div(clearBtn), tmpDir);

    const js = readFileSync(join(tmpDir, 'script.js'), 'utf8');

    // 両 state を ''（空文字リテラル）に set する呼び出しが含まれる
    expect(js).toContain(`state('${nameId}').set('')`);
    expect(js).toContain(`state('${submittedId}').set('')`);
  });
});
