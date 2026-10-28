import { useEffect, useRef } from 'react';

const STEPS = [
  { k: '01', h: 'Apply', p: 'Tell us where you post and what you post about. We accept US-based creators aged 18+ with 500 to 3,500 genuine followers.', tags: ['48h review', '18+ · US only'] },
  { k: '02', h: 'Sign & train', p: 'E-sign the Partner Agreement online, then work through five short video modules on the products, the rules and the formats that convert.', tags: ['E-sign online', '14 lessons'] },
  { k: '03', h: 'Certify', p: 'Pass the compliance check with a perfect score. That unlocks your referral link, your discount code and the clip library.', tags: ['5 questions', '100% to pass'] },
  { k: '04', h: 'Create', p: "Post 4 times and share 2 reels a week. The reels come ready-made from the Academy. Got a promo package? Start with an unboxing post.", tags: ['4 posts + 2 reels', 'Reels supplied'] },
  { k: '05', h: 'Earn', p: 'Every sale through your link or code is tracked. Hit $10k in a month and earn 10% on all of it, rising to 15% and 20%. Paid monthly on the 30th.', tags: ['Up to 20% commission', '60% creator discount'] },
];

export default function HowItWorks() {
  const meterRef = useRef<HTMLElement>(null);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    function pathProgress() {
      const vh = innerHeight;
      let on = 0;
      stepRefs.current.forEach((s, i) => {
        if (!s) return;
        const r = s.getBoundingClientRect();
        const act = r.top < vh * 0.6 && r.bottom > vh * 0.3;
        s.classList.toggle('on', act);
        if (r.top < vh * 0.6) on = i + 1;
      });
      if (meterRef.current) meterRef.current.style.width = (on / STEPS.length) * 100 + '%';
    }
    addEventListener('scroll', pathProgress, { passive: true });
    pathProgress();
    return () => removeEventListener('scroll', pathProgress);
  }, []);

  return (
    <section className="s" id="how">
      <div className="wrap path">
        <div className="stick">
          <div className="head">
            <span className="label">How it works</span>
            <h2>From application to <span className="serif">first payout.</span></h2>
            <p>Five stages. Most creators are certified within a week and posting the same day.</p>
          </div>
          <div className="meter"><i ref={meterRef as any} id="meter" /></div>
        </div>
        <div className="stepper">
          {STEPS.map((s, i) => (
            <article className="step" key={s.k} ref={(el) => { stepRefs.current[i] = el; }}>
              <span className="k">{s.k}</span>
              <div>
                <h3>{s.h}</h3>
                <p>{s.p}</p>
                <div className="meta">{s.tags.map((t) => <span className="tag" key={t}>{t}</span>)}</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
