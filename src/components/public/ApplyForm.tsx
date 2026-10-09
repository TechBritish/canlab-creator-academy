import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../Icon';
import { supabase } from '../../lib/supabaseClient';

const FAQ = [
  { q: 'Who is this for?', a: 'Creators aged 21+ with 1k to 100k followers who post about science, labs, biotech or product reviews.' },
  { q: 'Does it cost anything?', a: 'No. Training, clips and the community are free for accepted creators.' },
  { q: 'What do I get?', a: 'A member discount on your own CANLAB orders. The more orders your link drives, the bigger it gets. Your tier updates on the 1st of each month.' },
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
      setMsg({ type: 'err', text: 'Tick both boxes to apply. Agreeing to the research-use-only rule is a condition of joining.' });
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

    setMsg({ type: 'ok', text: 'Application received. Redirecting you to the portal…' });
    setTimeout(() => navigate('/portal'), 1200);
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
            <div className="field"><label htmlFor="a-plat">Main platform</label><select id="a-plat" ref={platRef} defaultValue=""><option value="" disabled>Select platform</option><option>TikTok</option><option>Instagram</option><option>YouTube Shorts</option><option>X</option></select></div>
            <div className="field"><label htmlFor="a-foll">Followers</label><select id="a-foll" ref={follRef} defaultValue=""><option value="" disabled>Select range</option><option>1k–10k</option><option>10k–50k</option><option>50k–100k</option></select></div>
          </div>
          <div className="field"><label htmlFor="a-handle">Handle or profile link</label><input id="a-handle" ref={handleRef} placeholder="@jordanlabnotes" aria-invalid={invalid === 'handle' || undefined} /></div>
          <div className="field"><label htmlFor="a-niche">What do you post about?</label><textarea id="a-niche" ref={nicheRef} placeholder="Lab life, biotech explainers and science news." /></div>
          <label className="check"><input type="checkbox" id="a-age" ref={ageRef} /> I am 21 or older.</label>
          <label className="check"><input type="checkbox" id="a-ruo" ref={ruoRef} /> I understand CANLAB products are for research use only and I will follow the content rules.</label>
          <button className="btn solid" type="submit" id="a-submit" disabled={submitting} style={{ width: '100%' }}>{submitting ? 'Submitting…' : 'Submit application'} <Icon id="arrow" className="i arrow" /></button>
          {msg && <div id="applyMsg" className={`msg ${msg.type}`} role="status" aria-live="polite">{msg.text}</div>}
        </form>
      </div>
    </section>
  );
}
