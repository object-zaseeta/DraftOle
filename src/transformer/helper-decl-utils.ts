/**
 * helper-decl-utils — helper 宣言判定の共有ユーティリティ
 *
 * 仕様: `.kiro/specs/helper-inline-recovery-followups/design.md`
 *   - Components / `helper-decl-utils.ts`
 *   - Requirements 3.1, 3.2
 *
 * 単一責任:
 *   1. Identifier の Symbol/alias 解決を `valueDeclaration` まで辿る
 *   2. VariableDeclaration がモジュールトップレベル直下か判定する
 *   3. VariableDeclarationList が `const` か判定する
 *
 * 副作用なしの純関数のみ。`ts.*` API のみ依存。
 *
 * 元実装は `helper-context-resolver.ts` の 3 関数（TXDX-2 時点でリファイン済）
 * を採用し、`inline-recovery.ts` の旧コピーは本ファイルに置き換える。
 */

import * as ts from 'typescript';

/**
 * Identifier から最終的な valueDeclaration を返す。
 * import alias は `getAliasedSymbol` で再帰解決する。
 */
export function resolveValueDeclaration(
  ident: ts.Identifier,
  checker: ts.TypeChecker,
): ts.Declaration | undefined {
  let sym = checker.getSymbolAtLocation(ident);
  if (sym === undefined) return undefined;
  if ((sym.flags & ts.SymbolFlags.Alias) !== 0) {
    try {
      sym = checker.getAliasedSymbol(sym);
    } catch {
      return undefined;
    }
  }
  return sym.valueDeclaration;
}

/** VariableDeclaration がモジュールトップレベル直下か判定する。 */
export function isModuleLevelVariableDeclaration(
  decl: ts.VariableDeclaration,
  sourceFile: ts.SourceFile,
): boolean {
  const list = decl.parent;
  if (list === undefined || !ts.isVariableDeclarationList(list)) return false;
  const stmt = list.parent;
  if (stmt === undefined || !ts.isVariableStatement(stmt)) return false;
  return stmt.parent === sourceFile;
}

/** VariableDeclarationList が `const` 宣言か判定する。 */
export function isConstDeclaration(decl: ts.VariableDeclaration): boolean {
  const list = decl.parent;
  if (list === undefined || !ts.isVariableDeclarationList(list)) return false;
  return (list.flags & ts.NodeFlags.Const) !== 0;
}
