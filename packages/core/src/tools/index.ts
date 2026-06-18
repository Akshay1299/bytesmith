import { ToolRegistry } from '../registry';
import { jsonBeautify } from './jsonBeautify';
import { jsonParseString } from './jsonParseString';
import { jsonMinify } from './jsonMinify';
import { jsonValidate } from './jsonValidate';
import { jsonSortKeys } from './jsonSortKeys';
import { jsonEscape } from './jsonEscape';
import { jsonSize } from './jsonSize';
import { base64Encode, base64Decode, urlEncode, urlDecode } from './encoders';
import { textDiff } from './textDiff';
import { jsonDiff } from './jsonDiff';

/**
 * The single source of truth for the tool catalog. Order here is the display order in the
 * sidebar — most-used first (Beautify), so the app opens on the tool people reach for most.
 * Adding a tool is a single `register()` call; the UI adapts automatically.
 */
export const registry = new ToolRegistry()
  // JSON
  .register(jsonBeautify)
  .register(jsonParseString)
  .register(jsonMinify)
  .register(jsonValidate)
  .register(jsonSortKeys)
  .register(jsonEscape)
  .register(jsonSize)
  // Encode
  .register(base64Encode)
  .register(base64Decode)
  .register(urlEncode)
  .register(urlDecode)
  // Diff
  .register(textDiff)
  .register(jsonDiff);

export {
  jsonBeautify,
  jsonParseString,
  jsonMinify,
  jsonValidate,
  jsonSortKeys,
  jsonEscape,
  jsonSize,
  base64Encode,
  base64Decode,
  urlEncode,
  urlDecode,
  textDiff,
  jsonDiff,
};
