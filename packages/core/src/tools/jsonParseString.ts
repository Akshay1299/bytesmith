import type { Tool } from '../types';

/**
 * Decodes an escaped JSON string into raw, readable text — the headline use case:
 * paste a blob full of `\n`, `\"`, `\t`, `\uXXXX` and get back the real multi-line text.
 *
 * Handles both a fully-quoted JSON string literal (`"a\nb"`) and a bare escaped body
 * (`a\nb`) by trying the quoted form first, then wrapping.
 */
export const jsonParseString: Tool = {
  id: 'json-parse-string',
  name: 'JSON Parse String',
  category: 'json',
  description: 'Decode an escaped JSON string (\\n, \\", \\t, \\uXXXX) into raw, readable text.',
  keywords: ['unescape', 'decode', 'parse', 'unstringify', 'raw', 'unwrap', 'literal'],
  sample: '"Hello,\\n\\t\\"world\\"\\nLine \\u2014 three"',
  run(input) {
    if (!input.trim()) {
      return { output: '' };
    }
    const trimmed = input.trim();

    // Case 1: already a valid quoted JSON literal.
    try {
      const value = JSON.parse(trimmed) as unknown;
      if (typeof value === 'string') {
        return { output: value };
      }
      // Parsed to a non-string (object/array/number) — show it pretty-printed.
      return {
        output: typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) : String(value),
      };
    } catch {
      // fall through to bare-body handling
    }

    // Case 2: bare escaped body without surrounding quotes — wrap and parse.
    try {
      const value = JSON.parse(`"${trimmed}"`) as string;
      return { output: value };
    } catch (e) {
      return { output: '', error: `Could not parse as an escaped JSON string: ${(e as Error).message}` };
    }
  },
};
