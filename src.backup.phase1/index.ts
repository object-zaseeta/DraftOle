// Core interfaces
export type { Renderable } from './utils/renderable.js';
export type { Exportable } from './utils/exportable.js';
export { ExportableError } from './utils/exportable.js';
export type { OleTestable, ViewPortSizeProvider } from './utils/ole-testable.js';

// CSS units
export type { UnitStyle, RelationShip, HlUnit } from './utils/unit-style.js';
export { hlUnit, hlUnitToCssString } from './utils/unit-style.js';

// Utilities
export { characterDiff } from './utils/string-ext.js';
