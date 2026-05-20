# E2E 手動運用手順

> P9 (test-coverage-completeness) で導入された Playwright e2e / 視覚回帰 / a11y / meta テストの **手動で実行が必要な手順を集約**。日次の `pnpm verify` で自動実行されるものは原則ここに書かない。
>
> 関連 spec: `.kiro/specs/test-coverage-completeness/`（gitignore 配下）
> 関連 follow-up: `.internal/ai_Docs/myTask.md` の P10（DXA11Y-1 / REACTIVE-1）

---

## 1. 初期セットアップ

新しいクローン・ブランチ切替後など。

```bash
pnpm install                            # @axe-core/playwright 等の依存解決
pnpm exec playwright install chromium   # Chromium ブラウザバイナリ取得（初回のみ）
```

確認:
```bash
pnpm exec playwright test --list --reporter json | \
  node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('projects:',j.config.projects.length)})"
# → projects: 9 が出れば OK
```

---

## 2. 通常の e2e 実行

### 2.1 全 projects 走査

```bash
pnpm test:e2e
```

`pnpm verify` 内でも同じものが走るので、日常はそちらで十分。

### 2.2 個別 project

```bash
pnpm test:e2e --project=todo-app
pnpm test:e2e --project=cart-app
pnpm test:e2e --project=card-gallery
pnpm test:e2e --project=app-counter
pnpm test:e2e --project=app-form
pnpm test:e2e --project=page-landing
pnpm test:e2e --project=page-minimal
pnpm test:e2e --project=mvp-demo5
pnpm test:e2e --project=mvp-demo8
```

### 2.3 UI モード（デバッグ用）

```bash
pnpm test:e2e:ui
```

### 2.4 失敗時のレポート

```bash
pnpm test:e2e:report
# → http://localhost:9323 で HTML レポートを開く
```

---

## 3. 視覚回帰 baseline の初期化・更新

視覚回帰アサーション（`expectVisualMatch`）がある spec のみ。現状 baseline を持つのは:
- `page-landing.spec.ts`（hero 全体ショット）
- `todo-app.spec.ts`（task 4.1 で追加予定）
- `card-gallery.spec.ts`（task 4.3 で追加予定）

baseline は `tests/e2e/__screenshots__/{spec}.spec.ts/` 配下に格納。

### 3.1 新規 baseline 生成（初回 / 視覚回帰アサーションを追加した直後）

```bash
pnpm test:e2e --update-snapshots --project=page-landing
```

生成された PNG を git で必ず**目視確認**してから commit。

### 3.2 意図的な UI 変更後の baseline 更新

```bash
# 影響を受ける projects のみ更新
pnpm test:e2e --update-snapshots --project=page-landing --project=todo-app --project=card-gallery
```

更新前に必ず:
- 変更が意図的であることを確認（`git diff` の対象 demo / View DSL を読む）
- diff 画像を `.out/test-results/` で目視確認

### 3.3 OS 揺れ対処

baseline は macOS で生成・コミットする方針。Linux / Windows 環境で実行すると差分が出る場合があり、許容差は `playwright.config.ts` の `expect.toHaveScreenshot.maxDiffPixelRatio: 0.01` で吸収する。それでも安定しない場合:

- 該当 spec のみ `expectVisualMatch(page, 'name', { maxDiffPixelRatio: 0.05 })` で個別緩和
- フォントロード未完了が原因なら `await page.waitForLoadState('networkidle')` を増やす

---

## 4. a11y 違反対応

`expectNoA11yViolations(page)` が fail した場合:

### 4.1 違反内容を読む

エラー出力の `axe violations:` ブロックを確認。例:
```
landmark-one-main: Document should have one main landmark
region: All page content should be contained by landmarks
```

### 4.2 対処の意思決定フロー

1. **demo / View DSL 側で修正できるか？**
   → できるなら修正（例: `<main>` ラップ、`<h1>` 化）
2. **構造的に対処不能 or upstream 課題か？**
   → spec の a11y test で `disableRules: ['rule-id']` で除外し、**理由をコメント必須**

例:
```ts
test('a11y violations: none', async ({ page }) => {
  await page.waitForLoadState('networkidle');
  await expectNoA11yViolations(page, {
    // landmark-one-main: View DSL に <main> ファクトリが無いため除外。
    // 根本対応は P10 DXA11Y-1（myTask.md）。
    disableRules: ['landmark-one-main', 'region'],
  });
});
```

### 4.3 既知の disableRules

| Spec | 除外ルール | 理由 | 解消先 |
|---|---|---|---|
| `page-landing.spec.ts` | `page-has-heading-one` | View DSL の `Text()` が `<h1>` を生成しない | P10 DXA11Y-1 |
| `page-minimal.spec.ts` | `page-has-heading-one` | 同上 | P10 DXA11Y-1 |
| `todo-app.spec.ts` | `landmark-one-main`, `region`, `color-contrast` | `<main>` 不在 + dark theme muted 色 | P10 DXA11Y-1 / scope 外 |
| `cart-app.spec.ts` | `landmark-one-main`, `region`, `color-contrast`, `button-name` | 上記 + ✕ アイコンボタンの aria-label 不足 | 同上 / production 化時要対応 |
| `card-gallery.spec.ts` | `landmark-one-main`, `region`, `color-contrast` | 同上 | 同上 |
| `mvp-demo5.spec.ts` | `landmark-one-main`, `region`, `color-contrast` | 同上 | 同上 |
| `mvp-demo8.spec.ts` | `landmark-one-main`, `region`, `color-contrast` | 同上 | 同上 |
| `app-counter.spec.ts` | `landmark-one-main`, `region`, `color-contrast` | light theme でも muted 色が WCAG AA 未達 | 同上 |
| `app-form.spec.ts` | `landmark-one-main`, `region`, `color-contrast` | 同上 | 同上 |

**P10 DXA11Y-1 完了時に `landmark-one-main` / `region` / `page-has-heading-one` を削除して a11y test が pass することが完了条件**。`color-contrast` は demo theme の調整（production 品質を demo に課さない方針 / myTask.md P10 スコープ境界）に依存するため恒久的に許容する可能性あり。

---

## 5. 新規 demo / spec を追加するときの手順

### 5.1 demo 側

1. `examples/interactive/{name}.ts` または `tests/examples/fixtures/mvp-demo{N}.ts` を新規作成
2. demo の末尾で `.out/runs/{snake_name}/` に書き出す:
   - `Root` ベース: `root.export('./.out/runs/{snake_name}')`
   - `page()` ベース: `doc.export('./.out/runs/{snake_name}')`
3. `package.json` に `demo:{name}` script を追加（必要なら）

### 5.2 Playwright 側

1. `playwright.config.ts` の `projects[]` と `webServer[]` にエントリ追加
   - 新規ポート（既存の最大 +1）
   - webServer command: `pnpm demo:{name} && npx serve .out/runs/{snake_name} -p PORT`
2. `tests/e2e/{name}.spec.ts` を作成
   - `expectNoA11yViolations(page)` ブロックは必須
   - 視覚回帰が必要なら `expectVisualMatch(page, '{name}-default.png')` を追加

### 5.3 meta テスト側

1. `tests/meta/e2e-coverage.test.ts` の `REQUIRED` 配列に `{ demo: '{basename}', project: '{project-name}' }` を追加
2. もし TODO に入れていたなら TODO から外す

### 5.4 baseline 生成（視覚回帰追加時のみ）

```bash
pnpm test:e2e --update-snapshots --project={name}
git add tests/e2e/__screenshots__/{name}.spec.ts/
```

### 5.5 動作確認

```bash
pnpm test:e2e --project={name}    # 新 spec が pass
pnpm test                          # meta テスト含めて pass
pnpm verify                        # 全段 green
```

---

## 6. meta テスト fail への対処

`tests/meta/e2e-coverage.test.ts` が fail したら:

### 6.1 「未分類の demo / fixture が見つかった」

- 新 demo を追加したが REQUIRED / WHITELIST / TODO のどれにも登録していない
- → meta test 内の対応する配列に登録（`§5.3` 参照）

### 6.2 「必須 demo は全て Playwright projects[] に登録されている」が fail

- REQUIRED に登録されている demo に対応する Playwright project が `playwright.config.ts` から欠落している
- → playwright.config.ts に project + webServer を復活、または REQUIRED から外す（**通常は前者**）

### 6.3 重複検査が fail

- WHITELIST と REQUIRED 両方に同じエントリが入っている等
- → どちらかから削除

---

## 7. Phase A → Phase B 切替（P9 task 6.1）

新規 spec（page-landing / page-minimal / mvp-demo5 / mvp-demo8）が安定して pass したら、meta テストの必須リストを昇格する。

`tests/meta/e2e-coverage.test.ts` の `REQUIRED` 配列のコメントアウト 4 行を解除:

```ts
const REQUIRED: ReadonlyArray<{ demo: string; project: string }> = [
  { demo: 'mvp-demo', project: 'todo-app' },
  { demo: 'mvp-demo7', project: 'cart-app' },
  { demo: 'card-gallery', project: 'card-gallery' },
  { demo: 'app-counter', project: 'app-counter' },
  { demo: 'app-form', project: 'app-form' },
  // ↓ コメントアウトを解除する
  { demo: 'page-landing', project: 'page-landing' },
  { demo: 'page-minimal', project: 'page-minimal' },
  { demo: 'mvp-demo5',    project: 'mvp-demo5' },
  { demo: 'mvp-demo8',    project: 'mvp-demo8' },
];
```

そして `TODO` から該当 4 件を削除。

確認:
```bash
pnpm test       # meta test pass
pnpm verify     # 全段 green
```

---

## 8. トラブルシュート

### 8.1 webServer タイムアウト

```
Error: Timed out waiting 60000ms from config.webServer.
```

**原因候補**:
- demo が `.out/runs/{name}/` を作っていない（`console.log(doc.render())` だけになっている）
  → demo 側に `doc.export('./.out/runs/{name}')` を追加
- 該当ポートが既に使用中
  → `lsof -i :PORT` で確認、別プロセスを停止

### 8.2 タイポ project 名

```
Error: Project(s) "page-landin" not found.
```

エラーメッセージの `Available projects:` リストから正しい名前をコピペ。

### 8.3 baseline が再現しない

- フォントロード未完了 → `waitForLoadState('networkidle')` を `expectVisualMatch` 前に追加
- アニメーション → `expect.toHaveScreenshot` の `animations: 'disabled'` が効いているか確認
- OS 差 → `§3.3` 参照

---

## 9. クイックリファレンス

| やりたいこと | コマンド |
|---|---|
| 全 e2e 実行 | `pnpm test:e2e` |
| 単一 project | `pnpm test:e2e --project=NAME` |
| baseline 更新 | `pnpm test:e2e --update-snapshots --project=NAME` |
| デバッグ UI | `pnpm test:e2e:ui` |
| HTML レポート | `pnpm test:e2e:report` |
| meta test だけ | `pnpm exec vitest run tests/meta/e2e-coverage.test.ts` |
| project 一覧 | `pnpm exec playwright test --list` |
| 完全 verify | `pnpm verify` |
