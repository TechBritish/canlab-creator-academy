import { useState } from 'react';
import { CLIPS, clipBg, type Clip } from '../../data/mockData';
import { useToast } from '../../context/ToastContext';
import Icon from '../Icon';

export default function ClipLibrary() {
  const [filt, setFilt] = useState('All');
  const [brief, setBrief] = useState<Clip | null>(null);
  const toast = useToast();
  const fm = ['All', ...Array.from(new Set(CLIPS.map((c) => c.f)))];
  const visible = CLIPS.filter((c) => filt === 'All' || c.f === filt);

  const copyCaption = (cap: string) => {
    navigator.clipboard?.writeText(cap).then(() => toast('Caption copied')).catch(() => toast('Caption selected'));
  };

  return (
    <section data-panel="clips">
      <div className="ph">
        <div>
          <span className="label">Clip farming</span>
          <h2 style={{ marginTop: 8 }}>Clip library</h2>
          <p className="muted" style={{ marginTop: 6 }}>Pre-approved footage and hooks. Add your voice and post.</p>
        </div>
        <div className="filters">
          {fm.map((f) => (
            <button key={f} aria-pressed={f === filt} onClick={() => setFilt(f)}>{f}</button>
          ))}
        </div>
      </div>

      <div className="clips">
        {visible.map((c) => (
          <div className="clip" key={c.h}>
            <div className="thumb" style={{ background: clipBg(c) }}>
              <video
                src={c.video}
                muted
                loop
                playsInline
                preload="metadata"
                onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
              />
              <span className="dur">{c.d}</span>
              <span className="hk">{c.h}</span>
            </div>
            <div className="info">
              <div className="tags">
                <span className="tag">{c.f}</span>
                <span className="tag">{c.p}</span>
              </div>
              <p className="clip-brief">{c.cap.split('\n')[0]}</p>
              <button className="btn sm" onClick={() => setBrief(c)}>Use this clip <Icon id="arrow" /></button>
            </div>
          </div>
        ))}
      </div>

      {brief && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setBrief(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <div
            className="card brief brief-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 420, width: '100%', maxHeight: '85vh', overflowY: 'auto', position: 'relative', padding: 20 }}
          >
            <button
              aria-label="Close"
              onClick={() => setBrief(null)}
              className="btn sm"
              style={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}
            >
              <Icon id="x" />
            </button>
            <div style={{ paddingRight: 40 }}>
              <span className="label">Brief</span>
              <h3 style={{ marginTop: 4, fontSize: 18, lineHeight: 1.25 }}>{brief.h}</h3>
            </div>
            <video src={brief.video} controls style={{ width: '100%', maxHeight: '38vh', objectFit: 'contain', background: '#000', borderRadius: 12, marginTop: 10, display: 'block' }} />
            <p className="muted" style={{ marginTop: 10, fontSize: 13.5 }}>
              {brief.f} · best on {brief.p}. Add your own voice in the first 2 seconds and keep the research-use line.
            </p>
            <div className="actions" style={{ marginTop: 10 }}>
              <a className="btn sm" href={brief.video} download>Download clip</a>
              <button className="btn sm solid" onClick={() => copyCaption(brief.cap)}>
                <Icon id="copy" strokeWidth={1.8} />Copy caption
              </button>
            </div>
            <pre style={{ marginTop: 10, fontSize: 12 }}>{brief.cap}</pre>
          </div>
        </div>
      )}
    </section>
  );
}
