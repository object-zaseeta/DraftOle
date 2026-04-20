/**
 * 内部命令レコード `VanillaCommand` 判別共用体と JS 文字列化関数。
 *
 * 設計書 `design.md` の「commands: VanillaCommand」「renderCommand」「renderCommands」に対応。
 * 本モジュールは全 API が発行する命令の代数的データ型と、それらを JS 文字列へ
 * 変換する純関数を 1 箇所に集約する。`jQuery` / `$` を出力に含めない制約を
 * コードレビュー可能にする責務を負う（Req 1.5, 7.1）。
 */

/**
 * バニラ JS ビルダーが発行する内部命令の判別共用体。
 * 各バリアントは `type` で識別され、`renderCommand` により JS 文字列に変換される。
 */
export type VanillaCommand =
  | { type: 'addEventListener'; target: string; event: string; handlerCode: string }
  | { type: 'domReady'; bodyCode: string }
  | { type: 'declareFunction'; name: string; params: readonly string[]; bodyCode: string }
  | { type: 'declareConst'; name: string; expr: string }
  | { type: 'classListToggle'; target: string; name: string; force?: string }
  | { type: 'classListAdd'; target: string; name: string }
  | { type: 'classListRemove'; target: string; name: string }
  | { type: 'setProp'; target: string; prop: 'textContent' | 'value'; expr: string }
  | { type: 'setStyle'; target: string; key: string; expr: string }
  | { type: 'appendChild'; parent: string; child: string }
  | { type: 'remove'; target: string }
  | { type: 'forEach'; listExpr: string; itemVar: string; bodyCode: string }
  | { type: 'if'; condition: string; thenCode: string; elseCode?: string }
  | { type: 'expr'; code: string }
  | { type: 'raw'; code: string };

/**
 * 文字列値を JS 文字列リテラルとして安全にクォート・エスケープする。
 * セレクタ・クラス名・テキスト値・イベント名などすべての静的文字列に適用する。
 */
function quote(value: string): string {
  return JSON.stringify(value);
}

/**
 * 命令レコードを完全な JS 文字列（1 文または複数行ブロック）に変換する純関数。
 * `switch` + `default: never` チェックにより命令追加時のコンパイルエラーで漏れを検知する。
 *
 * - セレクタ・クラス名・テキスト値等の静的文字列は `JSON.stringify` でクォートされる。
 * - 出力に `jQuery` / `$` 識別子を含めない（`raw` 命令で利用者が混入させた場合を除く）。
 */
export function renderCommand(cmd: VanillaCommand): string {
  switch (cmd.type) {
    case 'addEventListener':
      return `${cmd.target}.addEventListener(${quote(cmd.event)}, ${cmd.handlerCode});`;
    case 'domReady':
      return `document.addEventListener("DOMContentLoaded", () => {\n${cmd.bodyCode}\n});`;
    case 'declareFunction': {
      const params = cmd.params.join(', ');
      return `function ${cmd.name}(${params}) {\n${cmd.bodyCode}\n}`;
    }
    case 'declareConst':
      return `const ${cmd.name} = ${cmd.expr};`;
    case 'classListToggle':
      return cmd.force === undefined
        ? `${cmd.target}.classList.toggle(${quote(cmd.name)});`
        : `${cmd.target}.classList.toggle(${quote(cmd.name)}, ${cmd.force});`;
    case 'classListAdd':
      return `${cmd.target}.classList.add(${quote(cmd.name)});`;
    case 'classListRemove':
      return `${cmd.target}.classList.remove(${quote(cmd.name)});`;
    case 'setProp':
      return `${cmd.target}.${cmd.prop} = ${cmd.expr};`;
    case 'setStyle':
      return `${cmd.target}.style.${cmd.key} = ${cmd.expr};`;
    case 'appendChild':
      return `${cmd.parent}.appendChild(${cmd.child});`;
    case 'remove':
      return `${cmd.target}.remove();`;
    case 'forEach':
      return `${cmd.listExpr}.forEach((${cmd.itemVar}) => {\n${cmd.bodyCode}\n});`;
    case 'if':
      return cmd.elseCode === undefined
        ? `if (${cmd.condition}) {\n${cmd.thenCode}\n}`
        : `if (${cmd.condition}) {\n${cmd.thenCode}\n} else {\n${cmd.elseCode}\n}`;
    case 'expr':
      return `${cmd.code};`;
    case 'raw':
      return cmd.code;
    default: {
      // 命令種別の追加漏れを TypeScript コンパイル時に検知するための exhaustive check。
      const _exhaustive: never = cmd;
      void _exhaustive;
      throw new Error(
        `renderCommand: unknown command type: ${JSON.stringify(cmd satisfies never)}`,
      );
    }
  }
}

/**
 * 命令配列を `indent` を各行に付与して直列化する純関数。
 * 各命令の `renderCommand` 出力（複数行含む）を行単位で分割し、先頭に `indent` を付与する。
 * コマンド間は改行で結合する。空配列の場合は空文字を返す。
 */
export function renderCommands(cmds: readonly VanillaCommand[], indent: string): string {
  if (cmds.length === 0) return '';
  const lines: string[] = [];
  for (const cmd of cmds) {
    const rendered = renderCommand(cmd);
    for (const line of rendered.split('\n')) {
      // 空行はそのまま保持する（インデントだけを残さない）。
      lines.push(line.length === 0 ? '' : `${indent}${line}`);
    }
  }
  return lines.join('\n');
}
