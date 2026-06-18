import type { DiffTool } from '../types';
import { countChanges, lineDiff } from '../util/diff';
import { friendlyJsonError, sortDeep } from '../util/json';

/** Normalizes one side to sorted, pretty-printed JSON (or '' / an error). */
function normalize(side: string, label: string): { text?: string; error?: string } {
  const trimmed = side.trim();
  if (!trimmed) {
    return { text: '' };
  }
  try {
    return { text: JSON.stringify(sortDeep(JSON.parse(trimmed)), null, 2) };
  } catch (e) {
    return { error: `${label}: ${friendlyJsonError(trimmed, e as Error)}` };
  }
}

/**
 * Semantic-ish JSON diff: both sides are parsed, key-sorted, and pretty-printed before
 * diffing, so reordered keys and whitespace don't show up as changes — only real
 * structural/value differences do.
 */
export const jsonDiff: DiffTool = {
  id: 'json-diff',
  name: 'JSON Diff',
  category: 'diff',
  kind: 'diff',
  description: 'Compare two JSON documents structurally (keys sorted, formatting ignored).',
  keywords: ['diff', 'compare', 'json compare', 'difference', 'changes'],
  sampleLeft: '{"name":"bytesmith","version":1,"tags":["json","string"]}',
  sampleRight: '{"version":2,"name":"bytesmith","tags":["json","string","diff"]}',
  diff(left, right) {
    const a = normalize(left, 'Left');
    if (a.error) return { rows: [], error: a.error };
    const b = normalize(right, 'Right');
    if (b.error) return { rows: [], error: b.error };

    const rows = lineDiff(a.text!, b.text!);
    return { rows, meta: countChanges(rows) };
  },
};
