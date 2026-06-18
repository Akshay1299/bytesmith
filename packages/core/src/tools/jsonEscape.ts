import type { Tool } from '../types';

/**
 * The inverse of {@link jsonParseString}: turns raw text into a JSON-escaped string,
 * so multi-line content can be embedded inside JSON / code.
 */
export const jsonEscape: Tool = {
  id: 'json-escape',
  name: 'JSON Escape String',
  category: 'json',
  description: 'Escape raw text into a JSON string (newlines, quotes, tabs → \\n, \\", \\t).',
  keywords: ['escape', 'stringify', 'encode', 'quote', 'wrap', 'serialize'],
  sample: 'Hello,\n\t"world"\nLine — three',
  options: [{ key: 'quotes', label: 'Wrap in quotes', type: 'boolean', default: true }],
  run(input, options) {
    if (!input) {
      return { output: '' };
    }
    const escaped = JSON.stringify(input); // always yields a valid "...."
    return { output: options.quotes ? escaped : escaped.slice(1, -1) };
  },
};
