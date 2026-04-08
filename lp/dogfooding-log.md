# DraftOle LP ドッグフーディング記録

実験日: 2026-04-08

---

## Task 1: プロジェクトセットアップ

### 実行結果

- `node --experimental-strip-types lp/lp-builder.ts` で正常実行
- `lp/output/index.html` と `lp/output/style.css` が生成された

### 発見事項

1. **`<!DOCTYPE html>` が出力されない** — `Root.render()` は `<!DOCTYPE html>` 宣言を含まない。HTML5準拠には手動追加か、Rootオプションが必要
2. **JSファイルが未生成** — `renderJs()` が空文字列を返す場合、`script.js` は出力されない（これは正しい挙動と思われる）
3. **`<link>` タグのインデント不整合** — FileExporterが挿入する `<link rel="stylesheet">` のインデントが `<head>` 内の他要素と揃っていない（8スペースではなく4スペース）
4. **APIの使い勝手** — `html()`, `head()`, `body()` などのファクトリ関数 + `addChildren()` の組み合わせは直感的。最小構成で動作確認できた
5. **ESM + TypeScript** — `--experimental-strip-types` で `.ts` ファイルを直接実行可能。ただし実験的機能の警告が出る
