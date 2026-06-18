import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, Clock, Copy } from 'lucide-react';
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
import { WorldMap, type MapPin } from './WorldMap';
import { useToast } from './toast';

const RAW_ZONES = listTimeZones();
const ZONES = RAW_ZONES.includes('UTC') ? RAW_ZONES : ['UTC', ...RAW_ZONES];
const LOCAL = Intl.DateTimeFormat().resolvedOptions().timeZone;
const cityLabel = (zone: string) => zone.split('/').pop()!.replace(/_/g, ' ');

function wallValue(instant: number, zone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(instant));
  const m: Record<string, string> = {};
  for (const p of parts) m[p.type] = p.value;
  return `${m.year}-${m.month}-${m.day}T${m.hour}:${m.minute}`;
}

function ZonePicker({ value, onChange }: { value: string; onChange: (z: string) => void }) {
  return (
    <select className="tz-select" value={value} onChange={(e) => onChange(e.target.value)}>
      {ZONES.map((z) => (
        <option key={z} value={z}>{z.replace(/_/g, ' ')}</option>
      ))}
    </select>
  );
}

export function TimezoneView() {
  const notify = useToast();
  const [fromZone, setFromZone] = useState(LOCAL);
  const [toZone, setToZone] = useState(LOCAL === 'UTC' ? 'Asia/Kolkata' : 'UTC');
  const [instant, setInstant] = useState(() => Date.now());
  const [live, setLive] = useState(true);

  // Tick the clock while in "live" mode.
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setInstant(Date.now()), 1000);
    return () => clearInterval(id);
  }, [live]);

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
      return {
        lat, lng, color,
        label: cityLabel(zone),
        sublabel: formatInZone(date, zone).time,
        day: sunAltitudeSin(lat, lng, sub) > 0,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromZone, toZone, instant]);

  const onWallChange = (val: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(val);
    if (!m) return;
    setLive(false);
    setInstant(zonedWallToInstant(+m[1], +m[2], +m[3], +m[4], +m[5], fromZone));
  };

  const swap = () => {
    setFromZone(toZone);
    setToZone(fromZone);
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
          <div className="ws-head__desc">Convert a time between any two zones — drag the date or hit Now.</div>
        </div>
        <div className="ws-head__right">
          <button className="ghost-btn" onClick={() => { setLive(true); setInstant(Date.now()); }}>
            <Clock size={14} /> Now
          </button>
          <button className="ghost-btn" onClick={copy}><Copy size={14} /> Copy</button>
        </div>
      </div>

      <div className="tz-convert">
        <div className="tz-card">
          <div className="tz-card__label">From {live && <span className="tz-live">live</span>}</div>
          <ZonePicker value={fromZone} onChange={setFromZone} />
          <input className="tz-time-input" type="datetime-local" value={wallValue(instant, fromZone)} onChange={(e) => onWallChange(e.target.value)} />
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

      <WorldMap instantMs={instant} pins={pins} />
    </section>
  );
}
