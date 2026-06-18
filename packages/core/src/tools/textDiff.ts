import type { DiffTool } from '../types';
import { countChanges, lineDiff } from '../util/diff';

/** Side-by-side line diff of two arbitrary text blocks. */
export const textDiff: DiffTool = {
  id: 'text-diff',
  name: 'Text Diff',
  category: 'diff',
  kind: 'diff',
  description: 'Compare two blocks of text line by line, side by side.',
  keywords: ['diff', 'compare', 'difference', 'changes', 'delta', 'compare text'],
  sampleLeft: 'name: bytesmith\nversion: 1\ntags: json, string\nstatus: draft',
  sampleRight: 'name: bytesmith\nversion: 2\ntags: json, string, diff\nstatus: shipped',
  diff(left, right) {
    const rows = lineDiff(left, right);
    return { rows, meta: countChanges(rows) };
  },
};
