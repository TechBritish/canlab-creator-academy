import Icon from '../Icon';
import MoleculeCanvas from '../MoleculeCanvas';

export default function Hero({ onApply, onTour }: { onApply: () => void; onTour: () => void }) {
  return (
    <header className="hero">
      <MoleculeCanvas />
      <div className="wrap">
        <div className="h-copy">
          <span className="pill"><b>Cohort 01</b><span className="live"></span> Now accepting creators</span>
          <h1>Content with <span className="serif grad">research-grade</span> standards.</h1>
          <p className="lead">The CANLAB Creator Academy trains micro-creators to post about high-purity research compounds the right way, then rewards them with member pricing that grows with every order they drive.</p>
          <div className="cta">
            <button className="btn solid" id="hero-apply" onClick={onApply}>
              Apply to the Academy <Icon id="arrow" className="i arrow" />
            </button>
            <button className="btn" id="hero-tour" onClick={onTour}>
              <Icon id="play" /> Tour the portal
            </button>
          </div>
          <div className="proof">
            <div className="faces">
              <span style={{ background: '#8CC8FF' }}>MR</span>
              <span style={{ background: '#A58BFF' }}>DO</span>
              <span style={{ background: '#CFE3EE' }}>SW</span>
              <span style={{ background: '#6FE0A8' }}>LB</span>
            </div>
            <span><b>46 creators</b> drove <b>$61.8k</b> in orders last month</span>
          </div>
        </div>
        <div className="stage" aria-hidden="true">
          <div className="phone">
            <div className="screen">
              <div className="footage"></div>
              <svg className="vial" viewBox="0 0 74 170">
                <defs>
                  <linearGradient id="gl" x1="0" x2="1">
                    <stop offset="0" stopColor="#fff" stopOpacity=".5" />
                    <stop offset=".4" stopColor="#fff" stopOpacity=".12" />
                    <stop offset="1" stopColor="#fff" stopOpacity=".35" />
                  </linearGradient>
                  <linearGradient id="lq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#CFE9FF" />
                    <stop offset="1" stopColor="#8CC8FF" />
                  </linearGradient>
                </defs>
                <rect x="20" y="0" width="34" height="22" rx="4" fill="#1B2430" />
                <rect x="14" y="22" width="46" height="144" rx="10" fill="url(#gl)" stroke="rgba(255,255,255,.5)" />
                <rect x="18" y="92" width="38" height="70" rx="7" fill="url(#lq)" opacity=".85" />
                <rect x="14" y="44" width="46" height="34" fill="#EAF1F4" />
                <text x="37" y="58" textAnchor="middle" fontFamily="monospace" fontSize="7" fill="#06080A" fontWeight="700">CANLAB</text>
                <text x="37" y="70" textAnchor="middle" fontFamily="monospace" fontSize="5.5" fill="#06080A">99.4% · HPLC</text>
              </svg>
              <div className="notch"></div>
              <div className="hookline">What 99% purity actually looks like on paper</div>
              <div className="rail">
                <span><Icon id="heart" className="i" strokeWidth={1.8} />12.4k</span>
                <span><Icon id="chat" className="i" strokeWidth={1.8} />318</span>
                <span><Icon id="share" className="i" strokeWidth={1.8} />904</span>
              </div>
              <div className="ovl">
                <div className="who"><i></i>@maya.benchside</div>
                <p>Reading a real COA, line by line. HPLC + mass-spec verified.</p>
                <span className="tagline">FOR RESEARCH USE ONLY · #AD</span>
              </div>
              <div className="progressbar"><i></i></div>
            </div>
          </div>
          <div className="chip c1"><span className="ic" style={{ background: 'rgba(111,224,168,.14)', color: 'var(--good)' }}><Icon id="shield" /></span><span><b>Compliance passed</b><small>5/5 · certified</small></span></div>
          <div className="chip c2"><span className="ic" style={{ background: 'rgba(140,200,255,.14)', color: 'var(--ice)' }}><Icon id="wallet" /></span><span><b>25% member rate</b><small>Unlocked · Pro tier</small></span></div>
          <div className="chip c3"><span className="ic" style={{ background: 'rgba(165,139,255,.16)', color: 'var(--violet)' }}><Icon id="trend" /></span><span><b>37 orders</b><small>This month · Pro tier</small></span></div>
        </div>
      </div>
    </header>
  );
}
