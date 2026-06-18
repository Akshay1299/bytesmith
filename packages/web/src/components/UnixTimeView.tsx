import { useEffect, useState } from 'react';
import { Clock, Copy } from 'lucide-react';
import { epochInfo } from '@bytesmith/core';
import { useToast } from './toast';

export function UnixTimeView() {
  const notify = useToast();
  const [value, setValue] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [now, setNow] = useState(() => Date.now());

  // Keep the relative field ("3 minutes ago") ticking.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const info = epochInfo(value, now);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    notify('Copied');
  };

  return (
    <section className="workspace">
      <div className="ws-head">
        <div>
          <div className="ws-head__title">Unix Timestamp</div>
          <div className="ws-head__desc">Convert a Unix epoch (seconds or ms) to readable time — and back.</div>
        </div>
        <div className="ws-head__right">
          <button className="ghost-btn" onClick={() => setValue(String(Math.floor(Date.now() / 1000)))}>
            <Clock size={14} /> Now
          </button>
        </div>
      </div>

      <div className="ut-input-row">
        <input
          className="ut-input"
          value={value}
          spellCheck={false}
          placeholder="1700000000  ·  or a date like 2023-11-14T22:13:20Z"
          onChange={(e) => setValue(e.target.value)}
        />
        {info.detected && <span className="ut-badge">detected: {info.detected}</span>}
      </div>

      {info.error ? (
        <div className="error-banner" style={{ position: 'static', marginTop: 12 }}>{info.error}</div>
      ) : info.hero ? (
        <>
          <div className="ut-hero">{info.hero}</div>
          <div className="ut-grid">
            {info.fields.map((f) => (
              <button className="ut-card" key={f.label} onClick={() => copy(f.value)} title="Click to copy">
                <span className="ut-card__label">{f.label}</span>
                <span className="ut-card__value">{f.value}</span>
                <Copy size={13} className="ut-card__copy" />
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="pane__placeholder" style={{ position: 'static', marginTop: 40 }}>
          Enter a timestamp or date above
        </div>
      )}
    </section>
  );
}
