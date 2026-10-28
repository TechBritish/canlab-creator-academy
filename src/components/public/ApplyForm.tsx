import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../Icon';
import { supabase } from '../../lib/supabaseClient';

const FAQ = [
  { q: 'Who is this for?', a: 'US-based creators aged 18+ with 500 to 3,500 genuine followers who post about science, labs, biotech or product reviews.' },
  { q: 'Does it cost anything?', a: 'No. There is no monthly fee. Training, reels, clips and the community are free for accepted creators.' },
  { q: 'How does commission work?', a: 'It is based on your monthly eligible net sales. Under $10k: no commission, but product at 60% off. $10k–$49,999: 10%. $50k–$149,999: 15%. $150k+: 20%. Once you hit a tier it applies to the whole month.' },
  { q: 'How and when am I paid?', a: 'Monthly, on the 30th, after a 30-day refund hold. Balances under $75 roll over. You sign the Partner Agreement online and complete a W-9 and payout details securely before your first payout.' },
  { q: 'What do I post?', a: '4 posts and 2 reels a week. The reels are supplied by the Academy. If we send you a promo package, start with an unboxing post, then regular progress updates.' },
  { q: 'Do I have to use the clip library?', a: 'No. You can film your own content. Every post goes through the same compliance review.' },
];

export default function ApplyForm() {
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [invalid, setInvalid] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const handleRef = useRef<HTMLInputElement>(null);
  const platRef = useRef<HTMLSelectElement>(null);
  const follRef = useRef<HTMLSelectElement>(null);
  const nicheRef = useRef<HTMLTextAreaElement>(null);
  const ageRef = useRef<HTMLInputElement>(null);
  const ruoRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvalid(null);
    const nm = nameRef.current!, em = emailRef.current!, hd = handleRef.current!, pw = passRef.current!;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim());
    const bad = !nm.value.trim() ? 'name' : !emailOk ? 'email' : !hd.value.trim() ? 'handle' : pw.value.length < 6 ? 'password' : null;
    if (bad) {
      setInvalid(bad);
      setMsg({
        type: 'err',
        text:
          bad === 'email' ? 'Enter a valid email address so we can send your portal invite.' :
          bad === 'name' ? 'Enter your full name.' :
          bad === 'password' ? 'Choose a password with at least 6 characters.' :
          'Add your handle or profile link.',
      });
      (bad === 'name' ? nm : bad === 'email' ? em : bad === 'password' ? pw : hd).focus();
      return;
    }
    if (!ageRef.current!.checked || !ruoRef.current!.checked) {
      setMsg({ type: 'err', text: 'Tick both boxes to apply. Agreeing to the content rules is a condition of joining.' });
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({ email: em.value.trim(), password: pw.value });
    if (error || !data.user) {
      setSubmitting(false);
      setMsg({ type: 'err', text: error?.message ?? 'Could not create your account. Try again.' });
      return;
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      email: em.value.trim(),
      full_name: nm.value.trim(),
      handle: hd.value.trim(),
      platform: platRef.current?.value ?? null,
      followers: follRef.current?.value ?? null,
      niche: nicheRef.current?.value ?? null,
    });

    setSubmitting(false);
    if (profileError) {
      setMsg({ type: 'err', text: profileError.message });
      return;
    }

    if (!data.session) {
      setMsg({ type: 'ok', text: 'Application received. Check your email to confirm your address, then log in to sign your Partner Agreement.' });
      return;
    }
    setMsg({ type: 'ok', text: 'Application received. Next: sign your Partner Agreement…' });
    setTimeout(() => navigate('/agreement'), 1200);
  };

  return (
    <section className="s" id="apply" style={{ paddingTop: 0 }}>
      <div className="wrap apply">
        <div>
          <div className="head">
            <span className="label">Apply</span>
            <h2>Join <span className="serif">Cohort 01.</span></h2>
            <p>We review every application within 48 hours. Approved creators get portal access and start Module 1 the same day.</p>
          </div>
          <div className="faq">
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q} <Icon id="plus" /></summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
        <form className="glass" id="applyForm" noValidate onSubmit={onSubmit}>
          <div className="row2">
            <div className="field"><label htmlFor="a-name">Full name</label><input id="a-name" ref={nameRef} placeholder="Jordan Ellis" autoComplete="name" aria-invalid={invalid === 'name' || undefined} /></div>
            <div className="field"><label htmlFor="a-email">Email</label><input id="a-email" ref={emailRef} type="email" placeholder="jordan@example.com" autoComplete="email" aria-invalid={invalid === 'email' || undefined} /></div>
          </div>
          <div className="field"><label htmlFor="a-pass">Password</label><input id="a-pass" ref={passRef} type="password" autoComplete="new-password" aria-invalid={invalid === 'password' || undefined} /></div>
          <div className="row2">
            <div className="field"><label htmlFor="a-plat">Main platform</label><select id="a-plat" ref={platRef} defaultValue=""><option value="" disabled>Select platform</option><option>TikTok</option><option>Instagram</option><option>YouTube Shorts</option><option>X</option><option>LinkedIn</option><option>Facebook</option></select></div>
            <div className="field"><label htmlFor="a-foll">Followers</label><select id="a-foll" ref={follRef} defaultValue=""><option value="" disabled>Select range</option><option>500–1,000</option><option>1,000–2,000</option><option>2,000–3,500</option></select></div>
          </div>
          <div className="field"><label htmlFor="a-handle">Handle or profile link</label><input id="a-handle" ref={handleRef} placeholder="@jordanlabnotes" aria-invalid={invalid === 'handle' || undefined} /></div>
          <div className="field"><label htmlFor="a-niche">What do you post about?</label><textarea id="a-niche" ref={nicheRef} placeholder="Lab life, biotech explainers and science news." /></div>
          <label className="check"><input type="checkbox" id="a-age" ref={ageRef} /> I am 18 or older and live in the United States.</label>
          <label className="check"><input type="checkbox" id="a-ruo" ref={ruoRef} /> I have read and will follow the CANLAB content rules.</label>
          <button className="btn solid" type="submit" id="a-submit" disabled={submitting} style={{ width: '100%' }}>{submitting ? 'Submitting…' : 'Submit application'} <Icon id="arrow" className="i arrow" /></button>
          {msg && <div id="applyMsg" className={`msg ${msg.type}`} role="status" aria-live="polite">{msg.text}</div>}
        </form>
      </div>
    </section>
  );
}
