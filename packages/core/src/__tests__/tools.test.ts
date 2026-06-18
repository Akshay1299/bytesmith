import { describe, it, expect } from 'vitest';
import { defaultOptions } from '../types';
import { friendlyJsonError } from '../util/json';
import { registry } from '../tools/index';
import {
  jsonParseString,
  jsonEscape,
  jsonBeautify,
  jsonMinify,
  jsonValidate,
  jsonSortKeys,
} from '../tools/index';

const run = (tool: typeof jsonBeautify, input: string, opts?: Record<string, boolean | string>) =>
  tool.run(input, { ...defaultOptions(tool), ...opts });

describe('registry', () => {
  it('registers all tools with unique ids', () => {
    const ids = registry.all().map((t) => t.id);
    expect(ids.length).toBe(new Set(ids).size);
    expect(ids).toContain('json-parse-string');
  });

  it('rejects duplicate ids', () => {
    expect(() => registry.register(jsonParseString)).toThrow(/Duplicate/);
  });

  it('groups by category', () => {
    const groups = registry.grouped();
    expect(groups[0].category).toBe('json');
  });
});

describe('json-parse-string', () => {
  it('decodes a quoted escaped literal', () => {
    expect(run(jsonParseString, '"a\\nb\\t\\"c\\""').output).toBe('a\nb\t"c"');
  });

  it('decodes a bare escaped body without quotes', () => {
    expect(run(jsonParseString, 'a\\nb').output).toBe('a\nb');
  });

  it('decodes unicode escapes', () => {
    expect(run(jsonParseString, '"\\u2014"').output).toBe('—');
  });

  it('is the inverse of json-escape', () => {
    const raw = 'Line one\n\t"quoted"\nLine — three';
    const escaped = run(jsonEscape, raw).output;
    expect(run(jsonParseString, escaped).output).toBe(raw);
  });

  it('returns empty output for empty input', () => {
    expect(run(jsonParseString, '   ').output).toBe('');
  });
});

describe('json-escape', () => {
  it('escapes newlines and quotes and wraps in quotes by default', () => {
    expect(run(jsonEscape, 'a\n"b"').output).toBe('"a\\n\\"b\\""');
  });

  it('omits surrounding quotes when configured', () => {
    expect(run(jsonEscape, 'a\nb', { quotes: false }).output).toBe('a\\nb');
  });
});

describe('json-beautify', () => {
  it('pretty-prints with 2-space indent by default', () => {
    expect(run(jsonBeautify, '{"a":1}').output).toBe('{\n  "a": 1\n}');
  });

  it('can sort keys', () => {
    const out = run(jsonBeautify, '{"b":1,"a":2}', { sortKeys: true }).output;
    expect(out.indexOf('"a"')).toBeLessThan(out.indexOf('"b"'));
  });

  it('reports an error on invalid JSON', () => {
    const res = run(jsonBeautify, '{"a": }');
    expect(res.output).toBe('');
    expect(res.error).toBeTruthy();
  });
});

describe('friendlyJsonError', () => {
  it('computes line/column from a position-style message', () => {
    const src = '{\n  "a": 1\n  "b": 2\n}';
    const msg = friendlyJsonError(src, new Error('Unexpected string at position 13'));
    expect(msg).toMatch(/line 3, column 3/);
  });

  it('normalizes a message that already carries line/column', () => {
    const msg = friendlyJsonError('', new Error('Bad value in JSON at position 7 (line 1 column 8)'));
    expect(msg).toMatch(/line 1, column 8/);
  });
});

describe('json-minify', () => {
  it('removes whitespace and reports savings', () => {
    const res = run(jsonMinify, '{\n  "a": 1\n}');
    expect(res.output).toBe('{"a":1}');
    expect(res.meta?.saved).toBeGreaterThan(0);
  });
});

describe('json-validate', () => {
  it('summarizes valid JSON', () => {
    const res = run(jsonValidate, '{"a":1,"b":2}');
    expect(res.meta?.valid).toBe(true);
    expect(res.output).toMatch(/Valid JSON/);
    expect(res.output).toMatch(/object \(2 keys\)/);
  });

  it('flags invalid JSON', () => {
    const res = run(jsonValidate, '{nope}');
    expect(res.meta?.valid).toBe(false);
    expect(res.error).toBeTruthy();
  });
});

describe('json-sort-keys', () => {
  it('sorts nested keys recursively', () => {
    const out = run(jsonSortKeys, '{"z":{"b":1,"a":2},"a":1}').output;
    expect(out).toBe('{\n  "a": 1,\n  "z": {\n    "a": 2,\n    "b": 1\n  }\n}');
  });
});
