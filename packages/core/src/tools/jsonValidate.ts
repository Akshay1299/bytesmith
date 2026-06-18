import type { Tool } from '../types';
import { friendlyJsonError } from '../util/json';

function describe(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `array (${value.length} item${value.length === 1 ? '' : 's'})`;
  if (typeof value === 'object') return `object (${Object.keys(value as object).length} keys)`;
  return typeof value;
}

/** Validates JSON and reports a concise summary, or a located error. */
export const jsonValidate: Tool = {
  id: 'json-validate',
  name: 'JSON Validate',
  category: 'json',
  description: 'Check whether the input is valid JSON and summarize its shape.',
  sample: '{"ok": true, "items": [1, 2, 3], "meta": null}',
  run(input) {
    const trimmed = input.trim();
    if (!trimmed) {
      return { output: '' };
    }
    try {
      const parsed: unknown = JSON.parse(trimmed);
      const summary = [
        '✓ Valid JSON',
        '',
        `Root type : ${describe(parsed)}`,
        `Length    : ${trimmed.length.toLocaleString()} chars`,
      ].join('\n');
      return { output: summary, meta: { valid: true } };
    } catch (e) {
      return { output: '', error: friendlyJsonError(trimmed, e as Error), meta: { valid: false } };
    }
  },
};
