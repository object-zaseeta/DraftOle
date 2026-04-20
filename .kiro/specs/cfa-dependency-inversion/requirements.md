# Requirements Document

## Project Description (Input)
`html-tag.ts` が `CssManager` / `JQueryManager` の具象クラスを直接 import・生成しているため、html/ → css/, js/ という逆方向依存が生じている。テスト時のモック注入ができず、将来の設計拡張も困難。

**現状**:
- `HtmlTagOptions`（`css?`, `jqm?`）のDI基盤は存在するが、fallback で `new CssManager()` / `new JQueryManager()` を直接生成している
- プロトコルファイル（`css-manager-type.ts`, `jquery-manager-protocol.ts`）は存在するが、具象型への依存が残っている可能性がある
- Composition Root が存在せず、具象クラスの生成がコード全体に散在している

**目指す状態**:
- `html-tag.ts` が具象 `CssManager` / `JQueryManager` を import しない（CFA-A.1）
- プロトコル定義が `protocols/` 内で完結し、css/, js/ がそれを実装する形になる（CFA-A.2）
- `src/composition-root.ts` がデフォルトのインスタンス生成を一元管理する（CFA-A.3）
- テスト時にモックを注入できる
- 外部公開APIに破壊的変更なし、既存2,371テスト全PASS維持

**スコープ**:
- 内部構造リファクタリングのみ
- 含む: html-tag.ts のDI化、プロトコル依存反転、Composition Root 導入、root.ts および factory 関数への伝播
- 含まない: 外部公開API変更、CssManager/JQueryManager本体の実装変更、ファイル分割（CFA-B）、型定義分散（CFA-C）

詳細は `.kiro/specs/cfa-dependency-inversion/brief.md` 参照。

## Boundary

**このスペックが責任を持つ範囲（In）**:
- `html-tag.ts` からの具象 `CssManager` / `JQueryManager` 依存の除去（CFA-A.1）
- `html/protocols/` 配下のプロトコル定義における具象依存の解消（CFA-A.2）
- `src/composition-root.ts` の新規導入によるデフォルトインスタンス生成の一元化（CFA-A.3）
- `root.ts` および `html/tags/factories*.ts` 群への DI オプション（`HtmlTagOptions`）伝播
- モック注入可能性を担保するユニットテスト追加

**このスペックが責任を持たない範囲（Out）**:
- 外部公開 API（`src/index.ts` からの export）の挙動・シグネチャ変更
- `CssManager` / `JQueryManager` の内部実装ロジックの変更
- ファイル分割（CFA-B スペック）、型定義分散（CFA-C スペック）
- 既存テストの大規模書き換え（モック注入テスト追加は対象内）

**隣接システムへの期待**:
- `CssManager` / `JQueryManager` は既存プロトコル契約を満たし続けること
- 既存 2,371 テストは全 PASS を維持すること

## Requirements

### Requirement 1: html-tag.ts からの具象依存除去（CFA-A.1）
**Objective:** ライブラリ保守者として、`html-tag.ts` が css/ および js/ モジュールの具象実装に依存しない状態にしたい。それによりモジュール間の依存方向を正し、テスト容易性と将来の拡張性を確保するため。

#### Acceptance Criteria
1. When `html-tag.ts` のソースが読み込まれるとき、the DraftOle ライブラリ shall `CssManager` および `JQueryManager` の具象クラスを import しない。
2. When `html-tag.ts` 内で CSS/JS マネージャのインスタンスが必要になるとき、the DraftOle ライブラリ shall 具象クラスの `new` 呼び出しではなく注入されたプロトコル型のインスタンスを利用する。
3. If `HtmlTagOptions` で `css` または `jqm` が渡されなかった場合、the DraftOle ライブラリ shall 具象クラスを直接生成せず Composition Root 経由で得られたデフォルト実装を利用する。
4. The DraftOle ライブラリ shall `html/` モジュール配下から `css/` および `js/` モジュール内の具象実装ファイルへの import を持たないこと。

### Requirement 2: プロトコル依存方向の修正（CFA-A.2）
**Objective:** ライブラリ保守者として、プロトコル定義が具象クラスに依存しない構造にしたい。依存関係逆転の原則に従い、css/, js/ がプロトコルを実装する形に整理するため。

#### Acceptance Criteria
1. The DraftOle ライブラリ shall `html/protocols/` 配下のプロトコルファイルから `css/` および `js/` の具象実装ファイルへの import を持たないこと。
2. When `CssManager` クラスが定義されるとき、the DraftOle ライブラリ shall 対応するプロトコル（`css-manager-type.ts` または等価インターフェース）を明示的に実装（`implements`）する。
3. When `JQueryManager` クラスが定義されるとき、the DraftOle ライブラリ shall 対応するプロトコル（`jquery-manager-protocol.ts` または等価インターフェース）を明示的に実装（`implements`）する。
4. The DraftOle ライブラリ shall プロトコル定義に含まれる公開メソッド・プロパティを具象クラスがすべて満たすこと（TypeScript 型チェックで検証可能であること）。

### Requirement 3: Composition Root の導入（CFA-A.3）
**Objective:** ライブラリ保守者として、デフォルトのマネージャインスタンス生成を一箇所に集約したい。具象クラス生成の散在を解消し、依存差し替えポイントを一元化するため。

#### Acceptance Criteria
1. The DraftOle ライブラリ shall `src/composition-root.ts` をエントリとして持ち、デフォルトの `CssManager` / `JQueryManager` インスタンスを生成する関数を公開する。
2. When Composition Root 外部のコードがデフォルトマネージャを必要とするとき、the DraftOle ライブラリ shall Composition Root が提供する生成関数を経由してインスタンスを取得する。
3. The DraftOle ライブラリ shall `html-tag.ts`、`root.ts`、`html/tags/factories*.ts` 群から具象 `CssManager` / `JQueryManager` への直接 `new` 呼び出しを含まないこと。
4. Where Composition Root が複数回呼ばれる場合、the DraftOle ライブラリ shall 同一プロセス内で矛盾のない（契約上同等の）マネージャインスタンスを返却すること。

### Requirement 4: DI オプションの伝播
**Objective:** ライブラリ利用者として、`HtmlTagOptions` で渡したマネージャ実装が生成チェーン全体で一貫して利用されるようにしたい。上位で指定した依存が下位 factory 呼び出しでも尊重されるため。

#### Acceptance Criteria
1. When `root()` 関数に `HtmlTagOptions` が渡されるとき、the DraftOle ライブラリ shall 配下で生成されるタグおよびマネージャ利用箇所に同じ `css` / `jqm` 参照を伝播させる。
2. When `html/tags/factories*.ts` 群の factory 関数に `HtmlTagOptions` が渡されるとき、the DraftOle ライブラリ shall 当該 factory が内部で生成する `HtmlTag` インスタンスへ `css` / `jqm` を引き渡す。
3. If factory 関数呼び出しに `HtmlTagOptions` が与えられなかった場合、the DraftOle ライブラリ shall Composition Root が提供するデフォルト実装を用いる。
4. The DraftOle ライブラリ shall DI 伝播の結果として、利用者が指定した同一マネージャ参照が生成ツリー内で共有されること。

### Requirement 5: テスト時のモック注入可能性
**Objective:** ライブラリ開発者として、テストから `CssManager` / `JQueryManager` のモック実装を注入したい。具象実装に依存しない単体テストを書けるようにするため。

#### Acceptance Criteria
1. When テストコードがプロトコルを満たすモックを `HtmlTagOptions` 経由で渡すとき、the DraftOle ライブラリ shall 内部処理でそのモックのメソッドを呼び出し、具象クラスを生成しない。
2. When `html-tag.ts` に関する単体テストが実行されるとき、the DraftOle ライブラリ shall モック注入経路を用いて `CssManager` / `JQueryManager` の実際の副作用を伴わずに検証可能である。
3. The DraftOle ライブラリ shall モック注入を検証する単体テストを少なくとも 1 件以上追加し CI で実行されること。

### Requirement 6: 外部公開 API の後方互換性と既存テスト維持
**Objective:** ライブラリ利用者として、本リファクタリングによって既存コードが壊れないようにしたい。外部公開 API とテスト結果を維持し、内部構造変更が利用側に露出しないようにするため。

#### Acceptance Criteria
1. The DraftOle ライブラリ shall `src/index.ts` から公開されているシンボル（関数・クラス・型）のシグネチャと挙動を従来通り維持すること。
2. When 本リファクタリング後に全テストスイートが実行されるとき、the DraftOle ライブラリ shall 既存 2,371 件のテストを全件 PASS させる。
3. If 既存 API の呼び出しが `HtmlTagOptions` を指定せず行われた場合、the DraftOle ライブラリ shall 従来と同等の出力（HTML/CSS/JS 文字列）を生成する。
4. The DraftOle ライブラリ shall 公開型定義（`.d.ts` 相当）に対する破壊的変更を導入しないこと。
