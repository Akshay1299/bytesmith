import { describe, it, expect } from 'vitest';
import { defaultOptions } from '../types';
import { friendlyJsonError } from '../util/json';
import { lineDiff, countChanges } from '../util/diff';
import { registry } from '../tools/index';
import {
  base64Encode,
  base64Decode,
  urlEncode,
  urlDecode,
  textDiff,
  jsonDiff,
  unixTime,
  uuidGenerator,
  caseConvert,
} from '../tools/index';
import {
  jsonParseString,
  jsonEscape,
  jsonBeautify,
  jsonMinify,
  jsonValidate,
  jsonSortKeys,
  jsonSize,
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

  it('orders Beautify first (most-used)', () => {
    expect(registry.all()[0].id).toBe('json-beautify');
  });

  it('exposes keyword aliases for discovery', () => {
    expect(registry.get('json-beautify')?.keywords).toContain('format');
    expect(registry.get('json-parse-string')?.keywords).toContain('unescape');
    expect(registry.get('json-minify')?.keywords).toContain('compress');
  });
});

describe('json-size', () => {
  it('reports byte size and minified size for JSON', () => {
    const res = run(jsonSize, '{\n  "a": 1,\n  "b": 2\n}');
    expect(res.output).toMatch(/Size/);
    expect(res.output).toMatch(/Minified/);
    expect(res.meta?.bytes).toBeGreaterThan(0);
  });

  it('reports raw size for non-JSON without a minified line', () => {
    const res = run(jsonSize, 'just some text');
    expect(res.output).toMatch(/Size/);
    expect(res.output).not.toMatch(/Minified/);
  });

  it('counts multi-byte characters as their UTF-8 byte length', () => {
    // "€" is 3 bytes in UTF-8
    const res = run(jsonSize, '€');
    expect(res.meta?.bytes).toBe(3);
  });
});

describe('encoders', () => {
  it('base64 round-trips UTF-8 (incl. emoji)', () => {
    const raw = 'Hello — 🔨';
    const encoded = base64Encode.run(raw, {}).output;
    expect(base64Decode.run(encoded, {}).output).toBe(raw);
  });

  it('flags invalid base64', () => {
    expect(base64Decode.run('not*valid*b64', {}).error).toBeTruthy();
  });

  it('url-encode round-trips', () => {
    const raw = 'name=byte smith&tag=a/b?c';
    const encoded = urlEncode.run(raw, {}).output;
    expect(encoded).not.toContain(' ');
    expect(urlDecode.run(encoded, {}).output).toBe(raw);
  });
});

describe('lineDiff', () => {
  it('detects an equal/change/add sequence', () => {
    const rows = lineDiff('a\nb\nc', 'a\nB\nc\nd');
    expect(rows[0]).toMatchObject({ type: 'equal' });
    expect(rows[1]).toMatchObject({ type: 'change' });
    expect(rows[2]).toMatchObject({ type: 'equal' });
    expect(rows[3]).toMatchObject({ type: 'add' });
    expect(countChanges(rows)).toEqual({ added: 2, removed: 1 });
  });

  it('is all-equal for identical text', () => {
    const rows = lineDiff('x\ny', 'x\ny');
    expect(rows.every((r) => r.type === 'equal')).toBe(true);
  });
});

describe('json-diff', () => {
  it('ignores key order and whitespace', () => {
    const res = jsonDiff.diff('{"a":1,"b":2}', '{ "b": 2, "a": 1 }', {});
    expect(res.error).toBeUndefined();
    expect(res.rows.every((r) => r.type === 'equal')).toBe(true);
  });

  it('surfaces real value changes', () => {
    const res = jsonDiff.diff('{"a":1}', '{"a":2}', {});
    expect(res.meta?.added).toBeGreaterThan(0);
  });

  it('reports which side is invalid', () => {
    const res = jsonDiff.diff('{bad}', '{"a":1}', {});
    expect(res.error).toMatch(/^Left:/);
  });
});

describe('text-diff tool', () => {
  it('produces rows + meta', () => {
    const res = textDiff.diff('one\ntwo', 'one\n2', {});
    expect(res.rows.length).toBeGreaterThan(0);
    expect(res.meta).toBeDefined();
  });
});

describe('unix-time', () => {
  it('converts epoch seconds to ISO/UTC', () => {
    const res = unixTime.run('1700000000', {});
    expect(res.output).toContain('2023-11-14T22:13:20.000Z');
    expect(res.output).toMatch(/Unix \(s\)\s*: 1700000000/);
    expect(res.output).toContain('detected: seconds');
  });

  it('treats large numbers as milliseconds', () => {
    const res = unixTime.run('1700000000000', {});
    expect(res.output).toContain('2023-11-14T22:13:20.000Z');
    expect(res.output).toContain('detected: milliseconds');
  });

  it('parses a date string back to epoch', () => {
    const res = unixTime.run('2023-11-14T22:13:20Z', {});
    expect(res.output).toMatch(/Unix \(s\)\s*: 1700000000/);
  });

  it('errors on garbage', () => {
    expect(unixTime.run('not a date', {}).error).toBeTruthy();
  });
});

describe('case-convert', () => {
  const c = (input: string, target: string) => caseConvert.run(input, { target }).output;
  it('converts to the common cases', () => {
    expect(c('Bytesmith Dev Tools', 'camel')).toBe('bytesmithDevTools');
    expect(c('Bytesmith Dev Tools', 'pascal')).toBe('BytesmithDevTools');
    expect(c('Bytesmith Dev Tools', 'snake')).toBe('bytesmith_dev_tools');
    expect(c('Bytesmith Dev Tools', 'kebab')).toBe('bytesmith-dev-tools');
    expect(c('Bytesmith Dev Tools', 'constant')).toBe('BYTESMITH_DEV_TOOLS');
  });
  it('splits camelCase input back into words', () => {
    expect(c('parseJSONString', 'kebab')).toBe('parse-json-string');
  });
  it('processes each line independently', () => {
    expect(c('one two\nthree four', 'snake')).toBe('one_two\nthree_four');
  });
});

describe('uuid-generator', () => {
  const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  it('generates the requested count of valid v4 UUIDs', () => {
    const res = uuidGenerator.generate({ count: '5', uppercase: false, hyphens: true });
    const ids = res.output.split('\n');
    expect(ids).toHaveLength(5);
    expect(ids.every((id) => V4.test(id))).toBe(true);
  });

  it('honors uppercase and hyphen options', () => {
    const res = uuidGenerator.generate({ count: '1', uppercase: true, hyphens: false });
    expect(res.output).toMatch(/^[0-9A-F]{32}$/);
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
