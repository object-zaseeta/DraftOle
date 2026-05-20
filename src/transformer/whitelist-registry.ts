/**
 * whitelist-registry — ホワイトリストのデータ駆動定義
 *
 * Task 5.1: BUILTIN_GLOBALS 表と FORBIDDEN_SYNTAX 表を export const で定義する。
 * テスト・validator・ドキュメントはこのモジュールの定数を直接参照することで、
 * ホワイトリスト定義の「真実の源泉は 1 つ」原則（Design D-6）を実現する。
 *
 * - BUILTIN_GLOBALS: ハンドラ本体から参照可能な組み込みグローバル識別子の表
 * - FORBIDDEN_SYNTAX: ハンドラ本体で禁止される TypeScript AST SyntaxKind の表
 *
 * 対応 requirements: 3.1, 3.7
 * 対応 design: WhitelistRegistry, D-6
 */

import * as ts from 'typescript';

// ---- 型定義 ------------------------------------------------------------------

/**
 * ホワイトリストエントリ。
 * tag に基づいて validator が参照する種別を識別する。
 */
export interface WhitelistEntry {
  readonly tag: 'builtin-global' | 'builtin-method';
  /** 識別子名（ルート識別子の名前） */
  readonly name: string;
  /** 許可する静的メソッド名（省略時はオブジェクト自体の参照のみ許可） */
  readonly children?: readonly string[];
}

// ---- BUILTIN_GLOBALS --------------------------------------------------------

/**
 * ハンドラ本体で参照可能な組み込みグローバル識別子の表。
 *
 * ホワイトリスト検査は「ルート識別子」のみを対象とする（Design D-1, Req 3.4）。
 * children はドキュメント・IDE ヒント用であり、検査の対象外（チェーン先は検査しない）。
 *
 * 許可根拠（Req 3.1「純粋ビルトイン」):
 *   String, Number, Boolean — プリミティブラッパー型変換
 *   Array / Array.isArray / Array.from / Array.of — 配列操作
 *   Math — 数値演算（Math.floor, Math.max 等）
 *   JSON — シリアライズ（JSON.stringify, JSON.parse）
 *   Object — オブジェクト操作（Object.keys, Object.values 等）
 */
export const BUILTIN_GLOBALS: readonly WhitelistEntry[] = [
  { tag: 'builtin-global', name: 'String' },
  { tag: 'builtin-global', name: 'Number' },
  { tag: 'builtin-global', name: 'Boolean' },
  { tag: 'builtin-global', name: 'Array', children: ['isArray', 'from', 'of'] },
  { tag: 'builtin-global', name: 'Math' },
  { tag: 'builtin-global', name: 'JSON', children: ['stringify', 'parse'] },
  { tag: 'builtin-global', name: 'Object', children: ['keys', 'values', 'entries', 'assign'] },
  // console はデバッグ用として許可（Req 3.1「純粋ビルトイン」の補足）
  { tag: 'builtin-global', name: 'console' },
  // ブラウザ組み込みダイアログ（confirm / alert / prompt）はハンドラ内で常用される
  { tag: 'builtin-global', name: 'confirm' },
  { tag: 'builtin-global', name: 'alert' },
  { tag: 'builtin-global', name: 'prompt' },
];

// ---- FORBIDDEN_SYNTAX -------------------------------------------------------

/**
 * ハンドラ本体で禁止される TypeScript AST の SyntaxKind 表。
 *
 * whitelist-validator はハンドラ AST を走査し、この表に含まれる SyntaxKind を
 * 発見した場合に ts.Diagnostic error を生成してビルドを停止する（Req 4.8）。
 *
 * 禁止根拠:
 *   AwaitExpression  — async/await はシリアライズ対象外（Req 4.8, Boundary §対象外）
 *   YieldExpression  — generator はシリアライズ対象外（同上）
 *   PostfixUnaryExpression — ++ / -- の後置演算子（副作用あり、Req 4.8）
 *   PrefixUnaryExpression  — ++ / -- の前置演算子（副作用あり、Req 4.8）
 *   Decorator              — デコレータはシリアライズ対象外（Req 4.8）
 *
 * 注意: PrefixUnaryExpression は ! (論理否定) や - (単項マイナス) も含むが、
 * whitelist-validator 側で演算子種別（SyntaxKind.PlusPlusToken など）を
 * 確認してから違反判定する。ここでは種別登録のみ行う。
 */
export const FORBIDDEN_SYNTAX: readonly ts.SyntaxKind[] = [
  ts.SyntaxKind.AwaitExpression,
  ts.SyntaxKind.YieldExpression,
  ts.SyntaxKind.PostfixUnaryExpression, // ++ / -- (後置)
  ts.SyntaxKind.PrefixUnaryExpression,  // ++ / -- (前置)
  ts.SyntaxKind.Decorator,              // デコレータ（Req 4.8）
];

// ---- ヘルパー関数 ------------------------------------------------------------

/**
 * 識別子名が BUILTIN_GLOBALS に含まれるかを返す。
 * whitelist-validator から呼び出す。
 */
export function isBuiltinGlobal(name: string): boolean {
  return BUILTIN_GLOBALS.some((entry) => entry.name === name);
}

/**
 * SyntaxKind が FORBIDDEN_SYNTAX に含まれるかを返す。
 * whitelist-validator から呼び出す。
 */
export function isForbiddenSyntaxKind(kind: ts.SyntaxKind): boolean {
  return (FORBIDDEN_SYNTAX as readonly number[]).includes(kind);
}
