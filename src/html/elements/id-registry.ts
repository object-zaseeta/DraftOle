/**
 * IdRegistry — レンダー中に発行された id を集合管理し、重複を検出する。
 *
 * Requirements: 3.4（id 重複検出）
 *
 * 設計メモ:
 * - 状態モデル: `Map<string, string>`（id → 最初に登録された tagPath）
 * - `Root.protoRender()` 開始時に `reset()` を呼び、レンダー中は単一 Registry を共有する
 * - `register` で既存 id と衝突した場合、`HtmlError`（DraftOleError サブクラス）をスローし、
 *   重複 id と新旧両方の tagPath をメッセージに含める
 */
import { HtmlError } from '../errors/html-error.js';

/**
 * IdRegistry の公開インターフェイス
 */
export interface IdRegistryProtocol {
  /**
   * id を登録する。既に同じ id が登録されている場合は HtmlError をスローする。
   *
   * @param id - 登録対象の id 文字列
   * @param tagPath - 当該 id を持つタグの構造パス（エラー時の特定用）
   * @throws {HtmlError} 既に同じ id が登録済みの場合
   */
  register(id: string, tagPath: string): void;

  /**
   * 指定 id が登録済みかを返す。
   */
  has(id: string): boolean;

  /**
   * 登録済み id をすべて破棄する。
   */
  reset(): void;
}

/**
 * 内部 Map で id を管理する IdRegistry の標準実装。
 */
export class IdRegistry implements IdRegistryProtocol {
  /** id → 最初に登録された tagPath */
  private readonly entries: Map<string, string> = new Map();

  /**
   * id を登録する。重複検出時は HtmlError をスローする。
   */
  register(id: string, tagPath: string): void {
    const existingPath = this.entries.get(id);
    if (existingPath !== undefined) {
      // 重複 id を検出したため、両方の tagPath を含むエラーを投げる
      throw new HtmlError(
        'invalidAttribute',
        `Duplicate id "${id}" detected: already registered at "${existingPath}", attempted to register again at "${tagPath}".`,
      );
    }
    this.entries.set(id, tagPath);
  }

  /**
   * 登録済みかを返す。
   */
  has(id: string): boolean {
    return this.entries.has(id);
  }

  /**
   * 登録をすべて破棄する。
   */
  reset(): void {
    this.entries.clear();
  }
}
