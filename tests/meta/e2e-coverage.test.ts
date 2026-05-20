/**
 * E2E カバレッジ照合 meta テスト（P9: test-coverage-completeness）
 *
 * 目的:
 *   demo / fixture を機械的に列挙し、必須リストに登録された demo に対応する
 *   Playwright project が `playwright.config.ts` に存在することを検証する。
 *   新規 demo を必須化したのに対応 spec / project を作り忘れた場合、
 *   `pnpm verify` の vitest 段階（e2e より前）で fail させる。
 *
 * 運用メモ:
 *   - examples-fixtures-reorganization-and-e2e-completion spec 完了により、
 *     interactive / page / showcase 系の 12 demo すべてが REQUIRED に昇格し、
 *     旧 MVP 段階バリエーション (`mvp-demo0` 〜 `mvp-demo9` / `mvp-demo-colocated` /
 *     `mvp-demo-showcase`) は retire 済み (git 履歴で参照可能)。
 *   - WHITELIST に載った fixture は突合対象から除外する。理由は WHITELIST 配列の
 *     コメントに必ず記述する。
 *   - 列挙スコープは要件 1.1 に従い `examples/interactive/`,
 *     `examples/`, `tests/examples/fixtures/` の `.ts` ファイル。
 *   - WHITELIST / REQUIRED / TODO の分類 policy は
 *     [docs/positioning.md の役割境界 policy](../../docs/positioning.md#examples-と-testsexamplesfixtures-の役割境界) を正本とする。
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '../..');

const DEMO_DIRS = [
  'examples/interactive',
  'examples',
  'tests/examples/fixtures',
];

/**
 * 列挙はするが「e2e 必須化対象ではない」demo / fixture。
 * 各エントリには除外理由を必ず添える。
 */
const WHITELIST: ReadonlyArray<{ name: string; reason: string }> = [
  { name: 'run-flag.fixture.ts', reason: '--run フラグ検証用の fixture（実行 demo ではない）' },
  { name: 'whitelist-violation.fixture.ts', reason: 'transformer ホワイトリスト違反検出用 fixture（実行 demo ではない）' },
  { name: 'transformer-warning.fixture.ts', reason: 'transformer DT002 警告経路検証用 fixture（build-examples-ondiagnostics spec、実行 demo ではない）' },
  { name: 'mvp-demo-transformed.fixture.ts', reason: 'transformer byte-equality 確認用 fixture（実行 demo ではない）' },
  { name: 'mvp-demo-helper.ts', reason: 'handler-transformer-dx spec の helper-inline-recovery 用 fixture。jsdom 上の runtime test (tests/examples/mvp-demo-helper.test.ts) で click → state 更新を検証済みのため Playwright e2e 不要' },
];

/**
 * 必須 demo と対応 Playwright project のマッピング。
 *
 * 各エントリは `demo basename` → `Playwright project 名` のマッピング。
 * basename には `.ts` を含めない。
 *
 * examples-fixtures-reorganization-and-e2e-completion spec 完了により
 * 全 12 demo（interactive 系 6 + page/showcase 系 6）が必須化された。
 */
const REQUIRED: ReadonlyArray<{ demo: string; project: string }> = [
  { demo: 'mvp-demo', project: 'todo-app' },
  { demo: 'card-gallery', project: 'card-gallery' },
  { demo: 'app-counter', project: 'app-counter' },
  { demo: 'app-form', project: 'app-form' },
  { demo: 'page-landing', project: 'page-landing' },
  { demo: 'page-minimal', project: 'page-minimal' },
  { demo: 'shopping-cart', project: 'shopping-cart' },
  { demo: 'priority-tasks', project: 'priority-tasks' },
  { demo: 'page-with-app-slot', project: 'page-with-app-slot' },
  { demo: 'showcase-button', project: 'showcase-button' },
  { demo: 'showcase-card', project: 'showcase-card' },
  { demo: 'showcase-list', project: 'showcase-list' },
];

/**
 * 将来必須化候補として認識している demo。
 * 本 spec 完了で全 retire 済み、TODO は空集合。
 */
const TODO: ReadonlySet<string> = new Set<string>();

async function listDemoFiles(): Promise<string[]> {
  const seen = new Set<string>();
  for (const rel of DEMO_DIRS) {
    const dir = path.join(REPO_ROOT, rel);
    let entries: string[];
    try {
      entries = await fs.readdir(dir);
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.endsWith('.ts')) continue;
      if (entry.endsWith('.d.ts')) continue;
      seen.add(entry);
    }
  }
  return [...seen].sort();
}

async function loadPlaywrightProjects(): Promise<string[]> {
  const configPath = path.join(REPO_ROOT, 'playwright.config.ts');
  const mod = (await import(configPath)) as {
    default: { projects?: ReadonlyArray<{ name?: string }> };
  };
  const projects = mod.default?.projects ?? [];
  return projects
    .map((p) => p.name)
    .filter((n): n is string => typeof n === 'string');
}

describe('e2e coverage meta test', () => {
  it('whitelist / required / todo は重複しない', () => {
    const whiteSet = new Set(WHITELIST.map((w) => w.name));
    const requiredSet = new Set(REQUIRED.map((r) => `${r.demo}.ts`));
    const overlap = (a: ReadonlySet<string>, b: ReadonlySet<string>) =>
      [...a].filter((x) => b.has(x));
    expect(overlap(whiteSet, requiredSet)).toEqual([]);
    expect(overlap(whiteSet, TODO)).toEqual([]);
    expect(overlap(requiredSet, TODO)).toEqual([]);
  });

  it('必須 demo は全て Playwright projects[] に登録されている', async () => {
    const projects = await loadPlaywrightProjects();
    const projectSet = new Set(projects);
    const missing = REQUIRED.filter((r) => !projectSet.has(r.project)).map(
      (r) => `${r.demo} (expected project=${r.project})`,
    );
    expect(missing).toEqual([]);
  });

  it('demo ファイルは required / whitelist / todo のいずれかに分類されている', async () => {
    const files = await listDemoFiles();
    const whiteSet = new Set(WHITELIST.map((w) => w.name));
    const requiredSet = new Set(REQUIRED.map((r) => `${r.demo}.ts`));

    const unclassified = files.filter(
      (f) => !whiteSet.has(f) && !requiredSet.has(f) && !TODO.has(f),
    );
    expect(
      unclassified,
      `未分類の demo / fixture が見つかった。tests/meta/e2e-coverage.test.ts の REQUIRED / WHITELIST / TODO のいずれかに登録してください: ${unclassified.join(', ')}`,
    ).toEqual([]);
  });
});
