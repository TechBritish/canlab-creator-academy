import { useToast } from '../../context/ToastContext';
import Icon from '../Icon';
import Wave from '../Wave';

const CHANNELS = [
  { h: '#announcements', d: 'Clip drops and rule updates' },
  { h: '#wins', d: 'Post your best numbers' },
  { h: '#hooks-lab', d: 'Test hooks before posting' },
  { h: '#compliance-help', d: '"Can I say this?" answered fast' },
];

export default function Community({
  isCallActive = false,
  onStartCall,
}: {
  /** Whether the shared voice agent (bottom-right mic) currently has a live call. */
  isCallActive?: boolean;
  /** Opens the voice agent panel and starts a real Vapi call. */
  onStartCall?: () => void;
}) {
  const toast = useToast();

  const note = isCallActive
    ? 'Coach: "Hi Maya. Want to practise handling a dosing question in the comments?"'
    : 'Tap to start a live voice session with your AI coach.';

  return (
    <section data-panel="comm">
      <div className="ph">
        <div>
          <span className="label">Community</span>
          <h2 style={{ marginTop: 8 }}>Community and coach</h2>
        </div>
      </div>
      <div className="grid g2">
        <div className="card">
          <h3>Slack community</h3>
          <p className="muted" style={{ marginTop: 4 }}>Share wins, get briefs first, ask anything.</p>
          <div style={{ marginTop: 14 }}>
            {CHANNELS.map((c) => (
              <div className="chan" key={c.h}>
                <span className="h">{c.h}</span>
                <span className="muted">{c.d}</span>
              </div>
            ))}
          </div>
          <button className="btn sm" style={{ marginTop: 16 }} onClick={() => toast('Opens the creator Slack in the live build')}>
            Open Slack
          </button>
        </div>
        <div
          className="card"
          style={{ background: 'radial-gradient(90% 80% at 100% 0%,rgba(140,200,255,.12),transparent 60%),var(--graphite)' }}
        >
          <span className="label" style={{ color: 'var(--ice)' }}>AI voice coach</span>
          <h3 style={{ marginTop: 8, fontSize: 24 }}>Practise before you post</h3>
          <p className="muted" style={{ marginTop: 8 }}>
            A voice agent that role-plays tricky comments, checks your script against the rules and answers product questions any time.
          </p>
          <Wave style={{ marginBlock: 22 }} />
          <button
            className={`btn ${isCallActive ? '' : 'solid'}`}
            onClick={() => {
              if (isCallActive) {
                toast('Use the voice panel in the corner to end the call.');
                return;
              }
              onStartCall?.();
            }}
          >
            <Icon id="mic" strokeWidth={1.8} />
            {isCallActive ? 'Call in progress' : 'Start a practice call'}
          </button>
          <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>{note}</p>
        </div>
      </div>
    </section>
  );
}
