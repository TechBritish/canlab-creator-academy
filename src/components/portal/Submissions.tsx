import { useEffect, useState } from 'react';
import { CLIPS } from '../../data/mockData';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const PLATFORMS = ['TikTok', 'Instagram', 'YouTube Shorts', 'X', 'LinkedIn', 'Facebook'];

type SubRow = {
  id: string;
  clip_used: string;
  platform: string;
  post_url: string;
  status: string;
  status_cls: string;
  views: string;
  admin_note: string | null;
  created_at: string;
};

export default function Submissions() {
  const { user } = useAuth();
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [clip, setClip] = useState(CLIPS[0].h.replace(/"/g, ''));
  const [ok, setOk] = useState(false);
  const [resubmitId, setResubmitId] = useState<string | null>(null);
  const [resubmitUrl, setResubmitUrl] = useState('');
  const [resubmitNote, setResubmitNote] = useState('');
  const toast = useToast();

  const clipOptions = [...CLIPS.map((c) => c.h.replace(/"/g, '')), 'Own footage'];

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('submissions')
      .select('id, clip_used, platform, post_url, status, status_cls, views, admin_note, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setSubs((data as SubRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^https?:\/\/\S+\.\S+/.test(url.trim())) {
      toast('Paste the full post link first');
      return;
    }
    if (!ok) {
      toast('Add #ad or the affiliate disclosure first');
      return;
    }
    if (!user) return;
    const { error } = await supabase.from('submissions').insert({
      user_id: user.id,
      post_url: url.trim(),
      platform,
      clip_used: clip,
      status: 'In review',
      status_cls: 'warn',
      views: '—',
    });
    if (error) {
      toast('Could not submit. Try again.');
      return;
    }
    toast('Submitted for review');
    setUrl('');
    setOk(false);
    load();
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { day: '2-digit', month: 'short' });

  const startResubmit = (s: SubRow) => {
    setResubmitId(s.id);
    setResubmitUrl(s.post_url);
    setResubmitNote('');
  };

  const submitResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resubmitId) return;
    if (!/^https?:\/\/\S+\.\S+/.test(resubmitUrl.trim())) {
      toast('Paste the full post link first');
      return;
    }
    const { error } = await supabase
      .from('submissions')
      .update({
        post_url: resubmitUrl.trim(),
        status: 'In review',
        status_cls: 'warn',
        admin_note: null,
        resubmit_note: resubmitNote.trim() || null,
      })
      .eq('id', resubmitId);
    if (error) {
      toast('Could not resubmit. Try again.');
      return;
    }
    toast('Resubmitted for review');
    setResubmitId(null);
    load();
  };

  return (
    <section data-panel="subs">
      <div className="ph">
        <div>
          <span className="label">Content review</span>
          <h2 style={{ marginTop: 8 }}>Submissions</h2>
        </div>
      </div>
      <div className="grid g2">
        <div className="card tbl">
          <table className="data">
            <thead>
              <tr><th>Post</th><th>Platform</th><th>Date</th><th>Status</th><th className="r">Views</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="muted">Loading…</td></tr>
              ) : subs.length === 0 ? (
                <tr><td colSpan={5} className="muted">No submissions yet.</td></tr>
              ) : (
                subs.map((s) => (
                  <tr key={s.id}>
                    <td>{s.clip_used}</td>
                    <td>{s.platform}</td>
                    <td className="mono muted">{fmtDate(s.created_at)}</td>
                    <td>
                      <span className={`st ${s.status_cls}`}>{s.status}</span>
                      {s.status === 'Needs changes' && (
                        <div style={{ marginTop: 6 }}>
                          {s.admin_note && (
                            <div className="muted" style={{ fontSize: 12 }}>{s.admin_note}</div>
                          )}
                          <button type="button" className="btn sm" style={{ marginTop: 4 }} onClick={() => startResubmit(s)}>
                            Resubmit
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="r">{s.views}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <form className="card" style={{ display: 'grid', gap: 16 }} onSubmit={submit}>
          <h3>Submit a post</h3>
          <div className="field">
            <label htmlFor="s-url">Post link</label>
            <input
              id="s-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://tiktok.com/@you/video/..."
            />
          </div>
          <div className="field">
            <label htmlFor="s-plat">Platform</label>
            <select id="s-plat" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="s-clip">Clip used</label>
            <select id="s-clip" value={clip} onChange={(e) => setClip(e.target.value)}>
              {clipOptions.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <label className="check">
            <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />
            Post includes #ad or "affiliate link".
          </label>
          <button className="btn solid" type="submit">Submit for review</button>
        </form>
      </div>
      {resubmitId && (
        <form className="card" style={{ display: 'grid', gap: 16, marginTop: 16 }} onSubmit={submitResubmit}>
          <h3>Resubmit post</h3>
          <div className="field">
            <label htmlFor="r-url">Updated post link</label>
            <input
              id="r-url"
              value={resubmitUrl}
              onChange={(e) => setResubmitUrl(e.target.value)}
              placeholder="https://tiktok.com/@you/video/..."
            />
          </div>
          <div className="field">
            <label htmlFor="r-note">What changed (optional)</label>
            <input
              id="r-note"
              value={resubmitNote}
              onChange={(e) => setResubmitNote(e.target.value)}
              placeholder="e.g. removed the claim the admin flagged"
            />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn solid" type="submit">Resubmit for review</button>
            <button className="btn" type="button" onClick={() => setResubmitId(null)}>Cancel</button>
          </div>
        </form>
      )}
    </section>
  );
}
