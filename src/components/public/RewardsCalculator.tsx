import { useMemo, useState } from 'react';

export default function RewardsCalculator() {
  const [orders, setOrders] = useState(25);
  const [aov, setAov] = useState(150);

  const { tier, rate, saved } = useMemo(() => {
    const t = orders > 50 ? 2 : orders > 10 ? 1 : 0;
    const r = [0.15, 0.25, 0.35][t];
    return { tier: t, rate: r, saved: Math.round(aov * r) };
  }, [orders, aov]);

  const pct = (v: number, min: number, max: number) => ((v - min) / (max - min)) * 100 + '%';

  return (
    <section className="s" id="earn" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="head">
          <span className="label">Rewards</span>
          <h2>Better pricing, <span className="serif">order by order.</span></h2>
          <p>Move the sliders. Your member discount goes up automatically as the orders you drive cross each tier.</p>
        </div>
        <div className="calc">
          <div className="in">
            <div className="slider">
              <div className="top"><label htmlFor="c-orders" className="muted">Orders from your link per month</label><output id="o-orders">{orders}</output></div>
              <input type="range" id="c-orders" min={1} max={120} value={orders} style={{ ['--p' as any]: pct(orders, 1, 120) }} onChange={(e) => setOrders(+e.target.value)} />
            </div>
            <div className="slider">
              <div className="top"><label htmlFor="c-aov" className="muted">Your typical CANLAB order</label><output id="o-aov">${aov}</output></div>
              <input type="range" id="c-aov" min={60} max={400} step={5} value={aov} style={{ ['--p' as any]: pct(aov, 60, 400) }} onChange={(e) => setAov(+e.target.value)} />
            </div>
            <p className="muted" style={{ fontSize: 13.5 }}>Example: 10k followers, 4 posts a week, 1% click-through and a 5% conversion rate lands around 20 orders a month.</p>
          </div>
          <div className="out">
            <div>
              <span className="label">Your member discount</span>
              <div className="result" id="c-result">{Math.round(rate * 100)}% off</div>
              <p className="muted" id="c-year" style={{ marginTop: 10 }}>Saves about ${saved.toLocaleString()} on a ${aov} order</p>
            </div>
            <div className="tiers">
              <div className={`tierb${tier === 0 ? ' on' : ''}`} data-t="0"><small>Starter</small><b>15%</b><small>1–10 orders</small></div>
              <div className={`tierb${tier === 1 ? ' on' : ''}`} data-t="1"><small>Pro</small><b>25%</b><small>11–50 orders</small></div>
              <div className={`tierb${tier === 2 ? ' on' : ''}`} data-t="2"><small>Elite</small><b>35%</b><small>51+ orders</small></div>
            </div>
            <p className="mono muted">Placeholder tiers for demo. Final discounts set by CANLAB.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
