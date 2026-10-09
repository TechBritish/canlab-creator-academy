import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

type OrderRow = { amount: number; clicks: number; created_at: string };

const tierFor = (orders: number) =>
  orders >= 51 ? { tier: 'Elite', disc: '35%' } : orders >= 11 ? { tier: 'Pro', disc: '25%' } : { tier: 'Starter', disc: '15%' };

const money = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
const num = (n: number) => n.toLocaleString('en-US');

export default function Rewards() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('amount, clicks, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!active) return;
      setOrders((data as OrderRow[]) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const now = new Date();
  const currentKey = `${now.getFullYear()}-${now.getMonth()}`;

  const months = useMemo(() => {
    const byMonth = new Map<string, { label: string; clicks: number; orders: number; sales: number; key: string }>();
    for (const o of orders) {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const row = byMonth.get(key) ?? { label, clicks: 0, orders: 0, sales: 0, key };
      row.clicks += o.clicks ?? 0;
      row.orders += 1;
      row.sales += Number(o.amount) || 0;
      byMonth.set(key, row);
    }
    return [...byMonth.values()].sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [orders]);

  const currentMonth = months.find((m) => m.key === currentKey);
  const currentOrders = currentMonth?.orders ?? 0;
  const { tier, disc } = tierFor(currentOrders);

  return (
    <section data-panel="earn">
      <div className="ph">
        <div>
          <span className="label">Rewards</span>
          <h2 style={{ marginTop: 8 }}>Member discount</h2>
        </div>
        <span className="st info">{disc} off · tier updates 1st of each month</span>
      </div>

      <div className="card">
        <h3>Your tier</h3>
        <div className="ladder">
          <div className={tier === 'Starter' ? 'on' : undefined}>
            <span className="label" style={tier === 'Starter' ? { color: 'var(--ice)' } : undefined}>
              Starter{tier === 'Starter' ? ' · you' : ''}
            </span>
            <b>15%</b>1–10 orders
          </div>
          <div className={tier === 'Pro' ? 'on' : undefined}>
            <span className="label" style={tier === 'Pro' ? { color: 'var(--ice)' } : undefined}>
              Pro{tier === 'Pro' ? ' · you' : ''}
            </span>
            <b>25%</b>11–50 orders
          </div>
          <div className={tier === 'Elite' ? 'on' : undefined}>
            <span className="label" style={tier === 'Elite' ? { color: 'var(--ice)' } : undefined}>
              Elite{tier === 'Elite' ? ' · you' : ''}
            </span>
            <b>35%</b>51+ orders
          </div>
        </div>
      </div>

      <div className="card tbl" style={{ marginTop: 16 }}>
        <table className="data">
          <thead>
            <tr>
              <th>Month</th><th className="r">Clicks</th><th className="r">Orders</th>
              <th className="r">Sales driven</th><th>Tier</th><th className="r">Your discount</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="muted">Loading…</td></tr>
            ) : months.length === 0 ? (
              <tr><td colSpan={7} className="muted">No orders tracked yet.</td></tr>
            ) : (
              months.map((row) => {
                const t = tierFor(row.orders);
                const isCurrent = row.key === currentKey;
                return (
                  <tr key={row.key}>
                    <td>{row.label}</td>
                    <td className="r">{num(row.clicks)}</td>
                    <td className="r">{row.orders}</td>
                    <td className="r">{money(row.sales)}</td>
                    <td>{t.tier}</td>
                    <td className="r">{t.disc}</td>
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
