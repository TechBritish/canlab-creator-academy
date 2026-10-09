import { useEffect, useState } from 'react';
import { CLIPS } from '../../data/mockData';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const PLATFORMS = ['TikTok', 'Instagram', 'YouTube Shorts', 'X'];

type SubRow = {
  id: string;
  clip_used: string;
  platform: string;
  status: string;
  status_cls: string;
  views: string;
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
  const toast = useToast();

  const clipOptions = [...CLIPS.map((c) => c.h.replace(/"/g, '')), 'Own footage'];

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('submissions')
      .select('id, clip_used, platform, status, status_cls, views, created_at')
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
      toast('Add #ad and the research-use line first');
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
                    <td><span className={`st ${s.status_cls}`}>{s.status}</span></td>
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
            Post includes #ad and "for research use only".
          </label>
          <button className="btn solid" type="submit">Submit for review</button>
        </form>
      </div>
    </section>
  );
}
