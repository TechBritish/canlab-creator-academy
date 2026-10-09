import Icon from '../Icon';
import Wave from '../Wave';

export default function BentoSection() {
  return (
    <section className="s" id="inside" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="head">
          <span className="label">Inside the portal</span>
          <h2>Everything a creator needs, <span className="serif">in one place.</span></h2>
        </div>
        <div className="bento">
          <div className="tile t-acad">
            <span className="ico"><Icon id="cap" strokeWidth={1.8} /></span>
            <h3>The Academy</h3>
            <p>Short lessons with a clear finish line. Progress saves as you go.</p>
            <div className="lessons">
              <div className="lrow done"><span className="dot"><Icon id="check" className="i" style={{ width: 13, height: 13 }} strokeWidth={3} /></span><span>Purity, HPLC and mass-spec in plain English</span><span className="t">5:40</span></div>
              <div className="lrow now"><span className="dot" /><span>Words and claims you can never use</span><span className="t">6:15</span></div>
              <div className="lrow"><span className="dot" /><span>Hooks that stop the scroll in 2 seconds</span><span className="t">6:45</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--slate)', marginTop: 6 }}><span>Maya's progress</span><span className="num">6 of 14</span></div>
              <div className="bar"><i style={{ width: '43%' }} /></div>
            </div>
          </div>
          <div className="tile t-clip">
            <span className="ico"><Icon id="film" strokeWidth={1.8} /></span>
            <h3>Clip library</h3>
            <p>Pre-approved footage, hooks and captions every week.</p>
            <div className="reels">
              <div className="reel" style={{ background: 'linear-gradient(160deg,#1B4A6B,#0B1B2A)' }}><span>99% purity on paper</span></div>
              <div className="reel" style={{ background: 'linear-gradient(160deg,#3A2E6B,#140F26)' }}><span>Same-day unboxing</span></div>
              <div className="reel" style={{ background: 'linear-gradient(160deg,#17504A,#0A1C1A)' }}><span>3 myths, busted</span></div>
            </div>
          </div>
          <div className="tile t-earn">
            <span className="label">Member rate</span>
            <div className="big">25% off</div>
            <p style={{ fontSize: 13.5 }}>Pro tier · 14 orders to Elite</p>
            <div className="spark">
              <svg viewBox="0 0 200 70" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#8CC8FF" stopOpacity=".35" />
                    <stop offset="1" stopColor="#8CC8FF" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 60 L25 55 L50 57 L75 44 L100 46 L125 32 L150 34 L175 18 L200 10 L200 70 L0 70Z" fill="url(#sf)" />
                <path d="M0 60 L25 55 L50 57 L75 44 L100 46 L125 32 L150 34 L175 18 L200 10" fill="none" stroke="#8CC8FF" strokeWidth={2} vectorEffect="non-scaling-stroke" />
                <circle cx="198" cy="10" r="3.5" fill="#EAF1F4" />
              </svg>
            </div>
          </div>
          <div className="tile t-coach">
            <span className="ico"><Icon id="mic" strokeWidth={1.8} /></span>
            <h3>AI voice coach</h3>
            <p>Practise tricky comments out loud before they happen.</p>
            <Wave id="bentoWave" />
          </div>
          <div className="tile t-shield">
            <span className="ico" style={{ background: 'rgba(111,224,168,.1)', color: 'var(--good)' }}><Icon id="shield" strokeWidth={1.8} /></span>
            <h3>Reviewed before it counts</h3>
            <p>Every post gets a compliance check. Clean posts count toward your tier.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
