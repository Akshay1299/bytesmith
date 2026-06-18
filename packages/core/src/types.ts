import type { DiffRow } from './util/diff';

/** High-level grouping a tool belongs to (drives the sidebar sections). */
export type ToolCategory = 'json' | 'string' | 'encode' | 'diff' | 'convert' | 'time' | 'generate';

/** A single configurable option a tool exposes in the UI. */
export interface ToolOptionField {
  key: string;
  label: string;
  type: 'boolean' | 'select';
  default: boolean | string;
  /** Choices when {@link type} is `select`. */
  options?: { label: string; value: string }[];
}

/** The result of running a transform tool. Tools never throw — failures land in {@link error}. */
export interface ToolResult {
  output: string;
  /** User-facing message when the input could not be processed. */
  error?: string;
  /** Optional structured extras (counts, detected type, …) for the UI. */
  meta?: Record<string, unknown>;
}

/** The result of running a diff tool. */
export interface DiffResult {
  rows: DiffRow[];
  error?: string;
  meta?: { added: number; removed: number };
}

export type ToolOptions = Record<string, boolean | string>;

interface CommonTool {
  id: string;
  name: string;
  category: ToolCategory;
  description: string;
  /** Search aliases — what people actually type ("format", "unescape", "compress"). */
  keywords?: string[];
  /** Tool-specific options rendered as a compact control row. */
  options?: ToolOptionField[];
}

/**
 * A single-input transform tool — a pure, side-effect-free unit: the same `(input, options)`
 * always yields the same {@link ToolResult}. The UI only talks to this interface, never to a
 * concrete tool (Dependency Inversion).
 */
export interface TransformTool extends CommonTool {
  kind?: 'transform';
  /** One-click example input shown in the UI. */
  sample?: string;
  run(input: string, options: ToolOptions): ToolResult;
}

/** A two-input diff tool that produces aligned side-by-side rows. */
export interface DiffTool extends CommonTool {
  kind: 'diff';
  sampleLeft?: string;
  sampleRight?: string;
  diff(left: string, right: string, options: ToolOptions): DiffResult;
}

/** A no-input generator (UUIDs, passwords, …) that produces output on demand. */
export interface GeneratorTool extends CommonTool {
  kind: 'generate';
  generate(options: ToolOptions): ToolResult;
}

/**
 * A tool with a fully bespoke UI (e.g. the timezone converter's world map). Core only
 * declares it exists + its metadata; the web app supplies the component and uses the pure
 * helper functions exported from core for the actual logic.
 */
export interface CustomTool extends CommonTool {
  kind: 'custom';
}

export type Tool = TransformTool | DiffTool | GeneratorTool | CustomTool;

export function isDiffTool(tool: Tool): tool is DiffTool {
  return tool.kind === 'diff';
}

export function isGeneratorTool(tool: Tool): tool is GeneratorTool {
  return tool.kind === 'generate';
}

export function isCustomTool(tool: Tool): tool is CustomTool {
  return tool.kind === 'custom';
}

/** Builds the default option map for a tool from its declared fields. */
export function defaultOptions(tool: Tool): ToolOptions {
  const out: ToolOptions = {};
  for (const field of tool.options ?? []) {
    out[field.key] = field.default;
  }
  return out;
}
