import Icon from '../Icon';

const DO = [
  'Say "for laboratory and research use only" on every post',
  'Disclose your link with #ad or "affiliate link"',
  'Talk purity, testing, COAs, packaging and shipping speed',
  'Answer dosing questions with "I can\'t advise on that"',
];
const DONT = [
  'Suggest human or animal use, doses or protocols',
  'Claim health, weight-loss, muscle or anti-ageing results',
  'Post before-and-after or injection footage',
  'Target anyone under 21',
];

export default function StandardSection() {
  return (
    <section className="s" id="standard" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="head">
          <span className="label">The standard</span>
          <h2>Research use only. <span className="serif">Every post, every time.</span></h2>
          <p>CANLAB supplies compounds for laboratory research. That shapes what creators can say, and the Academy makes it second nature.</p>
        </div>
        <div className="standard">
          <div className="col do">
            <h3><Icon id="check" strokeWidth={2.2} /> Always</h3>
            <ul>{DO.map((t) => <li key={t}><Icon id="check" strokeWidth={2.2} />{t}</li>)}</ul>
          </div>
          <div className="col dont">
            <h3><Icon id="x" strokeWidth={2.2} /> Never</h3>
            <ul>{DONT.map((t) => <li key={t}><Icon id="x" strokeWidth={2.2} />{t}</li>)}</ul>
          </div>
        </div>
        <div className="ruo">
          <span><b>CANLAB International</b> · 99%+ purity · HPLC and mass-spec verified · North-American made</span>
          <span>COA available on request</span>
        </div>
      </div>
    </section>
  );
}
