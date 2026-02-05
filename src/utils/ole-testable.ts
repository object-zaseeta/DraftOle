import type { HlUnit } from './unit-style.js';

export interface ViewPortSizeProvider {
  width: number;
  height: number;
}

export interface OleTestable {
  _testableConvertHlUnitToDouble(
    context: number | undefined,
    unit: HlUnit,
    provider?: ViewPortSizeProvider,
  ): number;
  _testableUpdateAllContext(): void;
}
