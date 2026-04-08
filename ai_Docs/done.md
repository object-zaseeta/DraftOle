# DraftOle TypeScript版 - 完了タスクアーカイブ

---

## DF修正（ドッグフーディング由来）

### [x] DF-1: collectCssStyleString() 子再帰修正（2026-04-08完了）
- **対象**: `src/html/elements/html-tag.ts:313-315`
- **現状**: `collectCssStyleString()` は `this._css.render()` のみ返し、子要素に再帰しない。`collectJsContent()` は再帰している
- **改善**: `collectJsContent()` と同様に子要素を再帰走査し、全子孫のCSSを収集する
- **影響**: Root.collectCssStyleString() は既に子を走査するが、孫以降はHtmlTag側の再帰が必要
- **コミット**: `99e387b`
