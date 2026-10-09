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
              <span className="dur">{c.d}</span>
              <span className="hk">{c.h}</span>
            </div>
            <div className="info">
              <div className="tags">
                <span className="tag">{c.f}</span>
                <span className="tag">{c.p}</span>
              </div>
              <button className="btn sm" onClick={() => setBrief(c)}>Use this clip <Icon id="arrow" /></button>
            </div>
          </div>
        ))}
      </div>

      {brief && (
        <div className="card brief">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <span className="label">Brief</span>
              <h3 style={{ marginTop: 6, fontSize: 22 }}>{brief.h}</h3>
            </div>
            <div className="actions">
              <button className="btn sm" onClick={() => toast('Clip download starts here in the live build')}>Download clip</button>
              <button className="btn sm solid" onClick={() => copyCaption(brief.cap)}>
                <Icon id="copy" strokeWidth={1.8} />Copy caption
              </button>
            </div>
          </div>
          <p className="muted" style={{ marginTop: 12, fontSize: 14.5 }}>
            {brief.f} · best on {brief.p}. Add your own voice in the first 2 seconds and keep the research-use line.
          </p>
          <pre>{brief.cap}</pre>
        </div>
      )}
    </section>
  );
}
