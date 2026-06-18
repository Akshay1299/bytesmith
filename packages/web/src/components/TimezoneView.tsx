import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, CalendarClock, Clock, Copy } from 'lucide-react';
import {
  listTimeZones,
  getOffsetMinutes,
  offsetLabel,
  formatInZone,
  zonedWallToInstant,
  diffLabel,
  zoneApproxLatLng,
  sunAltitudeSin,
  subsolarPoint,
} from '@bytesmith/core';
import type { MapPin } from './WorldMap';
import { useToast } from './toast';

const Globe3D = lazy(() => import('./Globe3D'));

const RAW_ZONES = listTimeZones();
const HAS = new Set(RAW_ZONES);
// This environment may expose IST as either Kolkata or the older Calcutta alias.
const IST_ZONE = HAS.has('Asia/Kolkata') ? 'Asia/Kolkata' : 'Asia/Calcutta';

const ABBR: Record<string, string> = {
  UTC: 'UTC', 'Asia/Kolkata': 'IST', 'Asia/Calcutta': 'IST', 'America/New_York': 'ET',
  'America/Los_Angeles': 'PT', 'America/Chicago': 'CT', 'Europe/London': 'GMT/BST',
  'Europe/Paris': 'CET', 'Asia/Dubai': 'GST', 'Asia/Singapore': 'SGT', 'Asia/Tokyo': 'JST',
  'Asia/Shanghai': 'CST', 'Australia/Sydney': 'AET', 'Pacific/Auckland': 'NZT',
};
const PRIORITY = ['UTC', IST_ZONE, 'America/New_York', 'America/Los_Angeles', 'Europe/London',
  'Europe/Paris', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney']
  .filter((z) => z === 'UTC' || HAS.has(z));
const ZONES = [...PRIORITY, ...RAW_ZONES.filter((z) => !PRIORITY.includes(z))];

const cityLabel = (zone: string) => zone.split('/').pop()!.replace(/_/g, ' ');
const zoneLabel = (zone: string) => (ABBR[zone] ? `${zone.replace(/_/g, ' ')} · ${ABBR[zone]}` : zone.replace(/_/g, ' '));

/** Wall-clock parts of an instant in a zone, as an object. */
function wallParts(instant: number, zone: string): Record<string, string> {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(instant));
  const m: Record<string, string> = {};
  for (const p of parts) m[p.type] = p.value;
  return m;
}

/** "2026-06-18 15:50:16" — the free-form text representation. */
function wallText(instant: number, zone: string): string {
  const m = wallParts(instant, zone);
  return `${m.year}-${m.month}-${m.day} ${m.hour}:${m.minute}:${m.second}`;
}

/** "2026-06-18T15:50" — the value the native datetime-local input expects. */
function wallCalendar(instant: number, zone: string): string {
  const m = wallParts(instant, zone);
  return `${m.year}-${m.month}-${m.day}T${m.hour}:${m.minute}`;
}

/** Parses "YYYY-MM-DD[ T]HH:mm[:ss]" → instant in the given zone, or null. */
function parseWall(text: string, zone: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(text.trim());
  if (!m) return null;
  return zonedWallToInstant(+m[1], +m[2], +m[3], +m[4], +m[5], zone, +(m[6] ?? 0));
}

function ZonePicker({ value, onChange }: { value: string; onChange: (z: string) => void }) {
  return (
    <select className="tz-select" value={value} onChange={(e) => onChange(e.target.value)}>
      {ZONES.map((z) => (
        <option key={z} value={z}>{zoneLabel(z)}</option>
      ))}
    </select>
  );
}

export function TimezoneView() {
  const notify = useToast();
  const [fromZone, setFromZone] = useState(IST_ZONE); // IST by default
  const [toZone, setToZone] = useState('UTC');
  const [instant, setInstant] = useState(() => Date.now());
  const [live, setLive] = useState(true);
  const [text, setText] = useState(() => wallText(Date.now(), IST_ZONE));
  const [bad, setBad] = useState(false);

  // Tick while live, keeping the text field in step.
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => {
      const now = Date.now();
      setInstant(now);
      setText(wallText(now, fromZone));
    }, 1000);
    return () => clearInterval(id);
  }, [live, fromZone]);

  const setMoment = (ms: number) => {
    setLive(false);
    setInstant(ms);
    setText(wallText(ms, fromZone));
    setBad(false);
  };

  const onText = (val: string) => {
    setLive(false);
    setText(val);
    const parsed = parseWall(val, fromZone);
    if (parsed === null) {
      setBad(val.trim().length > 0);
    } else {
      setBad(false);
      setInstant(parsed);
    }
  };

  const changeFrom = (z: string) => {
    setFromZone(z);
    setText(wallText(instant, z));
    setBad(false);
  };

  const date = new Date(instant);
  const fromOff = getOffsetMinutes(fromZone, date);
  const toOff = getOffsetMinutes(toZone, date);
  const fromFmt = formatInZone(date, fromZone);
  const toFmt = formatInZone(date, toZone);

  const pins: MapPin[] = useMemo(() => {
    const sub = subsolarPoint(date);
    return [
      { zone: fromZone, color: '#ffae4d' },
      { zone: toZone, color: '#5bd6ff' },
    ].map(({ zone, color }) => {
      const [lat, lng] = zoneApproxLatLng(zone, date);
      return { lat, lng, color, label: cityLabel(zone), sublabel: formatInZone(date, zone).time, day: sunAltitudeSin(lat, lng, sub) > 0 };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromZone, toZone, instant]);

  const swap = () => {
    const f = fromZone;
    setFromZone(toZone);
    setToZone(f);
    setText(wallText(instant, toZone));
  };

  const copy = async () => {
    await navigator.clipboard.writeText(
      `${cityLabel(fromZone)} ${fromFmt.time} (${offsetLabel(fromOff)})  →  ${cityLabel(toZone)} ${toFmt.time} (${offsetLabel(toOff)})`,
    );
    notify('Copied conversion');
  };

  return (
    <section className="workspace">
      <div className="ws-head">
        <div>
          <div className="ws-head__title">Timezone Converter</div>
          <div className="ws-head__desc">Type a time (or pick one) in any zone and read it in another. IST ⇄ UTC by default.</div>
        </div>
        <div className="ws-head__right">
          <button className="ghost-btn" onClick={() => { setLive(true); setMoment(Date.now()); setLive(true); }}>
            <Clock size={14} /> Now
          </button>
          <button className="ghost-btn" onClick={copy}><Copy size={14} /> Copy</button>
        </div>
      </div>

      <div className="tz-convert">
        <div className="tz-card">
          <div className="tz-card__label">From {live && <span className="tz-live">live</span>}</div>
          <ZonePicker value={fromZone} onChange={changeFrom} />
          <input
            className={`tz-text${bad ? ' bad' : ''}`}
            value={text}
            spellCheck={false}
            placeholder="2026-06-18 15:50:16"
            onChange={(e) => onText(e.target.value)}
          />
          <label className="tz-calendar">
            <CalendarClock size={15} />
            <input
              className="tz-time-input"
              type="datetime-local"
              value={wallCalendar(instant, fromZone)}
              onChange={(e) => {
                const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(e.target.value);
                if (m) setMoment(zonedWallToInstant(+m[1], +m[2], +m[3], +m[4], +m[5], fromZone));
              }}
            />
          </label>
          <div className="tz-card__meta">{offsetLabel(fromOff)} · {fromFmt.date}</div>
        </div>

        <button className="tz-swap" onClick={swap} title="Swap"><ArrowLeftRight size={18} /></button>

        <div className="tz-card tz-card--out">
          <div className="tz-card__label">To</div>
          <ZonePicker value={toZone} onChange={setToZone} />
          <div className="tz-bigtime">{toFmt.time}</div>
          <div className="tz-card__meta">{offsetLabel(toOff)} · {toFmt.date}</div>
        </div>
      </div>

      <div className="tz-diff">
        <b>{cityLabel(toZone)}</b> is <b>{diffLabel(fromOff, toOff)}</b> <b>{cityLabel(fromZone)}</b>
      </div>

      <Suspense fallback={<div className="globe3d globe3d--loading">Summoning the globe…</div>}>
        <Globe3D pins={pins.map((p) => ({ lat: p.lat, lng: p.lng, color: p.color, label: `${p.label} · ${p.sublabel}` }))} />
      </Suspense>
    </section>
  );
}
