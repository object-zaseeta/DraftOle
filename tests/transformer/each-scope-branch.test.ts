/**
 * each-scope-branch / runEachScopeBranch 直接 unit test
 * (transformer-index-pipeline-split task 3.2)
 *
 * Phase 4b delegate の 3 経路を検証する:
 *   (a) .each 文脈なし (direct walk-up で each scope 検出されず) → eachContext: null
 *       → eachScopeParams: undefined, stateIdMap 構築は通常経路
 *   (b) .each 文脈あり direct walk-up (helperPathUsed=false で each 内の .on) →
 *       eachContext 確定 + eachScopeParams 構築
 *   (c) helper-aware path で inherited symbols 再利用 (helperPathUsed=true) →
 *       direct walk-up を skip し inherited 値をそのまま使用
 */

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { runEachScopeBranch } from '../../src/transformer/each-scope-branch.ts';
import type { EachScopeContext } from '../../src/transformer/each-state-rewriter.ts';
import type {
  PreCheckOutcome,
  TransformerBaseContext,
} from '../../src/transformer/per-call-context.ts';
import { createSourceStateNameFallback } from '../../src/transformer/state-id-fallback.ts';
import { createTestProgram, findNode } from './__fixtures__/ast-builders.ts';

interface Setup {
  base: TransformerBaseContext;
  callInfo: { callExpr: ts.CallExpression; eventArg: ts.StringLiteral; handlerArg: ts.ArrowFunction };
}

function setup(source: string): Setup {
  const { program, checker, sources } = createTestProgram([{ name: 'branch.ts', source }]);
  const sourceFile = sources.get('branch.ts');
  if (sourceFile === undefined) throw new Error('source file not found');

  const onCall = findNode(sourceFile, (n): n is ts.CallExpression =>
    ts.isCallExpression(n) &&
    ts.isPropertyAccessExpression(n.expression) &&
    ts.isIdentifier(n.expression.name) &&
    n.expression.name.text === 'on',
  );
  if (onCall === undefined) throw new Error('.on(...) not found');
  const eventArg = onCall.arguments[0];
  const handlerArg = onCall.arguments[1];
  if (eventArg === undefined || !ts.isStringLiteral(eventArg)) {
    throw new Error('event arg must be StringLiteral');
  }
  if (handlerArg === undefined || !ts.isArrowFunction(handlerArg)) {
    throw new Error('handler arg must be ArrowFunction');
  }

  const base: TransformerBaseContext = {
    program,
    checker,
    sourceFile,
    extraWhitelist: [],
    strictHelpers: false,
    helperCallSites: [],
    fallback: createSourceStateNameFallback(sourceFile, checker),
  };
  return { base, callInfo: { callExpr: onCall, eventArg, handlerArg } };
}

const passThroughPreCheck: PreCheckOutcome = {
  helperPathUsed: false,
  inheritedEachContext: null,
  inheritedEachParamSymbols: undefined,
  diagnostics: [],
};

describe('each-scope-branch / runEachScopeBranch', () => {
  it('(a) .each 文脈なし: eachScopeParams は undefined、eachUsage 診断なし', () => {
    const { base, callInfo } = setup(`
      declare const obj: { on(e: string, cb: () => void): void };
      obj.on("click", () => {});
    `);
    const outcome = runEachScopeBranch(base, callInfo, passThroughPreCheck);
    expect(outcome.eachScopeParams).toBeUndefined();
    // each 文脈なしの場合 validateEachUsage は空配列
    // (DT011 は handler 内に state 参照がなければ発生しないため diagnostics も空)
    expect(outcome.diagnostics).toEqual([]);
    expect(outcome.stateIdMap.size).toBe(0);
  });

  it('(b) .each 文脈あり direct walk-up: eachScopeParams が itemParamName → "itemId" マップを含む', () => {
    const { base, callInfo } = setup(`
      declare const obj: { on(e: string, cb: () => void): void };
      declare const list: { each(cb: (item: { id: string }) => void): void };
      list.each(item => obj.on("click", () => {}));
    `);
    const outcome = runEachScopeBranch(base, callInfo, passThroughPreCheck);
    expect(outcome.eachScopeParams).toBeDefined();
    if (outcome.eachScopeParams === undefined) throw new Error('eachScopeParams missing');
    expect(outcome.eachScopeParams.get('item')).toBe('itemId');
  });

  it('(c) helper-aware path: inherited eachContext / paramSymbols をそのまま再利用', () => {
    // 通常 walk-up では each 外だが、preCheck.helperPathUsed=true + inherited context を渡せば
    // inherited 値が使われることを検証 (direct walk-up を skip)
    const { base, callInfo } = setup(`
      declare const obj: { on(e: string, cb: () => void): void };
      obj.on("click", () => {});
    `);
    const inheritedContext: EachScopeContext = {
      itemParamName: 'inheritedItem',
      factoryParamName: 'itemId',
    };
    const inheritedPreCheck: PreCheckOutcome = {
      helperPathUsed: true,
      inheritedEachContext: inheritedContext,
      inheritedEachParamSymbols: new Set<ts.Symbol>(),
      diagnostics: [],
    };
    const outcome = runEachScopeBranch(base, callInfo, inheritedPreCheck);
    // inherited context が反映されている → eachScopeParams に inheritedItem→itemId
    expect(outcome.eachScopeParams).toBeDefined();
    if (outcome.eachScopeParams === undefined) throw new Error('eachScopeParams missing');
    expect(outcome.eachScopeParams.get('inheritedItem')).toBe('itemId');
  });
});
