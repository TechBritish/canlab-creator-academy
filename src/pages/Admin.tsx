import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth, type Profile } from '../context/AuthContext';
import { COUNTED_ORDER_STATUSES } from '../lib/orderStatus';
import Icon from '../components/Icon';
import { tierForSales } from '../lib/program';

type SubmissionRow = {
  id: string;
  user_id: string;
  clip_used: string;
  platform: string;
  post_url: string;
  status: string;
  status_cls: string;
  views: string;
  admin_note: string | null;
  resubmit_note: string | null;
  created_at: string;
  profiles?: { full_name: string } | null;
};

type OrderAgg = { user_id: string; amount: number; created_at: string };
type ClickAgg = { ref_code: string };

type AgreementRow = {
  id: number;
  user_id: string;
  agreement_version: string;
  legal_name: string;
  email: string;
  country_state: string;
  handles: string;
  follower_count: string;
  compensation_option: string;
  signature_name: string;
  signed_at: string;
  w9_received: boolean;
  payout_setup: boolean;
};

type AdminTab = 'overview' | 'creators' | 'applications' | 'agreements' | 'submissions' | 'orders';

const TABS: { id: AdminTab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'creators', label: 'Creators', icon: 'users' },
  { id: 'applications', label: 'Applications', icon: 'plus' },
  { id: 'agreements', label: 'Agreements', icon: 'shield' },
  { id: 'submissions', label: 'Submissions', icon: 'upload' },
  { id: 'orders', label: 'Log order', icon: 'wallet' },
];

const tierFor = (sales: number) => {
  const { tier } = tierForSales(sales);
  return tier.rate ? `${Math.round(tier.rate * 100)}% commission` : '60% off';
};
const money = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

export default function Admin() {
  const { profile, signOut } = useAuth();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('adminSidebarCollapsed') === '1');
  const [hoverSuppressed, setHoverSuppressed] = useState(false);
  const [meMenuOpen, setMeMenuOpen] = useState(false);
  const meMenuRef = useRef<HTMLDivElement>(null);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState<SubmissionRow[]>([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [subTab, setSubTab] = useState<'new' | 'approved' | 'rejected'>('new');
  const [rejectDraft, setRejectDraft] = useState<Record<string, string>>({});
  const [discountDraft, setDiscountDraft] = useState<Record<string, string>>({});
  const [orderCreatorId, setOrderCreatorId] = useState('');
  const [orderAmount, setOrderAmount] = useState('');
  const [orderSaving, setOrderSaving] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [allOrders, setAllOrders] = useState<OrderAgg[]>([]);
  const [allClicks, setAllClicks] = useState<ClickAgg[]>([]);
  const [certifiedCount, setCertifiedCount] = useState(0);
  const [agreements, setAgreements] = useState<AgreementRow[]>([]);
  const [agreementsLoading, setAgreementsLoading] = useState(true);

  const loadAgreements = async () => {
    setAgreementsLoading(true);
    const { data } = await supabase.from('partner_agreements').select('*').order('signed_at', { ascending: false });
    setAgreements((data as AgreementRow[]) ?? []);
    setAgreementsLoading(false);
  };

  const toggleAgreementFlag = async (id: number, field: 'w9_received' | 'payout_setup', value: boolean) => {
    setAgreements((list) => list.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
    await supabase.from('partner_agreements').update({ [field]: value }).eq('id', id);
  };

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

  const loadOverview = async () => {
    setOverviewLoading(true);
    const [{ data: orderData }, { data: clickData }, { data: certData }] = await Promise.all([
      supabase.from('orders').select('user_id, amount, created_at').in('status', COUNTED_ORDER_STATUSES),
      supabase.from('clicks').select('ref_code'),
      supabase.from('quiz_attempts').select('user_id').eq('passed', true),
    ]);
    setAllOrders((orderData as OrderAgg[]) ?? []);
    setAllClicks((clickData as ClickAgg[]) ?? []);
    setCertifiedCount(new Set(((certData as { user_id: string }[]) ?? []).map((c) => c.user_id)).size);
    setOverviewLoading(false);
  };

  const loadSubs = async () => {
    setSubsLoading(true);
    const { data } = await supabase
      .from('submissions')
      .select('id, user_id, clip_used, platform, post_url, status, status_cls, views, admin_note, resubmit_note, created_at, profiles(full_name)')
      .order('created_at', { ascending: false });
    setSubs((data as unknown as SubmissionRow[]) ?? []);
    setSubsLoading(false);
  };

  useEffect(() => {
    load();
    loadAgreements();
    loadSubs();
    loadOverview();
  }, []);

  const approvedCreators = useMemo(() => rows.filter((r) => r.status === 'approved'), [rows]);

  const filteredSubs = useMemo(
    () =>
      subs.filter((s) =>
        subTab === 'approved' ? s.status === 'Approved' : subTab === 'rejected' ? s.status === 'Needs changes' : s.status === 'In review'
      ),
    [subs, subTab]
  );

  const monthStart = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, []);

  const ordersThisMonth = useMemo(
    () => allOrders.filter((o) => new Date(o.created_at) >= monthStart),
    [allOrders, monthStart]
  );
  const revenueThisMonth = useMemo(
    () => ordersThisMonth.reduce((s, o) => s + Number(o.amount || 0), 0),
    [ordersThisMonth]
  );

  const clicksByRef = useMemo(() => {
    const acc: Record<string, number> = {};
    allClicks.forEach((c) => {
      acc[c.ref_code] = (acc[c.ref_code] ?? 0) + 1;
    });
    return acc;
  }, [allClicks]);

  const topCreators = useMemo(() => {
    return approvedCreators
      .map((r) => {
        const creatorOrders = allOrders.filter((o) => o.user_id === r.id);
        const revenue = creatorOrders.reduce((s, o) => s + Number(o.amount || 0), 0);
        const clicksCount = r.ref_code ? clicksByRef[r.ref_code] ?? 0 : 0;
        const conv = clicksCount > 0 ? (creatorOrders.length / clicksCount) * 100 : 0;
        return {
          id: r.id,
          name: r.full_name,
          platform: r.platform ?? '—',
          tier: tierFor(revenue),
          clicks: clicksCount,
          orders: creatorOrders.length,
          revenue,
          conv,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [approvedCreators, allOrders, clicksByRef]);

  const creatorDetail = useMemo(() => {
    if (!selectedCreatorId) return null;
    const creator = rows.find((r) => r.id === selectedCreatorId);
    if (!creator) return null;
    const creatorOrders = allOrders
      .filter((o) => o.user_id === creator.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const revenue = creatorOrders.reduce((s, o) => s + Number(o.amount || 0), 0);
    const clicksCount = creator.ref_code ? clicksByRef[creator.ref_code] ?? 0 : 0;
    const conv = clicksCount > 0 ? (creatorOrders.length / clicksCount) * 100 : 0;
    return {
      creator,
      orders: creatorOrders,
      revenue,
      clicksCount,
      conv,
      tier: tierFor(revenue),
    };
  }, [selectedCreatorId, rows, allOrders, clicksByRef]);

  const setStatus = async (id: string, status: 'approved' | 'rejected') => {
    await supabase.from('profiles').update({ status }).eq('id', id);
    if (status === 'approved') {
      const creator = rows.find((r) => r.id === id);
      if (creator?.ref_code) {
        const discountPercent = Number(discountDraft[id]?.trim() || '10') || 10;
        const {
          data: { session },
        } = await supabase.auth.getSession();
        await supabase.functions.invoke('woo-create-coupon', {
          body: { ref_code: creator.ref_code, discount_percent: discountPercent },
          headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
        });
      }
    }
    load();
  };

  const setSubStatus = async (id: string, status: 'Approved' | 'Needs changes', cls: 'good' | 'bad') => {
    const note = rejectDraft[id]?.trim();
    await supabase
      .from('submissions')
      .update({
        status,
        status_cls: cls,
        admin_note: status === 'Needs changes' ? note || null : null,
        resubmit_note: null,
      })
      .eq('id', id);
    setRejectDraft((d) => ({ ...d, [id]: '' }));
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

  useEffect(() => {
    if (!meMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (meMenuRef.current && !meMenuRef.current.contains(e.target as Node)) {
        setMeMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMeMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [meMenuOpen]);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      localStorage.setItem('adminSidebarCollapsed', c ? '0' : '1');
      return !c;
    });
  };

  const tabTitle: Record<AdminTab, string> = {
    overview: 'Programme overview',
    creators: 'Current creators',
    applications: 'New applications',
    agreements: 'Signed partner agreements',
    submissions: 'Submission review',
    orders: 'Log an order',
  };

  const pendingRows = rows.filter((r) => r.status === 'pending');
  const currentRows = rows.filter((r) => r.status !== 'pending');

  return (
    <div className={`app ${collapsed ? 'collapsed' : ''}`}>
      <nav
        className={`side ${collapsed ? 'collapsed' : ''} ${hoverSuppressed ? 'hover-suppressed' : ''}`}
        aria-label="Admin"
        onMouseLeave={() => setHoverSuppressed(false)}
      >
        <div className="side-brand">
          <svg className="mark" viewBox="0 0 28 28" aria-hidden="true">
            <defs>
              <linearGradient id="admin-side-lg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#EAF1F4" />
                <stop offset=".5" stopColor="#8CC8FF" />
                <stop offset="1" stopColor="#A58BFF" />
              </linearGradient>
            </defs>
            <g fill="none" stroke="url(#admin-side-lg)" strokeWidth="1.6">
              <path d="M14 3 23.5 8.5v11L14 25 4.5 19.5v-11z" />
              <circle cx="14" cy="14" r="3.2" />
              <path d="M14 3v7.8M23.5 19.5l-6.7-3.9M4.5 19.5l6.7-3.9" />
            </g>
          </svg>
          <span className="side-label">
            CANLAB <small>Admin</small>
          </span>
        </div>
        {TABS.map((t) => (
          <button
            key={t.id}
            data-tab={t.id}
            title={t.label}
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => {
              setTab(t.id);
              setHoverSuppressed(true);
            }}
          >
            <Icon id={t.icon} />
            <span className="side-label">{t.label}</span>
          </button>
        ))}
        <button
          className="side-collapse"
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Icon id="panel" />
          <span className="side-label">Collapse</span>
        </button>
        <div className="side-footer">
          <div className="me" ref={meMenuRef}>
            <i aria-hidden="true"></i>
            <div className="me-copy side-label">
              <b style={{ fontWeight: 600 }}>{profile?.full_name ?? 'Admin'}</b>
              <br />
              <span className="muted">Team access</span>
            </div>
            <button
              className="me-more"
              type="button"
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={meMenuOpen}
              onClick={() => setMeMenuOpen((o) => !o)}
            >
              <Icon id="dots" />
            </button>
            {meMenuOpen && (
              <div className="me-menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMeMenuOpen(false);
                    signOut();
                  }}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 17l5-5-5-5M15 12H3" />
                    <path d="M12 3h7v18h-7" />
                  </svg>
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="main">
        <div className="ph">
          <div>
            <span className="label">CANLAB team view</span>
            <h2 style={{ marginTop: 8 }}>{tabTitle[tab]}</h2>
          </div>
        </div>

        {tab === 'overview' && (
          <>
            <div className="grid g4">
              <div className="card kpi">
                <span className="label">Active creators</span>
                <div className="v">{overviewLoading && loading ? '—' : approvedCreators.length}</div>
              </div>
              <div className="card kpi">
                <span className="label">Certified</span>
                <div className="v">{overviewLoading ? '—' : certifiedCount}</div>
              </div>
              <div className="card kpi">
                <span className="label">Creator orders · this month</span>
                <div className="v">{overviewLoading ? '—' : ordersThisMonth.length}</div>
              </div>
              <div className="card kpi">
                <span className="label">Creator revenue · this month</span>
                <div className="v">{overviewLoading ? '—' : money(revenueThisMonth)}</div>
              </div>
            </div>

            <div className="card tbl" style={{ marginTop: 16 }}>
              <h3>Top creators</h3>
              {overviewLoading ? (
                <p className="muted" style={{ marginTop: 12 }}>Loading…</p>
              ) : topCreators.length === 0 ? (
                <p className="muted" style={{ marginTop: 12 }}>No order activity yet.</p>
              ) : (
                <table className="data" style={{ marginTop: 10 }}>
                  <thead>
                    <tr>
                      <th>Creator</th>
                      <th>Platform</th>
                      <th>Tier</th>
                      <th className="r">Clicks</th>
                      <th className="r">Orders</th>
                      <th className="r">Revenue</th>
                      <th className="r">Conv.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCreators.map((c) => (
                      <tr key={c.id} onClick={() => setSelectedCreatorId(c.id)} style={{ cursor: 'pointer' }}>
                        <td>{c.name}</td>
                        <td>{c.platform}</td>
                        <td><span className="st info plain">{c.tier}</span></td>
                        <td className="r">{c.clicks.toLocaleString('en-US')}</td>
                        <td className="r">{c.orders}</td>
                        <td className="r">{money(c.revenue)}</td>
                        <td className="r">{c.conv.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {tab === 'creators' && (
          <>
            {loading ? (
              <p className="muted" style={{ marginTop: 24 }}>Loading…</p>
            ) : currentRows.length === 0 ? (
              <p className="muted" style={{ marginTop: 24 }}>No creators yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: 14, marginTop: 24 }}>
                {currentRows.map((r) => (
                  <div
                    key={r.id}
                    className="tierb"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, cursor: 'pointer' }}
                    onClick={() => setSelectedCreatorId(r.id)}
                  >
                    <div>
                      <b>{r.full_name}</b> <span className="muted">· {r.email}</span>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {r.handle} · {r.platform} · {r.followers} followers
                      </div>
                      <div className="label" style={{ marginTop: 6 }}>{r.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'applications' && (
          <>
            {loading ? (
              <p className="muted" style={{ marginTop: 24 }}>Loading…</p>
            ) : pendingRows.length === 0 ? (
              <p className="muted" style={{ marginTop: 24 }}>No pending applications.</p>
            ) : (
              <div style={{ display: 'grid', gap: 14, marginTop: 24 }}>
                {pendingRows.map((r) => (
                  <div
                    key={r.id}
                    className="tierb"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}
                  >
                    <div onClick={() => setSelectedCreatorId(r.id)} style={{ cursor: 'pointer' }}>
                      <b>{r.full_name}</b> <span className="muted">· {r.email}</span>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {r.handle} · {r.platform} · {r.followers} followers
                      </div>
                      <div className="label" style={{ marginTop: 6 }}>{r.status}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 'none' }}>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="10"
                        title="Coupon discount %"
                        style={{ width: 64 }}
                        value={discountDraft[r.id] ?? ''}
                        onChange={(e) => setDiscountDraft((d) => ({ ...d, [r.id]: e.target.value }))}
                      />
                      <span className="muted" style={{ fontSize: 13 }}>%</span>
                      <button className="btn sm solid" onClick={() => setStatus(r.id, 'approved')}>
                        Approve
                      </button>
                      <button className="btn sm" onClick={() => setStatus(r.id, 'rejected')}>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'submissions' && (
          <>
            <div className="tabbar" style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              {(['new', 'approved', 'rejected'] as const).map((sub) => (
                <button
                  key={sub}
                  className={`btn sm${subTab === sub ? ' solid' : ''}`}
                  onClick={() => setSubTab(sub)}
                >
                  {sub === 'new' ? 'New submission' : sub === 'approved' ? 'Approved' : 'Rejected'}
                </button>
              ))}
            </div>
            {subsLoading ? (
              <p className="muted" style={{ marginTop: 24 }}>Loading…</p>
            ) : filteredSubs.length === 0 ? (
              <p className="muted" style={{ marginTop: 24 }}>No submissions here.</p>
            ) : (
              <div style={{ display: 'grid', gap: 14, marginTop: 24 }}>
                {filteredSubs.map((s) => (
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
                      {subTab === 'rejected' && s.admin_note && (
                        <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
                          Reason: {s.admin_note}
                        </div>
                      )}
                      {subTab === 'new' && s.resubmit_note && (
                        <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
                          Creator note: {s.resubmit_note}
                        </div>
                      )}
                    </div>
                    {subTab === 'new' && (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 'none' }}>
                        <input
                          placeholder="Rejection reason if any"
                          style={{ width: 200 }}
                          value={rejectDraft[s.id] ?? ''}
                          onChange={(e) => setRejectDraft((d) => ({ ...d, [s.id]: e.target.value }))}
                        />
                        <button className="btn sm solid" onClick={() => setSubStatus(s.id, 'Approved', 'good')}>
                          Approve
                        </button>
                        <button className="btn sm" onClick={() => setSubStatus(s.id, 'Needs changes', 'bad')}>
                          Reject
                        </button>
                      </div>
                    )}
                    {subTab === 'approved' && (
                      <div className="muted" style={{ flex: 'none' }}>Views: {s.views || '—'}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'agreements' && (
          <>
            {agreementsLoading ? (
              <p className="muted" style={{ marginTop: 24 }}>Loading…</p>
            ) : agreements.length === 0 ? (
              <p className="muted" style={{ marginTop: 24 }}>No signed agreements yet. Creators sign at /agreement after applying.</p>
            ) : (
              <div className="card tbl" style={{ marginTop: 24 }}>
                <table className="data">
                  <thead>
                    <tr>
                      <th>Signed</th><th>Legal name</th><th>Email</th><th>State</th><th>Handles</th>
                      <th className="r">Followers</th><th>Signature</th><th>W-9</th><th>Payout set up</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agreements.map((a) => (
                      <tr key={a.id}>
                        <td>{new Date(a.signed_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td>{a.legal_name}</td>
                        <td>{a.email}</td>
                        <td>{a.country_state.replace('United States · ', '')}</td>
                        <td>{a.handles}</td>
                        <td className="r">{a.follower_count}</td>
                        <td><i>{a.signature_name}</i><div className="muted" style={{ fontSize: 12 }}>{a.agreement_version}</div></td>
                        <td><input type="checkbox" checked={a.w9_received} onChange={(e) => toggleAgreementFlag(a.id, 'w9_received', e.target.checked)} aria-label={`W-9 received for ${a.legal_name}`} /></td>
                        <td><input type="checkbox" checked={a.payout_setup} onChange={(e) => toggleAgreementFlag(a.id, 'payout_setup', e.target.checked)} aria-label={`Payout set up for ${a.legal_name}`} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === 'orders' && (
          <>
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
          </>
        )}
      </div>

      {creatorDetail && (
        <div
          onClick={() => setSelectedCreatorId(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{
              width: 'min(420px, 100%)',
              height: '100%',
              overflowY: 'auto',
              padding: 24,
              borderRadius: 0,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="label">Creator detail</span>
                <h2 style={{ marginTop: 8 }}>{creatorDetail.creator.full_name}</h2>
                <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{creatorDetail.creator.email}</div>
              </div>
              <button className="btn sm" onClick={() => setSelectedCreatorId(null)}>
                Close
              </button>
            </div>

            <div className="muted" style={{ fontSize: 13, marginTop: 16 }}>
              {creatorDetail.creator.handle ?? '—'} · {creatorDetail.creator.platform ?? '—'} ·{' '}
              {creatorDetail.creator.followers ?? '—'} followers
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="label">{creatorDetail.creator.status}</span>
              <span className="st info plain">{creatorDetail.tier}</span>
              {creatorDetail.creator.ref_code && (
                <span className="label">Ref: {creatorDetail.creator.ref_code}</span>
              )}
            </div>

            <div className="grid g4" style={{ marginTop: 20, gridTemplateColumns: '1fr 1fr' }}>
              <div className="card kpi">
                <span className="label">Clicks</span>
                <div className="v">{creatorDetail.clicksCount.toLocaleString('en-US')}</div>
              </div>
              <div className="card kpi">
                <span className="label">Orders</span>
                <div className="v">{creatorDetail.orders.length}</div>
              </div>
              <div className="card kpi">
                <span className="label">Revenue</span>
                <div className="v">{money(creatorDetail.revenue)}</div>
              </div>
              <div className="card kpi">
                <span className="label">Conversion</span>
                <div className="v">{creatorDetail.conv.toFixed(2)}%</div>
              </div>
            </div>

            <h3 style={{ marginTop: 24 }}>Order history</h3>
            {creatorDetail.orders.length === 0 ? (
              <p className="muted" style={{ marginTop: 12 }}>No orders yet.</p>
            ) : (
              <table className="data" style={{ marginTop: 10 }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th className="r">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {creatorDetail.orders.map((o, i) => (
                    <tr key={i}>
                      <td>{new Date(o.created_at).toLocaleDateString()}</td>
                      <td className="r">{money(Number(o.amount || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
