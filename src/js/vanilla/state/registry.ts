/**
 * StateRegistry — 状態エントリの管理と状態 ID 採番を担うクラス。
 *
 * 設計書 `design.md` の「Components and Interfaces: StateRegistry」に対応。
 * - 状態 ID → StateEntry のマッピングを管理する
 * - 状態 ID を "s0", "s1", ... の形式で一意に採番する
 * - state-init コマンド列を生成して FileExporter に提供する（Req 1.2, 1.3, 5.4）
 *
 * Note: StateInitCommand は tasks 3.1 で commands.ts に移動予定のため、
 * 現時点ではこのファイル内にローカル定義する。
 */

import type { JsExpr } from '../types.js';

/**
 * 状態エントリ（StateRegistry 内部）。
 * design.md の Data Models セクションに対応。
 */
export interface StateEntry {
  /** ランタイム状態 ID（例: "s0", "s1"）*/
  runtimeId: string;
  /** JSON.stringify された初期値を表す JS 式 */
  initialExpr: JsExpr;
  /** 型名（デバッグ用、optional）*/
  typeHint?: string;
}

/**
 * state-init コマンドを表すローカル型。
 * タスク 3.1 で VanillaCommand に統合予定。
 */
export interface StateInitCommand {
  type: 'state-init';
  id: string;
  initial: JsExpr;
}

/**
 * Computed 派生状態のエントリ。
 * 方針 B: .map() で生成された Computed をランタイム状態として管理する。
 * sourceId の変化を購読して derivedId を更新するサブスクリプションを生成する。
 */
export interface DerivedEntry {
  /** 派生状態の ID（allocateId() で採番済み）*/
  derivedId: string;
  /** 購読元の状態 ID（直接の親状態）*/
  sourceId: string;
  /** _v を入力変数とした変換式（例: `((_v).filter(...).length)`）*/
  transformBody: JsExpr;
}

/**
 * derive-state コマンドを表す型。
 * file-exporter が renderCommand に渡すために使用する。
 */
export interface DeriveStateCommand {
  type: 'derive-state';
  sourceId: string;
  derivedId: string;
  transformBody: JsExpr;
}

/**
 * StateRegistry クラス。
 *
 * - `allocateId()`: "s0", "s1", ... の形式で一意な状態 ID を採番
 * - `register(entry)`: StateEntry を entries マップに登録
 * - `isEmpty()`: 状態が 1 つも宣言されていないか確認（Req 5.4）
 * - `listInitCommands()`: state-init コマンド列を返す（FileExporter が利用）
 */
export class StateRegistry {
  private _nextId: number = 0;
  readonly entries: Map<string, StateEntry> = new Map();
  private readonly _derivedEntries: DerivedEntry[] = [];

  /**
   * 次の一意な状態 ID を採番して返す（"s0", "s1", ...）。
   * 採番のみ行い、エントリへの登録は行わない。
   * Req 1.3: 同一 Root から root.state(...) を複数回呼び出すと、呼び出しごとに異なる状態 ID を採番。
   */
  allocateId(): string {
    return `s${this._nextId++}`;
  }

  /**
   * StateEntry を entries マップに追加する。
   * runtimeId をキーとして Map に格納する。
   */
  register(entry: StateEntry): void {
    this.entries.set(entry.runtimeId, entry);
  }

  /**
   * Computed 派生エントリを登録する。
   * .map() で生成された Computed ごとに呼ばれる（方針 B）。
   */
  registerDerived(entry: DerivedEntry): void {
    this._derivedEntries.push(entry);
  }

  /**
   * derive-state コマンド列を返す。
   * file-exporter が state-init の直後に出力して親→派生のサブスクリプションを確立する。
   * 登録順で返すことで依存関係の解決順序を保証する。
   */
  listDeriveCommands(): DeriveStateCommand[] {
    return this._derivedEntries.map((entry) => ({
      type: 'derive-state' as const,
      sourceId: entry.sourceId,
      derivedId: entry.derivedId,
      transformBody: entry.transformBody,
    }));
  }

  /**
   * 状態が 1 つも宣言されていないか確認する。
   * Req 5.4: Root に状態が 1 つも宣言されていない場合、FileExporter はプレリュードを出力しない。
   */
  isEmpty(): boolean {
    return this.entries.size === 0;
  }

  /**
   * state-init コマンド列を返す。
   * FileExporter が script.js に初期化コードを出力するために利用する（Req 1.2）。
   * エントリの登録順でコマンドを返す。
   */
  listInitCommands(): StateInitCommand[] {
    return Array.from(this.entries.values()).map((entry) => ({
      type: 'state-init' as const,
      id: entry.runtimeId,
      initial: entry.initialExpr,
    }));
  }
}
