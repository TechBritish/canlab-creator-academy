import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabaseClient';
import { COUNTED_ORDER_STATUSES } from '../lib/orderStatus';
import { MODS } from '../data/mockData';
import Icon from '../components/Icon';
import Academy from '../components/portal/Academy';
import ClipLibrary from '../components/portal/ClipLibrary';
import Submissions from '../components/portal/Submissions';
import Rewards from '../components/portal/Rewards';
import Community from '../components/portal/Community';
import VoiceAgent from '../components/portal/VoiceAgent';
import VoiceAgentBoundary from '../components/portal/VoiceAgentBoundary';

type Tab = 'dash' | 'academy' | 'clips' | 'subs' | 'earn' | 'comm';

const TOTAL_LESSONS = MODS.reduce((s, m) => s + m.lessons.length, 0);

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dash', label: 'Dashboard', icon: 'grid' },
  { id: 'academy', label: 'Academy', icon: 'cap' },
  { id: 'clips', label: 'Clip library', icon: 'film' },
  { id: 'subs', label: 'Submissions', icon: 'upload' },
  { id: 'earn', label: 'Rewards', icon: 'wallet' },
  { id: 'comm', label: 'Community', icon: 'users' },
];

const tierFor = (orders: number) =>
  orders >= 51 ? { tier: 'Elite', disc: '35%', next: null as number | null }
  : orders >= 11 ? { tier: 'Pro', disc: '25%', next: 51 }
  : { tier: 'Starter', disc: '15%', next: 11 };

const DASH_CLIPS = [
  { h: 'What 99% purity looks like on paper', f: 'COA read', d: '0:28', g: ['#1B4A6B', '#0B1B2A'] },
  { h: 'Ordered at 10am. Shipped at 2pm.', f: 'Unboxing', d: '0:34', g: ['#3A2E6B', '#140F26'] },
  { h: '3 myths about research peptides', f: 'Myth vs fact', d: '0:41', g: ['#17504A', '#0A1C1A'] },
];

function bg(g: string[]) {
  return `radial-gradient(90% 60% at 30% 20%,${g[0]},transparent 70%),linear-gradient(170deg,${g[0]},${g[1]})`;
}

export default function Portal() {
  const { user, profile, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('dash');
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === '1');
  const [hoverSuppressed, setHoverSuppressed] = useState(false);
  const [meMenuOpen, setMeMenuOpen] = useState(false);
  const meMenuRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const [lessonsDone, setLessonsDone] = useState(0);
  const [clicks30d, setClicks30d] = useState(0);
  const [orders30d, setOrders30d] = useState(0);
  const [monthOrders, setMonthOrders] = useState(0);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const refCode = profile?.ref_code;

      const [{ data: progress }, { data: recentClicks }, { data: recentOrders }, { data: thisMonthOrders }] = await Promise.all([
        supabase.from('academy_progress').select('lesson_key').eq('user_id', user.id),
        refCode
          ? supabase.from('clicks').select('id').eq('ref_code', refCode).gte('created_at', since.toISOString())
          : Promise.resolve({ data: [] as { id: number }[] }),
        supabase
          .from('orders')
          .select('id')
          .eq('user_id', user.id)
          .in('status', COUNTED_ORDER_STATUSES)
          .gte('created_at', since.toISOString()),
        supabase
          .from('orders')
          .select('id')
          .eq('user_id', user.id)
          .in('status', COUNTED_ORDER_STATUSES)
          .gte('created_at', monthStart.toISOString()),
      ]);
      if (!active) return;
      setLessonsDone((progress ?? []).length);
      setClicks30d((recentClicks ?? []).length);
      setOrders30d((recentOrders ?? []).length);
      setMonthOrders((thisMonthOrders ?? []).length);
    })();
    return () => {
      active = false;
    };
  }, [user, tab, profile?.ref_code]);

  const trainingPct = Math.round((lessonsDone / TOTAL_LESSONS) * 100);
  const { tier, disc, next } = tierFor(monthOrders);
  const tierPct = next ? Math.min(100, Math.round((monthOrders / next) * 100)) : 100;

  let nextLessonLabel = 'All lessons complete';
  {
    let seen = 0;
    outerLoop: for (let a = 0; a < MODS.length; a++) {
      for (let b = 0; b < MODS[a].lessons.length; b++) {
        if (seen >= lessonsDone) {
          nextLessonLabel = `${MODS[a].n} · ${MODS[a].t}`;
          break outerLoop;
        }
        seen++;
      }
    }
  }

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
      localStorage.setItem('sidebarCollapsed', c ? '0' : '1');
      return !c;
    });
  };

  // Academy needs the most horizontal room (module list + player + quiz),
  // so auto-minimize the nav the moment a creator opens it. Any manual
  // expand/collapse the user does afterward is left alone until they
  // navigate to Academy again.
  const autoCollapsedRef = useRef(false);
  useEffect(() => {
    if (tab === 'academy' && !autoCollapsedRef.current) {
      autoCollapsedRef.current = true;
      setCollapsed(true);
    } else if (tab !== 'academy') {
      autoCollapsedRef.current = false;
    }
  }, [tab]);

  if (!profile) return null;

  if (profile.status !== 'approved') {
    return (
      <section className="s">
        <div className="wrap" style={{ paddingBlock: 100, maxWidth: 560 }}>
          <span className="label">Application status</span>
          <h2 style={{ marginTop: 10 }}>
            {profile.status === 'pending'
              ? 'Your application is under review.'
              : 'Your application was not approved.'}
          </h2>
          <p className="muted" style={{ marginTop: 14 }}>
            {profile.status === 'pending'
              ? "We review every application within 48 hours. You'll get full portal access as soon as you're approved."
              : 'Reach out to support if you think this is a mistake.'}
          </p>
          <button className="btn sm" style={{ marginTop: 24 }} onClick={signOut}>
            Log out
          </button>
        </div>
      </section>
    );
  }

  const firstName = profile.full_name.split(' ')[0];
  const refCode = profile.ref_code ?? `${profile.full_name.split(' ')[0]?.toUpperCase().slice(0, 4)}15`;

  const copyRef = () => {
    const link = `canlabintl.com/?ref=${refCode}`;
    navigator.clipboard?.writeText(link).then(() => toast('Link copied')).catch(() => toast('Link selected'));
  };

  return (
    <div className={`app ${collapsed ? 'collapsed' : ''}`}>
      <nav
        className={`side ${collapsed ? 'collapsed' : ''} ${hoverSuppressed ? 'hover-suppressed' : ''}`}
        aria-label="Portal"
        onMouseLeave={() => setHoverSuppressed(false)}
      >
        <div className="side-brand">
          <svg className="mark" viewBox="0 0 28 28" aria-hidden="true">
            <defs>
              <linearGradient id="side-lg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#EAF1F4" />
                <stop offset=".5" stopColor="#8CC8FF" />
                <stop offset="1" stopColor="#A58BFF" />
              </linearGradient>
            </defs>
            <g fill="none" stroke="url(#side-lg)" strokeWidth="1.6">
              <path d="M14 3 23.5 8.5v11L14 25 4.5 19.5v-11z" />
              <circle cx="14" cy="14" r="3.2" />
              <path d="M14 3v7.8M23.5 19.5l-6.7-3.9M4.5 19.5l6.7-3.9" />
            </g>
          </svg>
          <span className="side-label">
            CANLAB <small>Creator Academy</small>
          </span>
        </div>
        {TABS.map((t) => (
          <button key={t.id} data-tab={t.id} title={t.label} aria-current={tab === t.id ? 'page' : undefined} onClick={() => {
            setTab(t.id);
            setHoverSuppressed(true);
          }}>
            <Icon id={t.icon} />
            <span className="side-label">{t.label}</span>
            {t.id === 'academy' && <span className="badge side-label">{lessonsDone}/{TOTAL_LESSONS}</span>}
          </button>
        ))}
        <button className="side-collapse" type="button" onClick={toggleCollapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <Icon id="panel" />
          <span className="side-label">Collapse</span>
        </button>
        <div className="side-footer">
          <div className="me" ref={meMenuRef}>
            <i aria-hidden="true"></i>
            <div className="me-copy side-label">
              <b style={{ fontWeight: 600 }}>{profile.full_name}</b>
              <br />
              <span className="muted">@{profile.handle || 'creator'} · Pro</span>
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
        {tab === 'dash' && (
          <section data-panel="dash">
            <div className="ph">
              <div>
                <span className="label">Welcome back</span>
                <h2 style={{ marginTop: 8 }}>Good to see you, {firstName}.</h2>
              </div>
              <button className="btn sm solid" onClick={() => setTab('academy')}>
                Continue training <Icon id="arrow" className="i arrow" strokeWidth={2} />
              </button>
            </div>

            <div className="grid g4">
              <div className="card kpi">
                <span className="label">Clicks · 30d</span>
                <div className="v">{clicks30d.toLocaleString('en-US')}</div>
                <div className="d" style={{ color: 'var(--slate)' }}>From your tracked orders</div>
              </div>
              <div className="card kpi">
                <span className="label">Orders · 30d</span>
                <div className="v">{orders30d}</div>
                <div className="d" style={{ color: 'var(--slate)' }}>{monthOrders} this month</div>
              </div>
              <div className="card kpi">
                <span className="label">Your discount</span>
                <div className="v">{disc} off</div>
                <div className="d" style={{ color: 'var(--slate)' }}>{tier} tier</div>
              </div>
              <div className="card kpi">
                <span className="label">Training</span>
                <div className="v">{trainingPct}%</div>
                <div className="bar" style={{ marginTop: 12 }}><i style={{ width: `${trainingPct}%` }}></i></div>
              </div>
            </div>

            <div className="grid g2" style={{ marginTop: 16 }}>
              <div className="card">
                <h3>Up next</h3>
                <p className="muted" style={{ marginTop: 4 }}>{nextLessonLabel}</p>
                <div style={{ marginTop: 22, display: 'grid', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span>Tier progress{next ? `: ${tier} to next tier` : ': Elite (max tier)'}</span>
                    <span className="mono muted">{monthOrders}{next ? ` / ${next} orders` : ' orders'}</span>
                  </div>
                  <div className="bar"><i style={{ width: `${tierPct}%` }}></i></div>
                </div>
                <h3 style={{ marginTop: 28 }}>Your link</h3>
                <div className="ref">
                  <code>canlabintl.com/?ref={refCode}</code>
                  <button className="btn sm" onClick={copyRef}>
                    <Icon id="copy" />Copy
                  </button>
                </div>
                <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>
                  Always pair it with #ad and "for research use only".
                </p>
              </div>
              <div className="card">
                <h3>This week's clip drop</h3>
                <p className="muted" style={{ marginTop: 4 }}>3 new clips added Monday</p>
                <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
                  {DASH_CLIPS.map((c) => (
                    <div key={c.h} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      <span style={{ width: 40, height: 56, borderRadius: 8, flex: 'none', background: bg(c.g) }}></span>
                      <span style={{ fontSize: 14.5 }}>
                        <b style={{ fontWeight: 500 }}>{c.h}</b>
                        <br />
                        <span className="muted" style={{ fontSize: 13 }}>{c.f} · {c.d}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <button className="btn sm" style={{ marginTop: 18 }} onClick={() => setTab('clips')}>
                  Open clip library
                </button>
              </div>
            </div>
          </section>
        )}

        {tab === 'academy' && <Academy />}
        {tab === 'clips' && <ClipLibrary />}
        {tab === 'subs' && <Submissions />}
        {tab === 'earn' && <Rewards />}
        {tab === 'comm' && <Community />}

      </div>

      <VoiceAgentBoundary>
        <VoiceAgent />
      </VoiceAgentBoundary>
    </div>
  );
}
