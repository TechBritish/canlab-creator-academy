import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { AGREEMENT_SECTIONS, AGREEMENT_VERSION } from '../lib/agreement';

type Signed = { signed_at: string; legal_name: string; signature_name: string; agreement_version: string };

export default function Agreement() {
  const { user, profile } = useAuth();
  const [signed, setSigned] = useState<Signed | null | undefined>(undefined);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [invalid, setInvalid] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const stateRef = useRef<HTMLInputElement>(null);
  const handlesRef = useRef<HTMLInputElement>(null);
  const follRef = useRef<HTMLInputElement>(null);
  const sigRef = useRef<HTMLInputElement>(null);
  const eligRef = useRef<HTMLInputElement>(null);
  const termsRef = useRef<HTMLInputElement>(null);
  const today = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    if (!user) return;
    supabase
      .from('partner_agreements')
      .select('signed_at, legal_name, signature_name, agreement_version')
      .eq('user_id', user.id)
      .order('signed_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setSigned((data as Signed | null) ?? null));
  }, [user]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvalid(null);
    const fields = [
      ['name', nameRef.current!, 'Enter your full legal name.'],
      ['email', emailRef.current!, 'Enter a valid email address.'],
      ['state', stateRef.current!, 'Enter your US state.'],
      ['handles', handlesRef.current!, 'Add your social handle(s).'],
      ['followers', follRef.current!, 'Add your follower count on your main platform.'],
      ['signature', sigRef.current!, 'Type your full legal name to sign.'],
    ] as const;
    for (const [key, el, text] of fields) {
      const v = el.value.trim();
      const bad = key === 'email' ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) : !v;
      if (bad) {
        setInvalid(key);
        setMsg({ type: 'err', text });
        el.focus();
        return;
      }
    }
    if (sigRef.current!.value.trim().toLowerCase() !== nameRef.current!.value.trim().toLowerCase()) {
      setInvalid('signature');
      setMsg({ type: 'err', text: 'Your signature must match your full legal name exactly.' });
      sigRef.current!.focus();
      return;
    }
    if (!eligRef.current!.checked || !termsRef.current!.checked) {
      setMsg({ type: 'err', text: 'Tick both boxes to sign the agreement.' });
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase
      .from('partner_agreements')
      .insert({
        user_id: user!.id,
        agreement_version: AGREEMENT_VERSION,
        legal_name: nameRef.current!.value.trim(),
        email: emailRef.current!.value.trim(),
        country_state: `United States · ${stateRef.current!.value.trim()}`,
        handles: handlesRef.current!.value.trim(),
        follower_count: follRef.current!.value.trim(),
        compensation_option: 'Product Partner',
        signature_name: sigRef.current!.value.trim(),
        confirmed_eligibility: true,
        agreed_terms: true,
        user_agent: navigator.userAgent.slice(0, 300),
      })
      .select('id, signed_at, legal_name, signature_name, agreement_version')
      .single();
    setSubmitting(false);
    if (error || !data) {
      setMsg({ type: 'err', text: error?.message ?? 'Could not save your signature. Try again.' });
      return;
    }
    // Let Canlab know by email. Never blocks the creator if email isn't set up.
    supabase.functions.invoke('agreement-notify', { body: { id: data.id } }).catch(() => {});
    setSigned(data as Signed);
    setMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="s" id="agreement" style={{ paddingTop: 120 }}>
      <div className="wrap" style={{ maxWidth: 880 }}>
        <div className="head">
          <span className="label">Partner Agreement</span>
          <h2>Micro-Influencer <span className="serif">Partner Agreement.</span></h2>
          <p>Canlab Group · Product Partner enrollment · Version {AGREEMENT_VERSION}. Draft pending legal review; Canlab will countersign once your application is approved.</p>
        </div>

        {signed === undefined && <p className="muted">Loading…</p>}

        {signed && (
          <div className="glass" style={{ padding: 28, marginBottom: 28 }}>
            <span className="st good">Signed</span>
            <h3 style={{ marginTop: 14 }}>Thanks, {signed.legal_name}. Your agreement is signed.</h3>
            <p className="muted" style={{ marginTop: 8 }}>
              Signed electronically as "{signed.signature_name}" on{' '}
              {new Date(signed.signed_at).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })} (version {signed.agreement_version}).
            </p>
            <p className="muted" style={{ marginTop: 8 }}>
              Next: Canlab will email you a secure W-9 and payout request. Once that's done and your application is approved, you get your referral link, code and content kit.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
              {profile?.role === 'creator' && <Link className="btn solid" to="/portal">Go to the portal <Icon id="arrow" className="i arrow" /></Link>}
              <button className="btn" onClick={() => window.print()}>Print a copy</button>
            </div>
          </div>
        )}

        <div className="card" style={{ marginBottom: 28 }}>
          <h3>At a glance</h3>
          <ul className="muted" style={{ marginTop: 10, paddingLeft: 18, display: 'grid', gap: 6, fontSize: 14.5 }}>
            <li>Commission on monthly eligible net sales: under $10k none (product at 60% off), $10k+ 10%, $50k+ 15%, $150k+ 20%, applied to the whole month.</li>
            <li>4 posts + 2 reels a week (reels supplied). No monthly fee.</li>
            <li>Paid on the 30th after a 30-day refund hold. Balances under $75 roll over. W-9 required before first payout.</li>
            <li>Clear #ad disclosure on every post. No treatment, dosing or health-result claims.</li>
            <li>3-month initial term, then month to month. 14 days' notice to end.</li>
          </ul>
        </div>

        <div className="faq" style={{ marginBottom: 28 }}>
          {AGREEMENT_SECTIONS.map((s) => (
            <details key={s.h}>
              <summary>{s.h} <Icon id="plus" /></summary>
              {s.p.map((t, i) => <p key={i}>{t}</p>)}
            </details>
          ))}
        </div>

        {signed === null && (
          <form className="glass" id="agreementForm" noValidate onSubmit={onSubmit}>
            <h3 style={{ marginBottom: 6 }}>Sign online</h3>
            <p className="muted" style={{ fontSize: 14, marginBottom: 16 }}>Effective date: {today}. Do not enter your SSN or bank details here; we collect those through a separate secure request.</p>
            <div className="row2">
              <div className="field"><label htmlFor="g-name">Full legal name</label><input id="g-name" ref={nameRef} defaultValue={profile?.full_name ?? ''} autoComplete="name" aria-invalid={invalid === 'name' || undefined} /></div>
              <div className="field"><label htmlFor="g-email">Email</label><input id="g-email" ref={emailRef} type="email" defaultValue={profile?.email ?? user?.email ?? ''} autoComplete="email" aria-invalid={invalid === 'email' || undefined} /></div>
            </div>
            <div className="row2">
              <div className="field"><label htmlFor="g-state">US state</label><input id="g-state" ref={stateRef} placeholder="Florida" autoComplete="address-level1" aria-invalid={invalid === 'state' || undefined} /></div>
              <div className="field"><label htmlFor="g-foll">Follower count (main platform)</label><input id="g-foll" ref={follRef} inputMode="numeric" placeholder="1,850" aria-invalid={invalid === 'followers' || undefined} /></div>
            </div>
            <div className="field"><label htmlFor="g-handles">Primary social handle(s)</label><input id="g-handles" ref={handlesRef} defaultValue={profile?.handle ?? ''} placeholder="@jordanlabnotes (TikTok), @jordan.lab (Instagram)" aria-invalid={invalid === 'handles' || undefined} /></div>
            <div className="field"><label htmlFor="g-option">Compensation option</label><input id="g-option" value="Product Partner (default enrollment)" readOnly /></div>
            <div className="field"><label htmlFor="g-sig">Type your full legal name to sign</label><input id="g-sig" ref={sigRef} autoComplete="off" style={{ fontFamily: 'var(--serif, Georgia, serif)', fontStyle: 'italic', fontSize: 20 }} aria-invalid={invalid === 'signature' || undefined} /></div>
            <label className="check"><input type="checkbox" ref={eligRef} /> I am 18 or older, live in the United States, control the accounts listed, and have 500–3,500 genuine followers on my main platform.</label>
            <label className="check"><input type="checkbox" ref={termsRef} /> I have read and agree to the Micro-Influencer Partner Agreement above, and I agree to sign it electronically.</label>
            <button className="btn solid" type="submit" disabled={submitting} style={{ width: '100%' }}>{submitting ? 'Signing…' : 'Sign agreement'} <Icon id="arrow" className="i arrow" /></button>
            {msg && <div className={`msg ${msg.type}`} role="status" aria-live="polite">{msg.text}</div>}
          </form>
        )}
      </div>
    </main>
  );
}
