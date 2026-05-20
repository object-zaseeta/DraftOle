export { app } from './app.js';
export { AppDocument } from './app-document.js';
export type { AppView } from './app-document.js';
export type { AppOptions } from './app-options.js';
// `AppContext` は 1.0.0 で公開面から除去（利用者は `AppDocument` を使うこと）。
// 内部型として `src/app/app.ts` に保持。
export type { Computed, State } from '../js/vanilla/state/state.js';
