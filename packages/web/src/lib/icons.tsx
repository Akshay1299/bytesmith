import type { ComponentType } from 'react';
import type { ToolCategory } from '@bytesmith/core';
import {
  Braces,
  Quote,
  Sparkles,
  Minimize2,
  ShieldCheck,
  ArrowDownAZ,
  Code2,
  Binary,
  GitCompareArrows,
  Repeat,
  Gauge,
  type LucideProps,
} from 'lucide-react';

type Icon = ComponentType<LucideProps>;

/** Per-tool icon; falls back to the category icon. */
const TOOL_ICONS: Record<string, Icon> = {
  'json-parse-string': Quote,
  'json-escape': Code2,
  'json-beautify': Sparkles,
  'json-minify': Minimize2,
  'json-validate': ShieldCheck,
  'json-sort-keys': ArrowDownAZ,
  'json-size': Gauge,
};

const CATEGORY_ICONS: Record<ToolCategory, Icon> = {
  json: Braces,
  string: Quote,
  encode: Binary,
  diff: GitCompareArrows,
  convert: Repeat,
};

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  json: 'JSON',
  string: 'String',
  encode: 'Encode',
  convert: 'Convert',
  diff: 'Diff',
};

export function toolIcon(id: string, category: ToolCategory): Icon {
  return TOOL_ICONS[id] ?? CATEGORY_ICONS[category];
}
