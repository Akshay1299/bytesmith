/** One aligned row of a side-by-side line diff. */
export interface DiffRow {
  type: 'equal' | 'add' | 'del' | 'change';
  left?: { n: number; text: string };
  right?: { n: number; text: string };
}

/**
 * Line-level diff via the classic LCS dynamic-programming algorithm, then aligned into
 * side-by-side rows. Consecutive delete+insert pairs are merged into "change" rows so the
 * common "edited a line" case reads naturally.
 *
 * O(n·m) time/space in line counts — fine for typical inputs; large pairs are guarded by
 * the caller. Pure and deterministic.
 */
export function lineDiff(aText: string, bText: string): DiffRow[] {
  const a = aText.length ? aText.split('\n') : [];
  const b = bText.length ? bText.split('\n') : [];
  const n = a.length;
  const m = b.length;

  // dp[i][j] = LCS length of a[i:] and b[j:]
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  type Op = { type: 'eq' | 'del' | 'add'; ai?: number; bi?: number };
  const ops: Op[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: 'eq', ai: i, bi: j });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: 'del', ai: i });
      i++;
    } else {
      ops.push({ type: 'add', bi: j });
      j++;
    }
  }
  while (i < n) ops.push({ type: 'del', ai: i++ });
  while (j < m) ops.push({ type: 'add', bi: j++ });

  // Build aligned rows. A run of deletes immediately followed by a run of inserts is
  // zipped position-by-position into "change" rows (left↔right on the same line), with any
  // leftover deletes/inserts spilling into their own rows. This makes a replaced block read
  // as side-by-side edits instead of a stack of reds then greens.
  const rows: DiffRow[] = [];
  let k = 0;
  while (k < ops.length) {
    if (ops[k].type === 'eq') {
      const op = ops[k++];
      rows.push({ type: 'equal', left: { n: op.ai! + 1, text: a[op.ai!] }, right: { n: op.bi! + 1, text: b[op.bi!] } });
      continue;
    }

    const dels: Op[] = [];
    while (k < ops.length && ops[k].type === 'del') dels.push(ops[k++]);
    const adds: Op[] = [];
    while (k < ops.length && ops[k].type === 'add') adds.push(ops[k++]);

    const paired = Math.min(dels.length, adds.length);
    for (let p = 0; p < paired; p++) {
      rows.push({
        type: 'change',
        left: { n: dels[p].ai! + 1, text: a[dels[p].ai!] },
        right: { n: adds[p].bi! + 1, text: b[adds[p].bi!] },
      });
    }
    for (let p = paired; p < dels.length; p++) {
      rows.push({ type: 'del', left: { n: dels[p].ai! + 1, text: a[dels[p].ai!] } });
    }
    for (let p = paired; p < adds.length; p++) {
      rows.push({ type: 'add', right: { n: adds[p].bi! + 1, text: b[adds[p].bi!] } });
    }
  }
  return rows;
}

/** Counts added/removed lines from diff rows (a "change" touches both sides). */
export function countChanges(rows: DiffRow[]): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  for (const row of rows) {
    if (row.type === 'add') added++;
    else if (row.type === 'del') removed++;
    else if (row.type === 'change') {
      added++;
      removed++;
    }
  }
  return { added, removed };
}
