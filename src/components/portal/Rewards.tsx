import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { COUNTED_ORDER_STATUSES } from '../../lib/orderStatus';
import { COMMISSION_TIERS, MIN_PAYOUT, tierForSales } from '../../lib/program';
import { Link } from 'react-router-dom';

type OrderRow = { amount: number; created_at: string };
type ClickRow = { created_at: string };


const money = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
const num = (n: number) => n.toLocaleString('en-US');

export default function Rewards() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [clicks, setClicks] = useState<ClickRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedAt, setSignedAt] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const refCode = profile?.ref_code;
      const [{ data: orderData }, { data: clickData }, { data: agreement }] = await Promise.all([
        supabase
          .from('orders')
          .select('amount, created_at')
          .eq('user_id', user.id)
          .in('status', COUNTED_ORDER_STATUSES)
          .order('created_at', { ascending: false }),
        refCode
          ? supabase.from('clicks').select('created_at').eq('ref_code', refCode)
          : Promise.resolve({ data: [] as ClickRow[] }),
        supabase.from('partner_agreements').select('signed_at').eq('user_id', user.id).order('signed_at', { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (!active) return;
      setOrders((orderData as OrderRow[]) ?? []);
      setClicks((clickData as ClickRow[]) ?? []);
      setSignedAt((agreement as { signed_at: string } | null)?.signed_at ?? null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user, profile?.ref_code]);

  const now = new Date();
  const currentKey = `${now.getFullYear()}-${now.getMonth()}`;

  const months = useMemo(() => {
    const byMonth = new Map<string, { label: string; clicks: number; orders: number; sales: number; key: string }>();
    const keyOf = (iso: string) => {
      const d = new Date(iso);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) };
    };
    for (const o of orders) {
      const { key, label } = keyOf(o.created_at);
      const row = byMonth.get(key) ?? { label, clicks: 0, orders: 0, sales: 0, key };
      row.orders += 1;
      row.sales += Number(o.amount) || 0;
      byMonth.set(key, row);
    }
    for (const c of clicks) {
      const { key, label } = keyOf(c.created_at);
      const row = byMonth.get(key) ?? { label, clicks: 0, orders: 0, sales: 0, key };
      row.clicks += 1;
      byMonth.set(key, row);
    }
    return [...byMonth.values()].sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [orders, clicks]);

  const currentMonth = months.find((m) => m.key === currentKey);
  const currentSales = currentMonth?.sales ?? 0;
  const { idx, tier, commission } = tierForSales(currentSales);
  const next = COMMISSION_TIERS[idx + 1];

  return (
    <section data-panel="earn">
      <div className="ph">
        <div>
          <span className="label">Rewards</span>
          <h2 style={{ marginTop: 8 }}>Commission</h2>
        </div>
        <span className="st info">{tier.rate ? `${Math.round(tier.rate * 100)}% this month` : '60% off product'} · paid on the 30th</span>
      </div>

      {signedAt === null && (
        <div className="card" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h3>Sign your Partner Agreement</h3>
            <p className="muted" style={{ fontSize: 14 }}>You need a signed agreement, a W-9 and payout details before any commission can be paid.</p>
          </div>
          <Link className="btn solid" to="/agreement">Sign now</Link>
        </div>
      )}
      {signedAt && (
        <p className="muted" style={{ fontSize: 13.5, marginBottom: 12 }}>
          Partner Agreement signed {new Date(signedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}. <Link to="/agreement">View</Link>
        </p>
      )}

      <div className="card">
        <h3>Your tier this month</h3>
        <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
          {money(currentSales)} in eligible sales · {tier.rate ? `${money(commission)} commission so far` : 'no commission yet'}
          {next ? ` · ${money(next.min - currentSales)} more to ${Math.round(next.rate * 100)}%` : ' · top tier'}
        </p>
        <div className="ladder">
          {COMMISSION_TIERS.map((t, i) => (
            <div key={t.label} className={idx === i ? 'on' : undefined}>
              <span className="label" style={idx === i ? { color: 'var(--ice)' } : undefined}>
                {t.label}{idx === i ? ' · you' : ''}
              </span>
              <b>{Math.round((t.rate || 0.6) * 100)}%</b>{t.rate ? 'commission' : 'off product'}
            </div>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
          The tier you reach applies to the whole month. Eligible sales exclude taxes, shipping, refunds, chargebacks, discounts and your own orders. Paid after a 30-day refund hold; balances under ${MIN_PAYOUT} roll over.
        </p>
      </div>

      <div className="card tbl" style={{ marginTop: 16 }}>
        <table className="data">
          <thead>
            <tr>
              <th>Month</th><th className="r">Clicks</th><th className="r">Orders</th>
              <th className="r">Eligible sales</th><th className="r">Rate</th><th className="r">Commission</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="muted">Loading…</td></tr>
            ) : months.length === 0 ? (
              <tr><td colSpan={7} className="muted">No orders tracked yet.</td></tr>
            ) : (
              months.map((row) => {
                const t = tierForSales(row.sales);
                const isCurrent = row.key === currentKey;
                return (
                  <tr key={row.key}>
                    <td>{row.label}</td>
                    <td className="r">{num(row.clicks)}</td>
                    <td className="r">{row.orders}</td>
                    <td className="r">{money(row.sales)}</td>
                    <td className="r">{t.tier.rate ? `${Math.round(t.tier.rate * 100)}%` : '—'}</td>
                    <td className="r">{money(t.commission)}</td>
                    <td><span className={`st ${isCurrent ? 'info' : 'good'}`}>{isCurrent ? 'Current' : 'Completed'}</span></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
