import { useMemo, useState } from 'react';
import { COMMISSION_TIERS, MIN_PAYOUT, tierForSales } from '../../lib/program';

const money = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

export default function RewardsCalculator() {
  const [orders, setOrders] = useState(120);
  const [aov, setAov] = useState(150);

  const { idx, tier, commission, sales, toNext } = useMemo(() => {
    const s = orders * aov;
    const r = tierForSales(s);
    const next = COMMISSION_TIERS[r.idx + 1];
    return { ...r, sales: s, toNext: next ? next.min - s : 0 };
  }, [orders, aov]);

  const pct = (v: number, min: number, max: number) => ((v - min) / (max - min)) * 100 + '%';

  return (
    <section className="s" id="earn" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="head">
          <span className="label">Commission</span>
          <h2>Earn on every sale, <span className="serif">tier by tier.</span></h2>
          <p>Move the sliders. Once your monthly sales cross a tier, that rate applies to the whole month. Below $10k you still get product at 60% off.</p>
        </div>
        <div className="calc">
          <div className="in">
            <div className="slider">
              <div className="top"><label htmlFor="c-orders" className="muted">Orders from your link or code per month</label><output id="o-orders">{orders}</output></div>
              <input type="range" id="c-orders" min={5} max={1200} step={5} value={orders} style={{ ['--p' as any]: pct(orders, 5, 1200) }} onChange={(e) => setOrders(+e.target.value)} />
            </div>
            <div className="slider">
              <div className="top"><label htmlFor="c-aov" className="muted">Average order value</label><output id="o-aov">${aov}</output></div>
              <input type="range" id="c-aov" min={50} max={400} step={5} value={aov} style={{ ['--p' as any]: pct(aov, 50, 400) }} onChange={(e) => setAov(+e.target.value)} />
            </div>
            <p className="muted" style={{ fontSize: 13.5 }}>Monthly eligible net sales: <b>{money(sales)}</b>. Eligible sales exclude taxes, shipping, refunds, chargebacks, discounts and your own orders.</p>
            <p className="muted" style={{ fontSize: 13.5 }}>Paid monthly on the 30th after a 30-day refund hold. Balances under ${MIN_PAYOUT} roll over. Weekly output: 4 posts + 2 reels (reels supplied by the Academy). No monthly fee.</p>
          </div>
          <div className="out">
            <div>
              <span className="label">Your monthly commission</span>
              <div className="result" id="c-result">{tier.rate ? money(commission) : '60% off'}</div>
              <p className="muted" id="c-year" style={{ marginTop: 10 }}>
                {tier.rate
                  ? `${Math.round(tier.rate * 100)}% of ${money(sales)}${toNext > 0 ? ` · ${money(toNext)} more to the next tier` : ' · top tier'}`
                  : `No commission yet · ${money(toNext)} more in sales unlocks 10%`}
              </p>
            </div>
            <div className="tiers">
              {COMMISSION_TIERS.map((t, i) => (
                <div key={t.label} className={`tierb${idx === i ? ' on' : ''}`} data-t={i}>
                  <small>{t.label}</small><b>{Math.round((t.rate || 0.6) * 100)}%</b><small>{t.rate ? 'commission' : 'off product'}</small>
                </div>
              ))}
            </div>
            <p className="mono muted">Approved creators get 60% off the approved catalog. Buying is optional and self-purchases never earn commission.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
