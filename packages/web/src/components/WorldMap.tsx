import { subsolarPoint } from '@bytesmith/core';

export interface MapPin {
  lat: number;
  lng: number;
  label: string;
  sublabel: string;
  color: string;
  day: boolean;
}

interface Props {
  instantMs: number;
  pins: MapPin[];
}

const W = 360;
const H = 180;
const xOf = (lng: number) => ((lng + 180) / 360) * W;
const yOf = (lat: number) => ((90 - lat) / 180) * H;

/**
 * Equirectangular world panel with a live day/night glow (centered on the subsolar point)
 * and glowing pins for each zone — so you can see at a glance where a zone sits east-to-west
 * and whether it's currently day or night there.
 */
export function WorldMap({ instantMs, pins }: Props) {
  const sub = subsolarPoint(new Date(instantMs));
  const sunX = xOf(sub.lng);
  const sunY = yOf(sub.lat);
  const moonX = xOf(sub.lng > 0 ? sub.lng - 180 : sub.lng + 180);

  const graticule: number[] = [];
  for (let lng = -150; lng <= 150; lng += 30) graticule.push(lng);
  const lats: number[] = [-60, -30, 0, 30, 60];

  return (
    <div className="worldmap">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="worldmap__svg">
        <defs>
          <radialGradient id="daylight" cx={sunX} cy={sunY} r="135" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(255,200,120,0.34)" />
            <stop offset="45%" stopColor="rgba(255,170,77,0.12)" />
            <stop offset="100%" stopColor="rgba(255,170,77,0)" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width={W} height={H} fill="#0a1018" />
        <rect x="0" y="0" width={W} height={H} fill="url(#daylight)" />
        {/* graticule */}
        {graticule.map((lng) => (
          <line key={`v${lng}`} x1={xOf(lng)} y1="0" x2={xOf(lng)} y2={H} stroke="rgba(120,140,180,0.10)" strokeWidth="0.4" />
        ))}
        {lats.map((lat) => (
          <line key={`h${lat}`} x1="0" y1={yOf(lat)} x2={W} y2={yOf(lat)} stroke={lat === 0 ? 'rgba(120,140,180,0.22)' : 'rgba(120,140,180,0.10)'} strokeWidth="0.4" />
        ))}
        {/* connecting arc between the first two pins */}
        {pins.length >= 2 && (
          <path
            d={`M ${xOf(pins[0].lng)} ${yOf(pins[0].lat)} Q ${(xOf(pins[0].lng) + xOf(pins[1].lng)) / 2} ${Math.min(yOf(pins[0].lat), yOf(pins[1].lat)) - 22} ${xOf(pins[1].lng)} ${yOf(pins[1].lat)}`}
            fill="none"
            stroke="rgba(255,174,77,0.5)"
            strokeWidth="0.7"
            strokeDasharray="2 2"
          />
        )}
        {/* sun + moon markers */}
        <circle cx={sunX} cy={sunY} r="3" fill="#ffd27a">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx={moonX} cy={yOf(-sub.lat)} r="2" fill="rgba(200,210,230,0.5)" />
      </svg>

      {pins.map((p, i) => (
        <div
          key={i}
          className="wm-pin"
          style={{ left: `${(xOf(p.lng) / W) * 100}%`, top: `${(yOf(p.lat) / H) * 100}%`, ['--pin' as string]: p.color }}
        >
          <span className="wm-pin__dot" />
          <span className="wm-pin__label">
            {p.day ? '☀' : '🌙'} {p.label}
            <b>{p.sublabel}</b>
          </span>
        </div>
      ))}
    </div>
  );
}
