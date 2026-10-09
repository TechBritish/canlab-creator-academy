import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Nav() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const close = () => setOpen(false);

  const goto = (id: string) => {
    close();
    navigate('/');
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  return (
    <nav className={`top${open ? ' open' : ''}`} aria-label="Main">
      <div className="wrap">
        <Link className="brand" to="/" onClick={close}>
          <svg className="mark" viewBox="0 0 28 28" aria-hidden="true">
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#EAF1F4" />
                <stop offset=".5" stopColor="#8CC8FF" />
                <stop offset="1" stopColor="#A58BFF" />
              </linearGradient>
            </defs>
            <g fill="none" stroke="url(#lg)" strokeWidth="1.6">
              <path d="M14 3 23.5 8.5v11L14 25 4.5 19.5v-11z" />
              <circle cx="14" cy="14" r="3.2" />
              <path d="M14 3v7.8M23.5 19.5l-6.7-3.9M4.5 19.5l6.7-3.9" />
            </g>
          </svg>
          CANLAB <small>Creator Academy</small>
        </Link>
        <div className="navlinks">
          <a href="#how" onClick={(e) => { e.preventDefault(); goto('how'); }}>How it works</a>
          <a href="#inside" onClick={(e) => { e.preventDefault(); goto('inside'); }}>The portal</a>
          <a href="#earn" onClick={(e) => { e.preventDefault(); goto('earn'); }}>Rewards</a>
          <a href="#standard" onClick={(e) => { e.preventDefault(); goto('standard'); }}>The standard</a>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link className="btn sm" to="/login" id="h-login">Log in</Link>
          <button className="btn sm solid" id="h-apply" onClick={() => goto('apply')}>Apply</button>
          <button
            className="menu-btn"
            id="menuBtn"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mnav"
            onClick={() => setOpen((o) => !o)}
          >
            <svg className="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>
      <div className="mnav" id="mnav">
        <a href="#how" onClick={(e) => { e.preventDefault(); goto('how'); }}>How it works</a>
        <a href="#inside" onClick={(e) => { e.preventDefault(); goto('inside'); }}>The portal</a>
        <a href="#earn" onClick={(e) => { e.preventDefault(); goto('earn'); }}>Rewards</a>
        <a href="#standard" onClick={(e) => { e.preventDefault(); goto('standard'); }}>The standard</a>
        <Link to="/login" onClick={close}>Log in to the portal</Link>
      </div>
    </nav>
  );
}
