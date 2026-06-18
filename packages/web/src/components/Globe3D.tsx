import { useEffect, useRef } from 'react';
import Globe from 'globe.gl';

export interface GlobePin {
  lat: number;
  lng: number;
  label: string;
  color: string;
}

interface Props {
  pins: GlobePin[];
}

const TEXTURE = `${import.meta.env.BASE_URL}textures/earth-night.jpg`;
const SKY = `${import.meta.env.BASE_URL}textures/night-sky.png`;

/**
 * Interactive 3D Earth (globe.gl / three.js): the city-lights night texture, an atmosphere
 * glow, auto-rotation, and the From/To zones as glowing points joined by an animated arc.
 * Lazy-loaded so three.js never touches the main bundle.
 */
export default function Globe3D({ pins }: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<InstanceType<typeof Globe> | null>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const g = new Globe(el);
    g.globeImageUrl(TEXTURE)
      .backgroundImageUrl(SKY)
      .backgroundColor('rgba(0,0,0,0)')
      .showAtmosphere(true)
      .atmosphereColor('#6aa6ff')
      .atmosphereAltitude(0.16)
      .pointColor('color')
      .pointAltitude(0.02)
      .pointRadius(0.5)
      .labelText('label')
      .labelColor('color')
      .labelSize(1.25)
      .labelDotRadius(0.45)
      .labelAltitude(0.02)
      .arcColor('color')
      .arcStroke(0.6)
      .arcAltitudeAutoScale(0.5)
      .arcDashLength(0.5)
      .arcDashGap(0.25)
      .arcDashAnimateTime(2600);

    g.controls().autoRotate = true;
    g.controls().autoRotateSpeed = 0.55;
    g.controls().enableZoom = false;
    globeRef.current = g;

    const resize = () => {
      g.width(el.clientWidth);
      g.height(el.clientHeight);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    return () => {
      ro.disconnect();
      el.innerHTML = '';
      globeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    g.pointsData(pins).labelsData(pins);
    g.arcsData(
      pins.length >= 2
        ? [{ startLat: pins[0].lat, startLng: pins[0].lng, endLat: pins[1].lat, endLng: pins[1].lng, color: [pins[0].color, pins[1].color] }]
        : [],
    );
  }, [pins]);

  return <div ref={elRef} className="globe3d" />;
}
