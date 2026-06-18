import type { Tool } from '../types';
import { friendlyJsonError } from '../util/json';

/** Strips all insignificant whitespace from JSON. */
export const jsonMinify: Tool = {
  id: 'json-minify',
  name: 'JSON Minify',
  category: 'json',
  description: 'Compress JSON to a single line by removing all insignificant whitespace.',
  sample: '{\n  "name": "bytesmith",\n  "tags": ["json", "string"]\n}',
  run(input) {
    const trimmed = input.trim();
    if (!trimmed) {
      return { output: '' };
    }
    try {
      const parsed: unknown = JSON.parse(trimmed);
      const output = JSON.stringify(parsed);
      const saved = trimmed.length - output.length;
      const pct = trimmed.length > 0 ? Math.round((saved / trimmed.length) * 100) : 0;
      return { output, meta: { saved, pct } };
    } catch (e) {
      return { output: '', error: friendlyJsonError(trimmed, e as Error) };
    }
  },
};
