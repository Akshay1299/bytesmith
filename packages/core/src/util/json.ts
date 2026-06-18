/** Recursively sorts object keys (arrays keep order). Used by beautify/sort-keys. */
export function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortDeep);
  }
  if (value && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    return Object.keys(source)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortDeep(source[key]);
        return acc;
      }, {});
  }
  return value;
}

/**
 * Turns a raw `JSON.parse` error into a message with a line/column, which is far more
 * useful than "Unexpected token … in JSON at position 482" on a large payload.
 */
export function friendlyJsonError(source: string, error: Error): string {
  const message = error.message;

  // V8 message shapes vary across Node versions:
  //   • "... in JSON at position 7 (line 1 column 8)"  → already located
  //   • "... at position 7"                            → compute line/column ourselves
  //   • "Unexpected token '}', \"...\" is not valid JSON" → no position at all
  if (/line \d+ column \d+/i.test(message)) {
    return message.replace(/line (\d+) column (\d+)/i, 'line $1, column $2');
  }

  const match = /position (\d+)/.exec(message);
  if (!match) {
    return message;
  }

  const pos = Number(match[1]);
  let line = 1;
  let col = 1;
  for (let i = 0; i < pos && i < source.length; i++) {
    if (source[i] === '\n') {
      line++;
      col = 1;
    } else {
      col++;
    }
  }
  const base = message.replace(/\s*in JSON at position \d+.*/, '').replace(/\s*at position \d+.*/, '');
  return `${base} (line ${line}, column ${col})`;
}

/** Resolves an indent option ("2" | "4" | "tab") to the value `JSON.stringify` expects. */
export function resolveIndent(indent: string): string | number {
  return indent === 'tab' ? '\t' : Number(indent);
}

/** Human-readable byte size: 942 B, 12.3 KB, 1.45 MB. */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 2 : 1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

/** UTF-8 byte length of a string (what actually travels over the wire / disk). */
export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}
