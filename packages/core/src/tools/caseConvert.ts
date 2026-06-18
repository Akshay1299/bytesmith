import type { TransformTool } from '../types';

/** Splits an identifier/phrase into words, handling camelCase, snake/kebab, and punctuation. */
function splitWords(line: string): string[] {
  return line
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // JSONString -> JSON String
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // parseJson -> parse Json
    .replace(/[_-]+/g, ' ')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
const low = (w: string) => w.toLowerCase();

function convertLine(line: string, target: string): string {
  const w = splitWords(line);
  if (!w.length) return '';
  switch (target) {
    case 'camel':
      return w.map((x, i) => (i ? cap(x) : low(x))).join('');
    case 'pascal':
      return w.map(cap).join('');
    case 'snake':
      return w.map(low).join('_');
    case 'kebab':
      return w.map(low).join('-');
    case 'constant':
      return w.map((x) => x.toUpperCase()).join('_');
    case 'title':
      return w.map(cap).join(' ');
    default:
      return line;
  }
}

/** Converts text between common programming naming conventions, line by line. */
export const caseConvert: TransformTool = {
  id: 'case-convert',
  name: 'Case Converter',
  category: 'string',
  description: 'Convert text between camelCase, snake_case, kebab-case, and more.',
  keywords: ['case', 'camel', 'snake', 'kebab', 'pascal', 'constant', 'title', 'convert', 'naming'],
  sample: 'Bytesmith Dev Tools',
  options: [
    {
      key: 'target',
      label: 'Case',
      type: 'select',
      default: 'camel',
      options: [
        { label: 'camelCase', value: 'camel' },
        { label: 'PascalCase', value: 'pascal' },
        { label: 'snake_case', value: 'snake' },
        { label: 'kebab-case', value: 'kebab' },
        { label: 'CONSTANT', value: 'constant' },
        { label: 'Title Case', value: 'title' },
      ],
    },
  ],
  run(input, options) {
    if (!input) return { output: '' };
    const target = String(options.target);
    return { output: input.split('\n').map((line) => convertLine(line, target)).join('\n') };
  },
};
