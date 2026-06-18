import type { Tool } from '../types';
import { friendlyJsonError, resolveIndent, sortDeep } from '../util/json';

/** Pretty-prints JSON with configurable indentation and optional key sorting. */
export const jsonBeautify: Tool = {
  id: 'json-beautify',
  name: 'JSON Beautify',
  category: 'json',
  description: 'Pretty-print and validate JSON with configurable indentation.',
  sample: '{"name":"bytesmith","tags":["json","string","diff"],"nested":{"b":2,"a":1}}',
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
    { key: 'sortKeys', label: 'Sort keys', type: 'boolean', default: false },
  ],
  run(input, options) {
    const trimmed = input.trim();
    if (!trimmed) {
      return { output: '' };
    }
    try {
      const parsed: unknown = JSON.parse(trimmed);
      const value = options.sortKeys ? sortDeep(parsed) : parsed;
      return { output: JSON.stringify(value, null, resolveIndent(String(options.indent))) };
    } catch (e) {
      return { output: '', error: friendlyJsonError(trimmed, e as Error) };
    }
  },
};
