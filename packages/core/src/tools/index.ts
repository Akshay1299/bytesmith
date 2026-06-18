import { ToolRegistry } from '../registry';
import { jsonParseString } from './jsonParseString';
import { jsonEscape } from './jsonEscape';
import { jsonBeautify } from './jsonBeautify';
import { jsonMinify } from './jsonMinify';
import { jsonValidate } from './jsonValidate';
import { jsonSortKeys } from './jsonSortKeys';

/**
 * The single source of truth for the tool catalog. New tools are added here — the UI
 * renders whatever is registered, so nothing else needs to change.
 */
export const registry = new ToolRegistry()
  .register(jsonParseString)
  .register(jsonEscape)
  .register(jsonBeautify)
  .register(jsonMinify)
  .register(jsonValidate)
  .register(jsonSortKeys);

export {
  jsonParseString,
  jsonEscape,
  jsonBeautify,
  jsonMinify,
  jsonValidate,
  jsonSortKeys,
};
