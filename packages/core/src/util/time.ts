// ── Time-zone + epoch helpers (pure, framework-agnostic) ───────────────────────

const FALLBACK_ZONES = [
  'UTC', 'America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York',
  'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'Africa/Cairo', 'Africa/Johannesburg', 'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata',
  'Asia/Dhaka', 'Asia/Bangkok', 'Asia/Singapore', 'Asia/Hong_Kong', 'Asia/Shanghai',
  'Asia/Tokyo', 'Asia/Seoul', 'Australia/Sydney', 'Pacific/Auckland',
];

/** Approximate [lat, lng] for well-known zones; others fall back to offset→longitude. */
const COORDS: Record<string, [number, number]> = {
  UTC: [0, 0],
  'America/Los_Angeles': [34.05, -118.24], 'America/Denver': [39.74, -104.99],
  'America/Chicago': [41.88, -87.63], 'America/New_York': [40.71, -74.0],
  'America/Toronto': [43.65, -79.38], 'America/Mexico_City': [19.43, -99.13],
  'America/Bogota': [4.71, -74.07], 'America/Sao_Paulo': [-23.55, -46.63],
  'America/Argentina/Buenos_Aires': [-34.6, -58.38],
  'Europe/London': [51.51, -0.13], 'Europe/Paris': [48.86, 2.35], 'Europe/Berlin': [52.52, 13.4],
  'Europe/Madrid': [40.42, -3.7], 'Europe/Rome': [41.9, 12.5], 'Europe/Istanbul': [41.01, 28.98],
  'Europe/Moscow': [55.76, 37.62],
  'Africa/Cairo': [30.04, 31.24], 'Africa/Lagos': [6.52, 3.38], 'Africa/Johannesburg': [-26.2, 28.05],
  'Asia/Dubai': [25.2, 55.27], 'Asia/Karachi': [24.86, 67.0], 'Asia/Kolkata': [22.57, 88.36],
  'Asia/Dhaka': [23.81, 90.41], 'Asia/Bangkok': [13.76, 100.5], 'Asia/Jakarta': [-6.21, 106.85],
  'Asia/Singapore': [1.35, 103.82], 'Asia/Hong_Kong': [22.32, 114.17], 'Asia/Shanghai': [31.23, 121.47],
  'Asia/Tokyo': [35.68, 139.69], 'Asia/Seoul': [37.57, 126.98],
  'Australia/Sydney': [-33.87, 151.21], 'Australia/Perth': [-31.95, 115.86],
  'Pacific/Auckland': [-36.85, 174.76], 'Pacific/Honolulu': [21.31, -157.86],
};

export function listTimeZones(): string[] {
  try {
    const fn = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf;
    const zones = fn?.('timeZone');
    if (Array.isArray(zones) && zones.length) return zones;
  } catch {
    /* fall through */
  }
  return FALLBACK_ZONES;
}

/** Minutes east of UTC for a zone at a given instant (handles DST). */
export function getOffsetMinutes(timeZone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const map: Record<string, number> = {};
  for (const part of dtf.formatToParts(date)) {
    if (part.type !== 'literal') map[part.type] = Number(part.value);
  }
  const asUtc = Date.UTC(map.year, map.month - 1, map.day, map.hour, map.minute, map.second);
  return Math.round((asUtc - date.getTime()) / 60000) || 0; // `|| 0` avoids -0
}

export function offsetLabel(minutes: number): string {
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  const h = String(Math.floor(abs / 60)).padStart(2, '0');
  const m = String(abs % 60).padStart(2, '0');
  return `UTC${sign}${h}:${m}`;
}

export function formatInZone(date: Date, timeZone: string): { time: string; date: string } {
  const time = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
  const day = new Intl.DateTimeFormat('en-GB', { timeZone, weekday: 'short', day: '2-digit', month: 'short' }).format(date);
  return { time, date: day };
}

/** Interprets wall-clock fields as being in `timeZone` and returns the UTC instant (ms). */
export function zonedWallToInstant(y: number, mo: number, d: number, h: number, mi: number, timeZone: string): number {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const offset = getOffsetMinutes(timeZone, new Date(guess));
  return guess - offset * 60000;
}

/** Human label for the gap, fitting the sentence "<To> is <label> <From>". */
export function diffLabel(fromMinutes: number, toMinutes: number): string {
  const delta = toMinutes - fromMinutes;
  if (delta === 0) return 'the same time as';
  const abs = Math.abs(delta);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const parts = [h ? `${h}h` : '', m ? `${m}m` : ''].filter(Boolean).join(' ');
  return `${parts} ${delta > 0 ? 'ahead of' : 'behind'}`;
}

// ── Sun position (for the world map's day/night) ───────────────────────────────

const RAD = Math.PI / 180;

function dayOfYearUtc(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return Math.floor((date.getTime() - start) / 86400000);
}

/** Subsolar point: where the sun is directly overhead. */
export function subsolarPoint(date: Date): { lat: number; lng: number } {
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  let lng = 180 - utcHours * 15;
  if (lng > 180) lng -= 360;
  if (lng < -180) lng += 360;
  const decl = -23.44 * Math.cos(RAD * (360 / 365) * (dayOfYearUtc(date) + 10));
  return { lat: decl, lng };
}

/** sin(sun altitude) at a point; > 0 means daytime. */
export function sunAltitudeSin(lat: number, lng: number, sub: { lat: number; lng: number }): number {
  const h = (lng - sub.lng) * RAD;
  return Math.sin(lat * RAD) * Math.sin(sub.lat * RAD) + Math.cos(lat * RAD) * Math.cos(sub.lat * RAD) * Math.cos(h);
}

function regionLatitude(zone: string): number {
  const region = zone.split('/')[0];
  switch (region) {
    case 'Europe': return 50;
    case 'Asia': return 30;
    case 'America': return 25;
    case 'Africa': return 2;
    case 'Australia': return -28;
    case 'Pacific': return -10;
    case 'Atlantic': return 35;
    case 'Indian': return -10;
    case 'Antarctica': return -75;
    default: return 15;
  }
}

/** Best-effort [lat, lng] for any zone: curated table, else offset→longitude + region latitude. */
export function zoneApproxLatLng(zone: string, date: Date): [number, number] {
  const known = COORDS[zone];
  if (known) return known;
  const lng = Math.max(-179, Math.min(179, (getOffsetMinutes(zone, date) / 60) * 15));
  return [regionLatitude(zone), lng];
}

// ── Epoch / timestamp ──────────────────────────────────────────────────────────

export interface EpochField {
  label: string;
  value: string;
}

export interface EpochInfo {
  error?: string;
  hero?: string;
  instantMs?: number;
  detected?: string;
  fields: EpochField[];
}

function relative(targetMs: number, nowMs: number): string {
  const diff = targetMs - nowMs;
  const abs = Math.abs(diff);
  const units: [number, string][] = [
    [31536000000, 'year'], [2592000000, 'month'], [86400000, 'day'],
    [3600000, 'hour'], [60000, 'minute'], [1000, 'second'],
  ];
  for (const [ms, name] of units) {
    if (abs >= ms) {
      const n = Math.round(abs / ms);
      return `${n} ${name}${n === 1 ? '' : 's'} ${diff < 0 ? 'ago' : 'from now'}`;
    }
  }
  return 'just now';
}

/** Parses an epoch (auto s/ms) or a date string into display fields. `nowMs` keeps it pure. */
export function epochInfo(input: string, nowMs: number): EpochInfo {
  const t = input.trim();
  if (!t) return { fields: [] };

  let date: Date;
  let detected: string | undefined;
  if (/^-?\d+$/.test(t)) {
    let ms = Number(t);
    if (Math.abs(ms) < 1e11) {
      ms *= 1000;
      detected = 'seconds';
    } else {
      detected = 'milliseconds';
    }
    date = new Date(ms);
  } else {
    date = new Date(t);
  }

  if (Number.isNaN(date.getTime())) {
    return { fields: [], error: 'Enter a Unix timestamp (seconds or ms) or a recognizable date.' };
  }

  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const hero = new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeStyle: 'medium', timeZone: localTz }).format(date);
  const fmt = (tz: string) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'long', timeZone: tz }).format(date);

  return {
    hero,
    instantMs: date.getTime(),
    detected,
    fields: [
      { label: 'Local', value: fmt(localTz) },
      { label: 'UTC', value: fmt('UTC') },
      { label: 'IST', value: fmt('Asia/Kolkata') },
      { label: 'ISO 8601', value: date.toISOString() },
      { label: 'Relative', value: relative(date.getTime(), nowMs) },
      { label: 'Unix (s)', value: String(Math.floor(date.getTime() / 1000)) },
      { label: 'Unix (ms)', value: String(date.getTime()) },
    ],
  };
}
