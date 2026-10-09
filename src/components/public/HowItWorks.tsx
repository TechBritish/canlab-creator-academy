import { useEffect, useRef } from 'react';

const STEPS = [
  { k: '01', h: 'Apply', p: 'Tell us where you post, what you post about and how big your audience is. We accept creators with 1k to 100k followers.', tags: ['48h review', '21+ only'] },
  { k: '02', h: 'Train', p: 'Five short video modules on the products, the rules and the content formats that convert. Watch on your phone between posts.', tags: ['14 lessons', '~90 minutes'] },
  { k: '03', h: 'Certify', p: 'Pass the compliance check with a perfect score. That unlocks your tracking link, your code and the clip library.', tags: ['5 questions', '100% to pass'] },
  { k: '04', h: 'Create', p: "Pick up a ready-made clip from this week's drop, add your voice and post. Submit the link so it counts toward your tier.", tags: ['Weekly clip drops', 'Caption templates'] },
  { k: '05', h: 'Unlock', p: 'Every order through your link or code is tracked live. Your member discount on CANLAB orders rises as your orders grow.', tags: ['Up to 35% off', 'Tier updates monthly'] },
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
            <h2>From application to <span className="serif">first reward.</span></h2>
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
