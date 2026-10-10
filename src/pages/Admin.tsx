import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth, type Profile } from '../context/AuthContext';

type SubmissionRow = {
  id: string;
  user_id: string;
  clip_used: string;
  platform: string;
  post_url: string;
  status: string;
  status_cls: string;
  views: string;
  created_at: string;
  profiles?: { full_name: string } | null;
};

export default function Admin() {
  const { signOut } = useAuth();
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState<SubmissionRow[]>([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [viewsDraft, setViewsDraft] = useState<Record<string, string>>({});
  const [orderCreatorId, setOrderCreatorId] = useState('');
  const [orderAmount, setOrderAmount] = useState('');
  const [orderSaving, setOrderSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'creator')
      .order('created_at', { ascending: false });
    setRows((data as Profile[]) ?? []);
    setLoading(false);
  };

  const loadSubs = async () => {
    setSubsLoading(true);
    const { data } = await supabase
      .from('submissions')
      .select('id, user_id, clip_used, platform, post_url, status, status_cls, views, created_at, profiles(full_name)')
      .order('created_at', { ascending: false });
    setSubs((data as unknown as SubmissionRow[]) ?? []);
    setSubsLoading(false);
  };

  useEffect(() => {
    load();
    loadSubs();
  }, []);

  const setStatus = async (id: string, status: 'approved' | 'rejected') => {
    await supabase.from('profiles').update({ status }).eq('id', id);
    load();
  };

  const setSubStatus = async (id: string, status: 'Approved' | 'Needs changes', cls: 'good' | 'bad') => {
    const views = viewsDraft[id]?.trim();
    await supabase
      .from('submissions')
      .update({ status, status_cls: cls, ...(views ? { views } : {}) })
      .eq('id', id);
    loadSubs();
  };

  const logOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(orderAmount);
    if (!orderCreatorId || !amount) return;
    setOrderSaving(true);
    // Manual fallback only — orders placed through canlabintl.com are
    // synced automatically by the WooCommerce webhook (see
    // supabase/functions/woo-order-webhook). Use this for phone/offline
    // sales that never hit the webhook.
    await supabase.from('orders').insert({ user_id: orderCreatorId, amount, status: 'completed' });
    setOrderSaving(false);
    setOrderAmount('');
  };

  return (
    <section className="s">
      <div className="wrap" style={{ paddingBlock: 60 }}>
        <div className="ph">
          <div>
            <span className="label">Admin</span>
            <h2 style={{ marginTop: 8 }}>Creator applications</h2>
          </div>
          <button className="btn sm" onClick={signOut}>
            Log out
          </button>
        </div>

        {loading ? (
          <p className="muted" style={{ marginTop: 24 }}>Loading…</p>
        ) : rows.length === 0 ? (
          <p className="muted" style={{ marginTop: 24 }}>No applications yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: 14, marginTop: 24 }}>
            {rows.map((r) => (
              <div
                key={r.id}
                className="tierb"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}
              >
                <div>
                  <b>{r.full_name}</b> <span className="muted">· {r.email}</span>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {r.handle} · {r.platform} · {r.followers} followers
                  </div>
                  <div className="label" style={{ marginTop: 6 }}>{r.status}</div>
                </div>
                {r.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
                    <button className="btn sm solid" onClick={() => setStatus(r.id, 'approved')}>
                      Approve
                    </button>
                    <button className="btn sm" onClick={() => setStatus(r.id, 'rejected')}>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="ph" style={{ marginTop: 48 }}>
          <div>
            <span className="label">Review queue</span>
            <h2 style={{ marginTop: 8 }}>Submissions</h2>
          </div>
        </div>
        {subsLoading ? (
          <p className="muted" style={{ marginTop: 24 }}>Loading…</p>
        ) : subs.length === 0 ? (
          <p className="muted" style={{ marginTop: 24 }}>No submissions yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: 14, marginTop: 24 }}>
            {subs.map((s) => (
              <div
                key={s.id}
                className="tierb"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}
              >
                <div>
                  <b>{s.profiles?.full_name ?? 'Creator'}</b> <span className="muted">· {s.platform}</span>
                  <div className="muted" style={{ fontSize: 13 }}>
                    {s.clip_used} ·{' '}
                    <a href={s.post_url} target="_blank" rel="noreferrer">
                      view post
                    </a>
                  </div>
                  <div className="label" style={{ marginTop: 6 }}>{s.status}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 'none' }}>
                  <input
                    placeholder="Views"
                    style={{ width: 90 }}
                    value={viewsDraft[s.id] ?? ''}
                    onChange={(e) => setViewsDraft((d) => ({ ...d, [s.id]: e.target.value }))}
                  />
                  <button className="btn sm solid" onClick={() => setSubStatus(s.id, 'Approved', 'good')}>
                    Approve
                  </button>
                  <button className="btn sm" onClick={() => setSubStatus(s.id, 'Needs changes', 'bad')}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="ph" style={{ marginTop: 48 }}>
          <div>
            <span className="label">Rewards</span>
            <h2 style={{ marginTop: 8 }}>Log an order</h2>
          </div>
        </div>
        <form className="glass" onSubmit={logOrder} style={{ marginTop: 16, maxWidth: 480 }}>
          <div className="field">
            <label htmlFor="o-creator">Creator</label>
            <select id="o-creator" value={orderCreatorId} onChange={(e) => setOrderCreatorId(e.target.value)} required>
              <option value="" disabled>Select creator</option>
              {rows.filter((r) => r.status === 'approved').map((r) => (
                <option key={r.id} value={r.id}>{r.full_name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="o-amount">Sale amount ($)</label>
            <input id="o-amount" type="number" min="0" step="0.01" value={orderAmount} onChange={(e) => setOrderAmount(e.target.value)} required />
          </div>
          <button className="btn solid" type="submit" disabled={orderSaving}>
            {orderSaving ? 'Saving…' : 'Log order'}
          </button>
        </form>
      </div>
    </section>
  );
}
