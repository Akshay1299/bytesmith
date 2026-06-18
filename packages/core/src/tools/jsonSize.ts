import type { Tool } from '../types';
import { byteLength, formatBytes } from '../util/json';

function pad(label: string): string {
  return (label + '          ').slice(0, 11);
}

/** Reports the byte size of the input, plus its minified JSON size when applicable. */
export const jsonSize: Tool = {
  id: 'json-size',
  name: 'JSON Size',
  category: 'json',
  description: 'Measure the byte size (B / KB / MB) of the input, plus its minified JSON size.',
  keywords: ['size', 'bytes', 'kb', 'mb', 'length', 'weight', 'how big', 'payload'],
  sample: '{"name":"bytesmith","tags":["json","string","diff"],"nested":{"a":1,"b":[2,3,4]}}',
  run(input) {
    if (!input.trim()) {
      return { output: '' };
    }
    const bytes = byteLength(input);
    const lines = [
      `${pad('Size')}: ${formatBytes(bytes)}  (${bytes.toLocaleString()} bytes)`,
      `${pad('Characters')}: ${input.length.toLocaleString()}`,
      `${pad('Lines')}: ${input.split('\n').length.toLocaleString()}`,
    ];

    try {
      const minified = JSON.stringify(JSON.parse(input));
      const minBytes = byteLength(minified);
      const saved = bytes - minBytes;
      lines.push('', `${pad('Minified')}: ${formatBytes(minBytes)}  (${minBytes.toLocaleString()} bytes)`);
      if (saved > 0) {
        lines.push(`${pad('Could save')}: ${formatBytes(saved)}  (${Math.round((saved / bytes) * 100)}% smaller)`);
      }
    } catch {
      // not JSON — the raw size above is still useful
    }

    return { output: lines.join('\n'), meta: { bytes } };
  },
};
