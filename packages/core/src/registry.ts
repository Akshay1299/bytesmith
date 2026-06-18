import type { Tool, ToolCategory } from './types';

/**
 * In-memory catalog of tools. Adding a new tool is a single `register()` call and never
 * requires touching existing code or the UI (Open/Closed Principle).
 */
export class ToolRegistry {
  private readonly tools = new Map<string, Tool>();

  register(tool: Tool): this {
    if (this.tools.has(tool.id)) {
      throw new Error(`Duplicate tool id: ${tool.id}`);
    }
    this.tools.set(tool.id, tool);
    return this;
  }

  get(id: string): Tool | undefined {
    return this.tools.get(id);
  }

  all(): Tool[] {
    return [...this.tools.values()];
  }

  /** Tools grouped by category, preserving registration order within each group. */
  grouped(): { category: ToolCategory; tools: Tool[] }[] {
    const order: ToolCategory[] = ['json', 'diff', 'time', 'generate', 'string', 'encode', 'convert'];
    const byCat = new Map<ToolCategory, Tool[]>();
    for (const tool of this.tools.values()) {
      const list = byCat.get(tool.category) ?? [];
      list.push(tool);
      byCat.set(tool.category, list);
    }
    return order
      .filter((c) => byCat.has(c))
      .map((category) => ({ category, tools: byCat.get(category)! }));
  }
}
