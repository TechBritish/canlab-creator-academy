import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError || !data.user) {
      setLoading(false);
      setError(signInError?.message ?? 'Could not log in. Check your details and try again.');
      return;
    }

    const profile = await refreshProfile(data.user.id);
    if (profile?.role === 'admin') {
      setLoading(false);
      navigate('/admin', { replace: true });
      return;
    }
    // Creators who haven't signed the Partner Agreement yet go there first.
    const { data: agreement } = await supabase.from('partner_agreements').select('id').eq('user_id', data.user.id).limit(1).maybeSingle();
    setLoading(false);
    navigate(agreement ? '/portal' : '/agreement', { replace: true });
  };

  const onForgot = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Enter the email address you signed up with.');
      return;
    }
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    // Same message whether or not the account exists, so this form can't be used to check emails.
    setResetSent(true);
  };

  const switchMode = (next: 'login' | 'forgot') => {
    setMode(next);
    setError(null);
    setResetSent(false);
  };

  const isForgot = mode === 'forgot';

  return (
    <section
      className="s"
      style={{
        minHeight: 'calc(100svh - 69px)',
        display: 'flex',
        alignItems: 'center',
        paddingBlock: 48,
      }}
    >
      <div className="wrap" style={{ maxWidth: 440 }}>
        <div className="head" style={{ marginBottom: 28 }}>
          <span className="label">{isForgot ? 'Reset password' : 'Welcome back'}</span>
          <h2>
            {isForgot ? (
              <>
                Get a <span className="serif">reset link.</span>
              </>
            ) : (
              <>
                Log in <span className="serif">to the portal.</span>
              </>
            )}
          </h2>
        </div>

        {isForgot ? (
          <form className="glass" onSubmit={onForgot} noValidate>
            <div className="field">
              <label htmlFor="f-email">Email</label>
              <input
                id="f-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <button className="btn solid" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
            {resetSent && (
              <div className="msg ok" role="status">
                If an account exists for that email, a reset link is on its way. Check your inbox and spam folder.
              </div>
            )}
            {error && (
              <div className="msg err" role="alert">
                {error}
              </div>
            )}
          </form>
        ) : (
          <form className="glass" onSubmit={onSubmit} noValidate>
            <div className="field">
              <label htmlFor="l-email">Email</label>
              <input
                id="l-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="field">
              <label htmlFor="l-pass">Password</label>
              <input
                id="l-pass"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="muted"
                onClick={() => switchMode('forgot')}
                style={{ justifySelf: 'end', background: 'none', border: 0, padding: 0, fontSize: 14, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Forgot password?
              </button>
            </div>
            <button className="btn solid" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Logging in…' : 'Log in'}
            </button>
            {error && (
              <div className="msg err" role="alert">
                {error}
              </div>
            )}
          </form>
        )}

        <p className="muted" style={{ marginTop: 18, fontSize: 14 }}>
          {isForgot ? (
            <button
              type="button"
              onClick={() => switchMode('login')}
              style={{ background: 'none', border: 0, padding: 0, color: 'inherit', font: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Back to log in
            </button>
          ) : (
            <>
              Not a creator yet? <Link to="/#apply">Apply here</Link>.
            </>
          )}
        </p>
      </div>
    </section>
  );
}
