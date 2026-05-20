/**
 * 1.0.0 移行 example: `AppContext` 型 → `AppDocument` 型
 *
 * Before (0.x.y、`'draft-ole'` または `'draft-ole/app'` から import 可能):
 * ```typescript
 * import { app } from 'draft-ole';
 * import type { AppContext } from 'draft-ole';
 * const ctx: AppContext = app();
 * const counter = ctx.state(0);
 * ```
 *
 * After (1.0.0): `AppDocument`（`app()` の戻り値型）を使う
 *
 * - `AppDocument` は `AppContext` の構造的サブタイプであり、`.state<T>()` メソッドは同じ
 * - `app()` の戻り値型自体が `AppDocument` のため、型注釈不要のケースも多い
 */

import { app, AppDocument } from 'draft-ole';

// 型注釈なし（推奨、`app()` が `AppDocument` を返す）
const ctx = app();
const counter = ctx.state(0);

// 明示型注釈する場合: `AppDocument` を使う
const explicitCtx: AppDocument = app();
const explicitCounter = explicitCtx.state('hello');

export { ctx, counter, explicitCtx, explicitCounter };
