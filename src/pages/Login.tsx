import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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

    const { data: profileRow } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    await refreshProfile();
    setLoading(false);
    navigate(profileRow?.role === 'admin' ? '/admin' : '/portal', { replace: true });
  };

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
          <span className="label">Welcome back</span>
          <h2>
            Log in <span className="serif">to the portal.</span>
          </h2>
        </div>
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
        <p className="muted" style={{ marginTop: 18, fontSize: 14 }}>
          Not a creator yet? <Link to="/#apply">Apply here</Link>.
        </p>
      </div>
    </section>
  );
}
