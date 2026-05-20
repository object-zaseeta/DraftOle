/**
 * Task 1.1: state-id-resolver.ts スモークテスト（エクスポート確認）
 *
 * このテストは state-id-resolver.ts が正しくエクスポートを提供することを確認する。
 * 詳細な動作テストは task 3.1 で行う。
 */

import { describe, expect, it } from 'vitest';

// Task 4.4: 型エクスポートのコンパイル時確認（実行時には型は消去されるため、
// import 文がコンパイル可能であること自体がエクスポート確認となる）
import type { StateIdFallback } from '../../src/transformer/state-id-fallback.ts';
import type {
  BuildStateIdMapOptions,
  StateIdResolution,
} from '../../src/transformer/state-id-resolver.ts';

describe('state-id-resolver exports', () => {
  it('isStateTypeNode が関数としてエクスポートされている', async () => {
    const mod = await import('../../src/transformer/state-id-resolver.ts');
    expect(typeof mod.isStateTypeNode).toBe('function');
  });

  it('resolveStateIdByType が関数としてエクスポートされている', async () => {
    const mod = await import('../../src/transformer/state-id-resolver.ts');
    expect(typeof mod.resolveStateIdByType).toBe('function');
  });

  it('buildSourceStateNameMap の export 元が state-id-fallback.ts であること（Task 2.2 で移動済み）', async () => {
    const fallbackMod = await import('../../src/transformer/state-id-fallback.ts');
    expect(typeof fallbackMod.buildSourceStateNameMap).toBe('function');

    // canonical 側（state-id-resolver.ts）から再エクスポートされていないこと
    const resolverMod = await import('../../src/transformer/state-id-resolver.ts');
    expect(
      (resolverMod as Record<string, unknown>).buildSourceStateNameMap,
    ).toBeUndefined();
  });

  it('buildStateIdMap が関数としてエクスポートされている', async () => {
    const mod = await import('../../src/transformer/state-id-resolver.ts');
    expect(typeof mod.buildStateIdMap).toBe('function');
  });

  it('createSourceStateNameFallback が関数としてエクスポートされている（state-id-fallback）', async () => {
    const mod = await import('../../src/transformer/state-id-fallback.ts');
    expect(typeof mod.createSourceStateNameFallback).toBe('function');
  });

  it('StateIdFallback 型が state-id-fallback からエクスポートされている（compile-time check）', () => {
    // 型は実行時に消去されるため、ここでは type-only import が成立することと
    // 型構造の代入互換性を runtime オブジェクトで検証する。
    const sample: StateIdFallback = {
      resolve: () => null,
      supportsPattern: () => false,
    };
    expect(typeof sample.resolve).toBe('function');
    expect(typeof sample.supportsPattern).toBe('function');
  });

  it('StateIdResolution / BuildStateIdMapOptions 型が state-id-resolver からエクスポートされている（compile-time check）', () => {
    // 型のみのエクスポート確認: 型構造を満たす runtime オブジェクトを構築できれば OK
    const resolution: StateIdResolution = {
      stateIdMap: new Map(),
      unresolved: new Map(),
    };
    const options: BuildStateIdMapOptions = {};
    expect(resolution.stateIdMap).toBeInstanceOf(Map);
    expect(resolution.unresolved).toBeInstanceOf(Map);
    expect(options).toBeDefined();
  });
});
