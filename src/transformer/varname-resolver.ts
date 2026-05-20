import * as ts from 'typescript';

/**
 * varname-resolver
 * =================
 *
 * `theme.class(...)` の CallExpression に対して、ビルド時に AST 文脈から
 * 「この呼び出しがどのような名前を持つ場所に書かれているか」を読み取り、
 * scoped CSS class name に埋め込むためのラベル文字列（varName）を返す。
 *
 * 戦略は 3 階層で、上から順に評価し、最初に該当した tier の結果を採用する。
 *
 * Tier 1 — declaration (requirements §1, §2)
 *   親が `ts.VariableDeclaration` でその initializer が当該 callExpr の場合、
 *   宣言名 (Identifier) を採用する。const / let / var は区別しない。
 *   親チェーンを辿る必要はない（AST 上「直接の親」が最内の宣言である）。
 *
 * Tier 2 — class carrier prop (requirements §3.1, §3.3)
 *   親が `ts.PropertyAssignment` でその value が当該 callExpr、かつ prop 名が
 *   `CLASS_CARRIER_PROP_NAMES` に含まれる場合のみ発動。
 *   prop 名自体は varName に採用せず、以下の優先順位で fallback ラベルを合成する:
 *     (a) 同じ ObjectLiteralExpression 内の `id` / `name` / `data-testid` 文字列リテラル
 *     (b) 親 factory 呼び出しのタグ名と役割属性（`button` / `input` の `type`）
 *     (c) いずれも該当しない場合は undefined を返し、Tier 3 へフォールスルー
 *
 * Tier 3 — function argument (requirements §3.4, §3.5)
 *   親が `ts.CallExpression` で当該 callExpr がその引数の 1 つの場合、
 *   親呼び出しの関数名（Identifier / PropertyAccessExpression の末尾 name）を採用。
 *
 * すべての出力は `sanitizeVarName` で正規化・24 文字制限を経由する。
 * 正規化結果が空文字列になる場合は undefined を返す。
 */

/**
 * Tier 2 で「class carrier」と認識する prop 名集合。
 * 将来 `style` や `cssClass` などが追加された場合はここ 1 箇所を変更する。
 * design ↔ requirements §3.1 の同期を保つために export 公開する。
 */
export const CLASS_CARRIER_PROP_NAMES = ['css'] as const;

const SIBLING_LABEL_PROP_PRIORITY = ['id', 'name', 'data-testid'] as const;

/**
 * CSS class name フラグメント用に varName を正規化する。
 * - lower-case 化
 * - [a-z0-9-] 以外を `-` に置換
 * - 連続する `-` を 1 つに畳む
 * - 端の `-` を除去
 * - 24 文字で切り詰め（末尾 `-` は再除去）
 * - 結果が空なら空文字列を返す
 */
export function sanitizeVarName(raw: string): string {
  if (!raw) return '';
  let s = raw.toLowerCase();
  s = s.replace(/[^a-z0-9-]/g, '-');
  s = s.replace(/-+/g, '-');
  s = s.replace(/^-+|-+$/g, '');
  if (s.length > 24) {
    s = s.slice(0, 24);
    s = s.replace(/-+$/g, '');
  }
  return s;
}

/**
 * theme.class(...) CallExpression に対して 3-tier 戦略で varName を解決する。
 * 抽出不能時、または sanitize 後に空文字列になる場合は undefined を返す。
 */
export function resolveVarName(
  callExpr: ts.CallExpression,
  sourceFile: ts.SourceFile,
  _checker: ts.TypeChecker,
): string | undefined {
  const raw =
    tryTier1(callExpr, sourceFile) ??
    tryTier2(callExpr, sourceFile) ??
    tryTier3(callExpr, sourceFile);
  if (raw === undefined) return undefined;
  const sanitized = sanitizeVarName(raw);
  return sanitized.length > 0 ? sanitized : undefined;
}

// ----- Tier 1 ---------------------------------------------------------------

function tryTier1(
  callExpr: ts.CallExpression,
  sourceFile: ts.SourceFile,
): string | undefined {
  const parent = callExpr.parent;
  if (!parent || !ts.isVariableDeclaration(parent)) return undefined;
  if (parent.initializer !== callExpr) return undefined;
  if (!ts.isIdentifier(parent.name)) return undefined;
  return parent.name.getText(sourceFile);
}

// ----- Tier 2 ---------------------------------------------------------------

function tryTier2(
  callExpr: ts.CallExpression,
  sourceFile: ts.SourceFile,
): string | undefined {
  const propAssign = callExpr.parent;
  if (!propAssign || !ts.isPropertyAssignment(propAssign)) return undefined;
  if (propAssign.initializer !== callExpr) return undefined;

  const propName = getPropertyName(propAssign);
  if (propName === undefined) return undefined;
  if (!(CLASS_CARRIER_PROP_NAMES as readonly string[]).includes(propName)) {
    return undefined;
  }

  const objLit = propAssign.parent;
  if (!objLit || !ts.isObjectLiteralExpression(objLit)) return undefined;

  // (a) Sibling label props
  const sibling = scanSiblingLabelProps(objLit, sourceFile);
  if (sibling !== undefined) return sibling;

  // (b) Parent factory tag + role attribute
  const factoryLabel = tryFactoryRoleLabel(objLit, sourceFile);
  if (factoryLabel !== undefined) return factoryLabel;

  // (c) Fall through to Tier 3
  return undefined;
}

function getPropertyName(prop: ts.PropertyAssignment): string | undefined {
  const name = prop.name;
  if (ts.isIdentifier(name)) return name.text;
  if (ts.isStringLiteral(name)) return name.text;
  if (ts.isNoSubstitutionTemplateLiteral(name)) return name.text;
  return undefined;
}

function getStringLiteralValue(node: ts.Node): string | undefined {
  if (ts.isStringLiteral(node)) return node.text;
  if (ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return undefined;
}

function scanSiblingLabelProps(
  objLit: ts.ObjectLiteralExpression,
  _sourceFile: ts.SourceFile,
): string | undefined {
  for (const target of SIBLING_LABEL_PROP_PRIORITY) {
    for (const member of objLit.properties) {
      if (!ts.isPropertyAssignment(member)) continue;
      const name = getPropertyName(member);
      if (name !== target) continue;
      const value = getStringLiteralValue(member.initializer);
      if (value !== undefined && value.length > 0) {
        return value;
      }
    }
  }
  return undefined;
}

function tryFactoryRoleLabel(
  objLit: ts.ObjectLiteralExpression,
  _sourceFile: ts.SourceFile,
): string | undefined {
  const parent = objLit.parent;
  if (!parent || !ts.isCallExpression(parent)) return undefined;
  if (parent.arguments.length === 0 || parent.arguments[0] !== objLit) {
    return undefined;
  }
  const tag = extractTagName(parent.expression);
  if (tag === undefined) return undefined;

  if (tag === 'button' || tag === 'input') {
    for (const member of objLit.properties) {
      if (!ts.isPropertyAssignment(member)) continue;
      if (getPropertyName(member) !== 'type') continue;
      const value = getStringLiteralValue(member.initializer);
      if (value !== undefined && value.length > 0) return value;
    }
  }
  return undefined;
}

function extractTagName(expr: ts.Expression): string | undefined {
  if (ts.isIdentifier(expr)) return expr.text;
  if (ts.isPropertyAccessExpression(expr)) return expr.name.text;
  return undefined;
}

// ----- Tier 3 ---------------------------------------------------------------

function tryTier3(
  callExpr: ts.CallExpression,
  _sourceFile: ts.SourceFile,
): string | undefined {
  const parent = callExpr.parent;
  if (!parent || !ts.isCallExpression(parent)) return undefined;
  // callExpr must be an argument (not the callee itself).
  if (parent.expression === callExpr) return undefined;
  let isArg = false;
  for (const arg of parent.arguments) {
    if (arg === callExpr) {
      isArg = true;
      break;
    }
  }
  if (!isArg) return undefined;

  return extractTagName(parent.expression);
}
