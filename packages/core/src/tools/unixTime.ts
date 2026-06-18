import type { TransformTool } from '../types';

const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

function pad(label: string): string {
  return (label + '           ').slice(0, 12);
}

function fmt(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'long',
    timeZone,
  }).format(date);
}

function relative(targetMs: number): string {
  const diff = targetMs - Date.now();
  const abs = Math.abs(diff);
  const units: [number, string][] = [
    [31536000000, 'year'],
    [2592000000, 'month'],
    [86400000, 'day'],
    [3600000, 'hour'],
    [60000, 'minute'],
    [1000, 'second'],
  ];
  for (const [ms, name] of units) {
    if (abs >= ms) {
      const n = Math.round(abs / ms);
      const label = `${n} ${name}${n === 1 ? '' : 's'}`;
      return diff < 0 ? `${label} ago` : `in ${label}`;
    }
  }
  return 'just now';
}

/**
 * Converts between Unix epoch and human-readable time. Numeric input is treated as an epoch
 * (auto-detecting seconds vs milliseconds); anything else is parsed as a date string and
 * converted back to epoch. Shows Local, UTC, and IST so the common "what time is this" works.
 */
export const unixTime: TransformTool = {
  id: 'unix-time',
  name: 'Unix Timestamp',
  category: 'time',
  description: 'Convert a Unix epoch (seconds or ms) to Local / UTC / IST / ISO — and back.',
  keywords: ['epoch', 'unix', 'timestamp', 'time', 'date', 'utc', 'ist', 'seconds', 'milliseconds', 'convert'],
  sample: '1700000000',
  run(input) {
    const t = input.trim();
    if (!t) {
      return { output: '' };
    }

    let date: Date;
    let detected = '';
    if (/^-?\d+$/.test(t)) {
      let ms = Number(t);
      // Heuristic: |value| < 1e11 is almost certainly seconds (year ~5138 in seconds).
      if (Math.abs(ms) < 1e11) {
        ms *= 1000;
        detected = '  (detected: seconds)';
      } else {
        detected = '  (detected: milliseconds)';
      }
      date = new Date(ms);
    } else {
      date = new Date(t);
    }

    if (Number.isNaN(date.getTime())) {
      return { output: '', error: 'Enter a Unix timestamp (seconds or ms) or a recognizable date.' };
    }

    const lines = [
      `${pad('Local')}: ${fmt(date, LOCAL_TZ)}`,
      `${pad('UTC')}: ${fmt(date, 'UTC')}`,
      `${pad('IST')}: ${fmt(date, 'Asia/Kolkata')}`,
      `${pad('ISO 8601')}: ${date.toISOString()}`,
      `${pad('Relative')}: ${relative(date.getTime())}`,
      '',
      `${pad('Unix (s)')}: ${Math.floor(date.getTime() / 1000)}${detected}`,
      `${pad('Unix (ms)')}: ${date.getTime()}`,
    ];
    return { output: lines.join('\n'), meta: { epochMs: date.getTime() } };
  },
};
