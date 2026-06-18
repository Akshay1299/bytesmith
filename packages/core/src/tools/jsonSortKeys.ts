import type { Tool } from '../types';
import { friendlyJsonError, resolveIndent, sortDeep } from '../util/json';

/** Recursively sorts all object keys alphabetically — handy for stable diffs. */
export const jsonSortKeys: Tool = {
  id: 'json-sort-keys',
  name: 'JSON Sort Keys',
  category: 'json',
  description: 'Recursively sort all object keys alphabetically (great before diffing).',
  keywords: ['sort', 'order', 'alphabetize', 'alphabetical', 'stable', 'reorder', 'keys'],
  sample: '{"name":"bytesmith","age":1,"tags":["b","a"],"nested":{"z":1,"a":2}}',
  options: [
    {
      key: 'indent',
      label: 'Indent',
      type: 'select',
      default: '2',
      options: [
        { label: '2 spaces', value: '2' },
        { label: '4 spaces', value: '4' },
        { label: 'Tab', value: 'tab' },
      ],
    },
  ],
  run(input, options) {
    const trimmed = input.trim();
    if (!trimmed) {
      return { output: '' };
    }
    try {
      const parsed: unknown = JSON.parse(trimmed);
      return { output: JSON.stringify(sortDeep(parsed), null, resolveIndent(String(options.indent))) };
    } catch (e) {
      return { output: '', error: friendlyJsonError(trimmed, e as Error) };
    }
  },
};
