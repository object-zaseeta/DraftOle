/**
 * Publisher が Root から受け取る read-only export snapshot。
 * FileExporter はこの型からすべての必要情報を取得し、Root._stateRegistry などの
 * 内部状態へ直接アクセスしない。
 */
export interface ExportContext {
  /** レンダリング済み HTML 文字列 */
  readonly html: string;
  /** 収集済み CSS 文字列（グローバル + スコープド） */
  readonly css: string;
  /** ユーザー定義 Vanilla JS（VanillaScriptBuilder 出力） */
  readonly userJs: string;
  /** ランタイムプレリュード（状態あり時のみ存在） */
  readonly runtimePrelude?: string;
  /** 状態初期化 JS（state-init + derive コマンド列） */
  readonly runtimeInitJs?: string;
}
