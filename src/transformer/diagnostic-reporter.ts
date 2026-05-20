/**
 * diagnostic-reporter — `ts.Diagnostic` 組立・集約
 *
 * Task 5.5:
 * - 源位置・識別子名・カテゴリ・修正例テンプレートから `ts.Diagnostic` を組立
 * - エラーコード DT001〜DT010 を割り当てるテーブルを定義
 *
 * 観測可能な完了:
 *   `tests/transformer/diagnostic.test.ts` で各カテゴリのメッセージに
 *   「源位置」「識別子名」「修正例」文字列が含まれる
 *
 * 対応 requirements: 2.5, 2.7, 3.3
 * 対応 design: diagnostic-reporter, Error Message Template (DT001〜DT010)
 */

import * as ts from 'typescript';

// ---- 型定義 ------------------------------------------------------------------

/**
 * DraftOle transformer のエラーコード識別子。
 * DT001〜DT012 の範囲で割り当てる。
 */
export type DiagnosticCode =
  | 'DT001'
  | 'DT002'
  | 'DT003'
  | 'DT004'
  | 'DT005'
  | 'DT006'
  | 'DT007'
  | 'DT008'
  | 'DT009'
  | 'DT010'
  | 'DT011'
  | 'DT012'
  | 'DT013'
  | 'DT014';

/**
 * createDiagnostic に渡すデータ。
 * - identifierName: エラーメッセージに埋め込む識別子名
 * - fixExample:     修正例テキスト（"root.state(...) で宣言" 等）
 */
export interface DiagnosticData {
  /** エラーの原因となった識別子名 */
  readonly identifierName: string;
  /** 修正例テンプレートテキスト */
  readonly fixExample: string;
}

/**
 * エラーコードテーブルの1エントリ。
 */
export interface DiagnosticTableEntry {
  /** TypeScript の diagnostic コード番号（9001〜9010） */
  readonly code: number;
  /**
   * メッセージテンプレート。
   * `{identifierName}` プレースホルダーが identifierName に置換される。
   * `{fixExample}` プレースホルダーが fixExample に置換される。
   */
  readonly messageTemplate: string;
  /** 汎用的な修正ヒントテキスト（テーブル定義時の既定値） */
  readonly suggestion: string;
  /** ts.DiagnosticCategory */
  readonly category: ts.DiagnosticCategory;
}

// ---- DIAGNOSTIC_TABLE -------------------------------------------------------

/**
 * DT001〜DT010 のエラーコードテーブル。
 *
 * 設計 §Error Message Template を参照（design.md）:
 *   error DT001: Closure capture outside whitelist ...
 *     identifier 'outsideVar' is captured from module scope
 *     note: allowed: state API ...
 *     help: if 'outsideVar' is a state, declare it via root.state(...)
 *
 * 真実の源泉は 1 つ（Design D-6）: 全エラーはここで一元定義する。
 */
export const DIAGNOSTIC_TABLE: Readonly<Record<DiagnosticCode, DiagnosticTableEntry>> = {
  /**
   * DT001: ホワイトリスト外のクロージャ捕捉（Req 3.2, 3.3）
   *
   * 発生条件: ハンドラ本体内で、state API / event-param / local / builtin 以外の
   * 識別子を参照した場合
   */
  DT001: {
    code: 9001,
    messageTemplate:
      "DT001: Closure capture outside whitelist is not allowed in DraftOle handlers. " +
      "Identifier '{identifierName}' is captured from outer scope. " +
      "Allowed: state API (root.state / .get / .set / .update / .map / .field / .each), " +
      "event argument (first parameter), built-ins (Math, JSON, String, Number, ...). " +
      "Fix: {fixExample}",
    suggestion:
      "If the identifier is a state, declare it via 'root.state(...)' and call through that handle. " +
      "See docs/api/handler-serialization.md",
    category: ts.DiagnosticCategory.Error,
  },

  /**
   * DT002: 空本体の警告（Req 2.6）
   *
   * 発生条件: `() => {}` のように本体が空のアロー関数が渡された場合。
   * ビルドは継続するが警告を出す。
   */
  DT002: {
    code: 9002,
    messageTemplate:
      "DT002: Arrow function handler '{identifierName}' has empty body '() => {}'. " +
      "This handler will be registered but will have no effect. " +
      "Fix: {fixExample}",
    suggestion:
      "ハンドラ本体に処理を追加してください。" +
      "See docs/api/handler-serialization.md",
    category: ts.DiagnosticCategory.Warning,
  },

  /**
   * DT003: 非アロー関数エラー（Req 2.4）
   *
   * 発生条件: `.on` の第2引数として、アロー関数ではなく関数宣言・メソッド参照・
   * 変数経由ハンドラ等が渡された場合
   */
  DT003: {
    code: 9003,
    messageTemplate:
      "DT003: '.on' second argument must be an arrow function, but got '{identifierName}'. " +
      "Only arrow functions are supported by the DraftOle transformer. " +
      "Fix: {fixExample}",
    suggestion:
      "アロー関数 (e) => { ... } を使用してください。" +
      "See docs/api/handler-serialization.md",
    category: ts.DiagnosticCategory.Error,
  },

  /**
   * DT004: async/await 禁止（Req 4.8）
   *
   * 発生条件: ハンドラ内に `await` 式が含まれる場合
   */
  DT004: {
    code: 9004,
    messageTemplate:
      "DT004: Forbidden syntax 'async/await' is not allowed in DraftOle handlers. " +
      "Identifier '{identifierName}' is used in an async context. " +
      "async/await is not serializable. " +
      "Fix: {fixExample}",
    suggestion:
      "async/await はシリアライズできません。同期コードに書き換えてください。" +
      "See docs/api/handler-serialization.md",
    category: ts.DiagnosticCategory.Error,
  },

  /**
   * DT005: yield/generator 禁止（Req 4.8）
   *
   * 発生条件: ハンドラ内に `yield` 式が含まれる場合
   */
  DT005: {
    code: 9005,
    messageTemplate:
      "DT005: Forbidden syntax 'yield' is not allowed in DraftOle handlers. " +
      "Identifier '{identifierName}' uses yield/generator syntax. " +
      "Generator functions are not serializable. " +
      "Fix: {fixExample}",
    suggestion:
      "generator/yield はシリアライズできません。" +
      "See docs/api/handler-serialization.md",
    category: ts.DiagnosticCategory.Error,
  },

  /**
   * DT006: ++ / -- 禁止（Req 4.8）
   *
   * 発生条件: ハンドラ内に後置/前置インクリメント・デクリメント演算子が含まれる場合
   */
  DT006: {
    code: 9006,
    messageTemplate:
      "DT006: Forbidden syntax '++/--' is not allowed in DraftOle handlers. " +
      "Identifier '{identifierName}' uses postfix/prefix increment or decrement. " +
      "Use state.update(fn) or state.set(state.get() +/- 1) instead. " +
      "Fix: {fixExample}",
    suggestion:
      "state.set(state.get() + 1) を使用してください。" +
      "See docs/api/handler-serialization.md",
    category: ts.DiagnosticCategory.Error,
  },

  /**
   * DT007: デコレータ禁止（Req 4.8）
   *
   * 発生条件: ハンドラ内にデコレータ構文が含まれる場合
   */
  DT007: {
    code: 9007,
    messageTemplate:
      "DT007: Forbidden syntax 'decorator' is not allowed in DraftOle handlers. " +
      "Identifier '{identifierName}' uses a decorator. " +
      "デコレータはシリアライズできません。" +
      "Fix: {fixExample}",
    suggestion:
      "デコレータをハンドラ内から取り除いてください。" +
      "See docs/api/handler-serialization.md",
    category: ts.DiagnosticCategory.Error,
  },

  /**
   * DT008: 禁止グローバル（window/globalThis 等）（Req 3.2）
   *
   * 発生条件: ハンドラ内で window / globalThis / global / self を参照した場合
   */
  DT008: {
    code: 9008,
    messageTemplate:
      "DT008: Forbidden global '{identifierName}' is not allowed in DraftOle handlers. " +
      "window/globalThis are not available in the serialized handler context. " +
      "Use state API or event parameters instead. " +
      "Fix: {fixExample}",
    suggestion:
      "window/globalThis はハンドラ内では使用できません。state API を使用してください。" +
      "See docs/api/handler-serialization.md",
    category: ts.DiagnosticCategory.Error,
  },

  /**
   * DT009: transformer 内部エラー
   *
   * 発生条件: transformer 自体の内部例外（TypeScript API 仕様変更等）
   */
  DT009: {
    code: 9009,
    messageTemplate:
      "DT009: DraftOle transformer internal error while processing '{identifierName}'. " +
      "This may be caused by a TypeScript version incompatibility. " +
      "バージョンを確認してください。" +
      "Fix: {fixExample}",
    suggestion:
      "draftole-transformer のバージョンを確認してください。" +
      "See docs/api/handler-serialization.md",
    category: ts.DiagnosticCategory.Error,
  },

  /**
   * DT010: 追加情報・汎用メッセージ
   *
   * 発生条件: 上記以外の追加情報提供が必要な場合
   */
  DT010: {
    code: 9010,
    messageTemplate:
      "DT010: DraftOle handler validation note for '{identifierName}'. " +
      "{fixExample}",
    suggestion:
      "docs/api/handler-serialization.md を参照してください。",
    category: ts.DiagnosticCategory.Message,
  },

  /**
   * DT011: 解決不能 State 識別子（Req 4.1, 4.2）
   *
   * 発生条件: 型リテラル経路でも fallback でも解決できない State 識別子参照
   * （例: 複数 Root、関数ヘルパー経由の State 生成、構造化代入など）。
   * 設計 §`diagnostic-reporter.ts 変更点` を参照。
   */
  DT011: {
    code: 9011,
    messageTemplate:
      "DT011: State identifier '{identifierName}' cannot be resolved without fallback assumptions. " +
      "Annotate the State with a string literal type, e.g. {fixExample}.",
    suggestion:
      "State 宣言に文字列リテラル型注釈を付与してください（例: root.state<\"my-state-id\">(initial)）。",
    category: ts.DiagnosticCategory.Error,
  },

  /**
   * DT012: ヘルパー関数インライン展開対象外（transformer-inline-recovery-spec）
   *
   * 発生条件: ハンドラ直下の ExpressionStatement の中で、ヘルパー関数候補が
   * inline recovery のサポート形状（ゼロ引数・モジュールレベル・const アロー・1段）
   * を満たさない場合に発行される。
   *
   * 既定カテゴリは Suggestion（`DraftoleTransformerOptions.strictHelpers: true`
   * で Warning に切替）。Error ではないため、ファイル全体の rewrite 抑制には寄与しない。
   *
   * `inline-recovery.ts` の `buildRejectionDiagnostics` で実際の messageText を
   * 構築するため、ここで定義する `messageTemplate` は createDiagnostic 経由の
   * 簡易呼び出し用（テスト等）にのみ用いられる。
   */
  DT012: {
    code: 9012,
    messageTemplate:
      "DT012: Helper '{identifierName}' is not eligible for inline recovery ({fixExample}). " +
      "Supported shape: zero-argument module-level const arrow function, single level.",
    suggestion:
      "ヘルパーをゼロ引数のモジュールレベル const アロー関数に書き換えるか、ハンドラ本体に展開してください。",
    category: ts.DiagnosticCategory.Suggestion,
  },

  /**
   * DT013: __draftole_label__ 注入不能（class-name-varname-extraction spec）
   *
   * 発生条件: `theme.class(...)` の varName ラベリング対象を検出したが、
   * 当該ファイルに DraftOle からの import が存在せず、`__draftole_label__`
   * を注入できない場合に発行される。
   *
   * Suggestion カテゴリ。Error ではないため、ファイル全体の rewrite 抑制には寄与しない。
   * 該当呼び出しの wrap はスキップされ、クラス名は匿名フォールバック形式となる。
   */
  DT013: {
    code: 9013,
    messageTemplate:
      "DT013: Cannot inject __draftole_label__ for theme.class() varName extraction on '{identifierName}': " +
      "no existing DraftOle import found in this file. " +
      "The class name will fall back to the anonymous format. " +
      "Fix: {fixExample}",
    suggestion:
      "DraftOle からの named import（例: import { Root } from 'draft-ole'）を当該ファイルに追加してください。",
    category: ts.DiagnosticCategory.Suggestion,
  },

  /**
   * DT014: enclosing-helper recovery 不可能な helper 形状（helper-inline-recovery spec / TXDX-2）
   *
   * 発生条件: `.on(arrow)` を内包するモジュールレベル helper を発見したが、
   * 採用形状（zero-parameter module-level const arrow function、一貫した
   * each-scope context を持つ call-site 群）を満たさない場合に発行される。
   *
   * 既定カテゴリは Error。`helper-context-resolver.ts` の
   * `buildEnclosingHelperDiagnostic` で実際の messageText を構築するため、
   * ここで定義する `messageTemplate` は createDiagnostic 経由の簡易呼び出し用
   * （テスト等）にのみ用いられる。
   *
   * 注: 本診断は `hasFileError` 集計から除外され、同一ファイル内の他の `.on`
   * 書き換えは継続される（helper 経由箇所のみスキップ）。
   */
  DT014: {
    code: 9014,
    messageTemplate:
      "DT014: Enclosing helper '{identifierName}' is not eligible for inline-recovery. Fix: {fixExample}",
    suggestion:
      "ヘルパーをゼロ引数のモジュールレベル const アロー関数に書き換えるか、呼び出し位置で .on(...) を直接記述してください。",
    category: ts.DiagnosticCategory.Error,
  },
};

// ---- createDiagnostic -------------------------------------------------------

/**
 * エラーコード・ノード・sourceFile・データから `ts.Diagnostic` を組み立てる。
 *
 * 組み立てルール（Req 2.5, 3.3）:
 * 1. `node.getStart()` で源位置（start）を計算する
 * 2. `node.getWidth()` で長さ（length）を計算する
 * 3. messageTemplate 内の `{identifierName}` を data.identifierName で置換する
 * 4. messageTemplate 内の `{fixExample}` を data.fixExample で置換する
 * 5. `file` を sourceFile に設定する
 * 6. `category` をテーブルから取得する
 * 7. `code` をテーブルから取得する
 * 8. `source` を 'draftole-transformer' に設定する
 *
 * @param diagnosticCode  DiagnosticCode (DT001〜DT010)
 * @param node            エラー対象の ts.Node（位置計算に使用）
 * @param sourceFile      対象ソースファイル
 * @param data            識別子名と修正例
 * @returns               組み立てた ts.Diagnostic
 */
export function createDiagnostic(
  diagnosticCode: DiagnosticCode,
  node: ts.Node,
  sourceFile: ts.SourceFile,
  data: DiagnosticData,
): ts.Diagnostic {
  const entry = DIAGNOSTIC_TABLE[diagnosticCode];

  // 源位置の計算（Req 2.5）
  const start = node.getStart(sourceFile, false);
  const length = node.getWidth(sourceFile);

  // messageTemplate のプレースホルダー置換
  const messageText = entry.messageTemplate
    .replace(/{identifierName}/g, data.identifierName)
    .replace(/{fixExample}/g, data.fixExample);

  return {
    file: sourceFile,
    start,
    length,
    messageText,
    category: entry.category,
    code: entry.code,
    source: 'draftole-transformer',
  };
}
