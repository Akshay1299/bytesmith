/** High-level grouping a tool belongs to (drives the sidebar sections). */
export type ToolCategory = 'json' | 'string' | 'encode' | 'diff' | 'convert';

/** A single configurable option a tool exposes in the UI. */
export interface ToolOptionField {
  key: string;
  label: string;
  type: 'boolean' | 'select';
  default: boolean | string;
  /** Choices when {@link type} is `select`. */
  options?: { label: string; value: string }[];
}

/** The result of running a tool. Tools never throw — failures land in {@link error}. */
export interface ToolResult {
  output: string;
  /** User-facing message when the input could not be processed. */
  error?: string;
  /** Optional structured extras (counts, detected type, …) for the UI. */
  meta?: Record<string, unknown>;
}

/**
 * The contract every tool implements. A tool is a pure, side-effect-free unit:
 * the same `(input, options)` always yields the same {@link ToolResult}. This is what
 * makes the catalog trivially testable and lets the UI stay generic — it only ever talks
 * to this interface, never to a concrete tool (Dependency Inversion).
 */
export interface Tool {
  id: string;
  name: string;
  category: ToolCategory;
  description: string;
  /** One-click example input shown in the UI. */
  sample?: string;
  /** Tool-specific options rendered as a compact control row. */
  options?: ToolOptionField[];
  run(input: string, options: ToolOptions): ToolResult;
}

export type ToolOptions = Record<string, boolean | string>;

/** Builds the default option map for a tool from its declared fields. */
export function defaultOptions(tool: Tool): ToolOptions {
  const out: ToolOptions = {};
  for (const field of tool.options ?? []) {
    out[field.key] = field.default;
  }
  return out;
}
