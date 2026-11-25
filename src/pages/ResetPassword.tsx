import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

type Status = 'checking' | 'ready' | 'expired' | 'done';

export default function ResetPassword() {
  const [status, setStatus] = useState<Status>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // The emailed link carries a one-time token in the URL; supabase-js turns it into a session.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setStatus((s) => (s === 'done' ? s : 'ready'));
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStatus((s) => (s === 'done' ? s : 'ready'));
    });
    const timer = window.setTimeout(() => {
      setStatus((s) => (s === 'checking' ? 'expired' : s));
    }, 15000);
    return () => {
      sub.subscription.unsubscribe();
      window.clearTimeout(timer);
    };
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }
    // Sign out so the creator logs in fresh with the new password.
    await supabase.auth.signOut();
    setLoading(false);
    setStatus('done');
  };

  return (
    <section
      className="s"
      style={{ minHeight: 'calc(100svh - 69px)', display: 'flex', alignItems: 'center', paddingBlock: 48 }}
    >
      <div className="wrap" style={{ maxWidth: 440 }}>
        <div className="head" style={{ marginBottom: 28 }}>
          <span className="label">Reset password</span>
          <h2>
            Choose a <span className="serif">new password.</span>
          </h2>
        </div>

        {status === 'checking' && <p className="muted">Checking your reset link…</p>}

        {status === 'expired' && (
          <div className="glass" style={{ display: 'grid', gap: 16 }}>
            <div className="msg err" role="alert">
              This reset link has expired or has already been used.
            </div>
            <Link className="btn solid" to="/login" style={{ width: '100%' }}>
              Request a new link
            </Link>
          </div>
        )}

        {status === 'ready' && (
          <form className="glass" onSubmit={onSubmit} noValidate>
            <div className="field">
              <label htmlFor="r-pass">New password</label>
              <input
                id="r-pass"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="field">
              <label htmlFor="r-confirm">Confirm new password</label>
              <input
                id="r-confirm"
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <button className="btn solid" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Saving…' : 'Save new password'}
            </button>
            {error && (
              <div className="msg err" role="alert">
                {error}
              </div>
            )}
          </form>
        )}

        {status === 'done' && (
          <div className="glass" style={{ display: 'grid', gap: 16 }}>
            <div className="msg ok" role="status">
              Your password has been changed. Log in with the new password.
            </div>
            <Link className="btn solid" to="/login" style={{ width: '100%' }}>
              Go to log in
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
