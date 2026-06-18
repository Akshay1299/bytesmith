import { ToolRegistry } from '../registry';
import { jsonBeautify } from './jsonBeautify';
import { jsonParseString } from './jsonParseString';
import { jsonMinify } from './jsonMinify';
import { jsonValidate } from './jsonValidate';
import { jsonSortKeys } from './jsonSortKeys';
import { jsonEscape } from './jsonEscape';
import { jsonSize } from './jsonSize';

/**
 * The single source of truth for the tool catalog. Order here is the display order in the
 * sidebar — most-used first (Beautify), so the app opens on the tool people reach for most.
 * Adding a tool is a single `register()` call; the UI adapts automatically.
 */
export const registry = new ToolRegistry()
  .register(jsonBeautify)
  .register(jsonParseString)
  .register(jsonMinify)
  .register(jsonValidate)
  .register(jsonSortKeys)
  .register(jsonEscape)
  .register(jsonSize);

export {
  jsonBeautify,
  jsonParseString,
  jsonMinify,
  jsonValidate,
  jsonSortKeys,
  jsonEscape,
  jsonSize,
};
