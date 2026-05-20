// Public secondary entry: app DSL.
// See docs/positioning.md for product positioning.

export { app, AppDocument } from '../app/index.js';

// `AppContext` は 1.0.0 で公開面から除去（利用者は `AppDocument` を使うこと）。
export type { AppView, AppOptions } from '../app/index.js';
export type { Computed, State } from '../app/index.js';
