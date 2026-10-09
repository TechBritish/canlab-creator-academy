import Icon from '../Icon';

export default function Closer({ onApply }: { onApply: () => void }) {
  return (
    <>
      <div className="wrap">
        <div className="closer">
          <span className="label">Cohort 01 closes when 50 creators are certified</span>
          <h2 style={{ marginTop: 18 }}>Your audience already trusts you. <span className="serif grad">Get rewarded for it.</span></h2>
          <p>Train once, post with confidence, unlock better pricing with every order.</p>
          <button className="btn solid" id="close-apply" onClick={onApply}>
            Apply to the Academy <Icon id="arrow" className="i arrow" />
          </button>
        </div>
      </div>
      <footer className="site">
        <div className="wrap">
          <span>CANLAB International · 407 Lincoln Rd, Suite 6H, Miami Beach, FL</span>
          <span>All products for laboratory and research use only. Not for human or animal consumption.</span>
        </div>
      </footer>
    </>
  );
}
