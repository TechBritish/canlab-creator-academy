import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Vapi from '@vapi-ai/web';
import './VoiceAgent.css';
import {
  buildSiteKnowledge,
  PUBLIC_SECTIONS,
  VOICE_ROUTES,
  type PortalTab,
  type VoiceRoute,
} from '../../lib/site-knowledge';

// @vapi-ai/web is published as CommonJS. Vite exposes its exports object as
// the default import, with the actual class nested one level deeper.
const VapiConstructor =
  (Vapi as unknown as { default?: typeof Vapi }).default ?? Vapi;

type TranscriptLine = {
  id: number;
  speaker: 'user' | 'assistant';
  text: string;
};

type LiveCaption = Pick<TranscriptLine, 'speaker' | 'text'>;

const WAVE_HEIGHTS = [18, 28, 22, 38, 52, 66, 74, 56, 42, 30, 44, 62, 34, 50, 26, 38, 20];

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainder = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

function getCallErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object') {
    return 'The voice call could not start. Check microphone access and try again.';
  }

  const data = error as {
    name?: string;
    message?: string;
    error?: string | { name?: string; message?: string };
  };
  const nested = typeof data.error === 'object' ? data.error : null;
  const detail = `${data.name ?? nested?.name ?? ''} ${data.message ?? nested?.message ?? (typeof data.error === 'string' ? data.error : '')}`.toLowerCase();

  if (/notallowed|permission|denied/.test(detail)) {
    return 'Microphone access is blocked. Allow microphone access for this site in your browser settings, then try again.';
  }
  if (/notfound|devicesnotfound|no microphone|requested device/.test(detail)) {
    return 'No microphone was found. Connect or select a microphone, then try again.';
  }
  if (/notreadable|trackstart|could not start audio|device.*use/.test(detail)) {
    return 'The microphone is unavailable or being used by another app. Close other recording apps and try again.';
  }
  if (/network|fetch|timeout/.test(detail)) {
    return 'Could not reach the voice service. Check your internet connection and try again.';
  }
  return 'The voice call could not start. Check microphone access and try again.';
}

function MicIcon({ muted = false }: { muted?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2.5" width="6" height="12" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.5M9 21.5h6" />
      {muted && <path d="m4 4 16 16" />}
    </svg>
  );
}

function EndCallIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 14.5c5.2-4.4 11.8-4.4 17 0l-2.3 4a1.5 1.5 0 0 1-1.8.7l-3.1-1.1a1.5 1.5 0 0 1-1-1.4V15.5h-3v1.2a1.5 1.5 0 0 1-1 1.4l-3.1 1.1a1.5 1.5 0 0 1-1.8-.7z" />
      <path d="m4 4 16 16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function flash(el: Element | null) {
  if (!(el instanceof HTMLElement)) return false;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('voice-agent-highlight');
  window.setTimeout(() => el.classList.remove('voice-agent-highlight'), 3500);
  return true;
}

const makeTool = (name: string, description: string, properties: Record<string, unknown> = {}, required: string[] = []) => ({
  type: 'function' as const,
  async: true,
  function: { name, description, parameters: { type: 'object' as const, properties, required } },
});

function buildTools(inPortal: boolean) {
  const tools = [
    makeTool('navigate', 'Go to a top-level page of the site.', {
      page: { type: 'string', enum: Object.keys(VOICE_ROUTES) },
    }, ['page']),
    makeTool('scroll_to', 'Scroll to and highlight a section on the public landing page by id.', {
      id: { type: 'string', enum: Object.values(PUBLIC_SECTIONS) },
    }, ['id']),
    makeTool('end_call', 'End the voice conversation.'),
  ];
  if (inPortal) {
    tools.splice(2, 0, makeTool('switch_tab', 'Switch to a tab inside the creator portal.', {
      tab: { type: 'string', enum: ['dash', 'academy', 'clips', 'subs', 'earn', 'comm'] },
    }, ['tab']));
  }
  return tools;
}

// Floating bottom-right round voice button, same spot as the reference site.
// Keys live in .env as VITE_VAPI_PUBLIC_KEY / VITE_VAPI_ASSISTANT_ID so they
// never need to be hardcoded here.
//
// We talk to @vapi-ai/web directly instead of going through
// @vapi-ai/client-sdk-react, whose published 0.1.1 bundle has a known
// CJS/ESM interop bug under Vite ("import_vapi.default is not a
// constructor" - see VapiAI/client-sdk-web#149). Using the SDK directly
// also gives us full control over styling to match the reference design.
export type VoiceAgentHandle = {
  /** Opens the panel and starts a call, e.g. from a "Start practice call" button elsewhere on the page. */
  startCall: () => void;
};

const VoiceAgent = forwardRef<VoiceAgentHandle, {
  autoStart?: boolean;
  /** Provided by Portal so the agent can switch tabs by voice ("switch_tab" tool). */
  onSwitchTab?: (tab: PortalTab) => void;
  /** Lets a parent (e.g. the Community tab) know whether a call is live, to mirror button state. */
  onCallStateChange?: (active: boolean) => void;
}>(function VoiceAgent({
  autoStart = false,
  onSwitchTab,
  onCallStateChange,
}, ref) {
  const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
  const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID;

  const navigate = useNavigate();
  const location = useLocation();
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;
  const inPortal = location.pathname.startsWith('/portal');
  const onSwitchTabRef = useRef(onSwitchTab);
  onSwitchTabRef.current = onSwitchTab;
  const onCallStateChangeRef = useRef(onCallStateChange);
  onCallStateChangeRef.current = onCallStateChange;

  // Same Vapi assistant everywhere on the site, just with the site map,
  // navigation tools and an up-to-date system prompt layered on top so it
  // always knows where the visitor is and what it can do for them.
  const buildAssistantOverrides = () => ({
    firstMessage: inPortal
      ? "Hi, I'm your CANLAB Academy guide. Want me to take you to a tab or answer something about the program?"
      : "Hey, I'm your CANLAB Creator Academy guide. I can show you around the site or answer questions — what would you like to do?",
    model: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      messages: [{ role: 'system' as const, content: buildSiteKnowledge({ currentPath: pathRef.current, inPortal }) }],
      tools: buildTools(inPortal),
    },
  });

  const vapiRef = useRef<Vapi | null>(null);
  const autoStartedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);
  const transcriptIdRef = useRef(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [localVolumeLevel, setLocalVolumeLevel] = useState(0);
  const [connectionStage, setConnectionStage] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [liveCaption, setLiveCaption] = useState<LiveCaption | null>(null);
  const [callError, setCallError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) return;

    const vapi = new VapiConstructor(publicKey);
    vapiRef.current = vapi;
    setIsReady(true);

    const onCallStart = () => {
      setIsConnecting(false);
      setIsCallActive(true);
      setIsPanelOpen(true);
      setDuration(0);
      setLocalVolumeLevel(0);
      setConnectionStage(null);
      onCallStateChangeRef.current?.(true);
    };
    const onCallEnd = () => {
      setIsConnecting(false);
      setIsCallActive(false);
      setIsMuted(false);
      setIsAssistantSpeaking(false);
      setVolumeLevel(0);
      setLocalVolumeLevel(0);
      setConnectionStage(null);
      setIsPanelOpen(false);
      onCallStateChangeRef.current?.(false);
    };
    const onError = (error: unknown) => {
      console.error('Vapi call error:', error);
      setIsConnecting(false);
      setIsCallActive(false);
      setIsPanelOpen(true);
      setCallError(getCallErrorMessage(error));
    };
    const onMessage = (message: unknown) => {
      if (!message || typeof message !== 'object') return;
      const data = message as {
        type?: string;
        role?: string;
        transcript?: string;
        transcriptType?: string;
      };
      if (data.type !== 'transcript' || typeof data.transcript !== 'string') return;

      const text = data.transcript.trim();
      if (!text) return;
      const speaker = data.role === 'assistant' ? 'assistant' : 'user';

      if (data.transcriptType === 'partial') {
        setLiveCaption({ speaker, text });
        return;
      }

      transcriptIdRef.current += 1;
      setTranscript((current) => [
        ...current.slice(-9),
        { id: transcriptIdRef.current, speaker, text },
      ]);
      setLiveCaption(null);
    };
    const onToolCalls = async (message: unknown) => {
      const data = message as { type?: string; toolCallList?: Array<{ function?: { name?: string; arguments?: unknown } }> };
      if (data.type !== 'tool-calls' || !Array.isArray(data.toolCallList)) return;
      for (const call of data.toolCallList) {
        const name = call.function?.name as string;
        const raw = call.function?.arguments;
        const args = (typeof raw === 'string' ? JSON.parse(raw || '{}') : raw ?? {}) as Record<string, string>;
        let result = `Unknown action ${name}.`;
        try {
          switch (name) {
            case 'navigate': {
              const to = VOICE_ROUTES[args.page as VoiceRoute];
              result = to ? (navigate(to), `Opened ${args.page}.`) : `Unknown page ${args.page}.`;
              break;
            }
            case 'scroll_to': {
              if (pathRef.current !== '/') {
                navigate('/');
                window.setTimeout(() => flash(document.getElementById(args.id ?? '')), 300);
              } else {
                flash(document.getElementById(args.id ?? ''));
              }
              result = `Scrolled to ${args.id}.`;
              break;
            }
            case 'switch_tab': {
              if (onSwitchTabRef.current) {
                onSwitchTabRef.current(args.tab as PortalTab);
                result = `Switched to the ${args.tab} tab.`;
              } else {
                result = 'Tab switching is only available inside the creator portal.';
              }
              break;
            }
            case 'end_call':
              window.setTimeout(() => vapiRef.current?.stop(), 1500);
              result = 'Ending the call.';
              break;
          }
        } catch (err) {
          console.error('Voice agent tool error:', err);
          result = `Could not complete that action.`;
        }
        vapiRef.current?.send({
          type: 'add-message',
          message: { role: 'system', content: `Action result: ${result} User is now on ${pathRef.current}.` },
        });
      }
    };
    const onSpeechStart = () => setIsAssistantSpeaking(true);
    const onSpeechEnd = () => setIsAssistantSpeaking(false);
    const onVolumeLevel = (level: number) => setVolumeLevel(Math.max(0, Math.min(1, level)));
    const onLocalVolumeLevel = (level: number) => setLocalVolumeLevel(Math.max(0, Math.min(1, level)));
    const onCallStartProgress = (event: { stage?: string; status?: string }) => {
      setConnectionStage(event.status === 'started' ? event.stage ?? null : null);
    };

    vapi.on('call-start', onCallStart);
    vapi.on('call-end', onCallEnd);
    vapi.on('error', onError);
    vapi.on('message', onMessage);
    vapi.on('message', onToolCalls);
    vapi.on('speech-start', onSpeechStart);
    vapi.on('speech-end', onSpeechEnd);
    vapi.on('volume-level', onVolumeLevel);
    vapi.on('local-volume-level', onLocalVolumeLevel);
    vapi.on('call-start-progress', onCallStartProgress);

    return () => {
      vapi.removeListener('call-start', onCallStart);
      vapi.removeListener('call-end', onCallEnd);
      vapi.removeListener('error', onError);
      vapi.removeListener('message', onMessage);
      vapi.removeListener('message', onToolCalls);
      vapi.removeListener('speech-start', onSpeechStart);
      vapi.removeListener('speech-end', onSpeechEnd);
      vapi.removeListener('volume-level', onVolumeLevel);
      vapi.removeListener('local-volume-level', onLocalVolumeLevel);
      vapi.removeListener('call-start-progress', onCallStartProgress);
      vapiRef.current = null;
      vapi.stop();
    };
  }, [publicKey]);

  useEffect(() => {
    if (!isCallActive) return;
    const timer = window.setInterval(() => setDuration((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [isCallActive]);

  useEffect(() => {
    const list = transcriptScrollRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [transcript, liveCaption]);

  // Public site: try to greet visitors the moment they land. Browsers block
  // audio/mic access that isn't tied to a user gesture, so if the immediate
  // attempt is rejected we silently retry on the visitor's very first
  // interaction with the page (click, key press, or scroll) instead of
  // leaving the agent dead until they notice the mic button.
  useEffect(() => {
    if (!autoStart || !isReady || !assistantId || autoStartedRef.current) return;
    autoStartedRef.current = true;

    const vapi = vapiRef.current;
    if (!vapi) return;

    const beginCall = () => {
      setIsPanelOpen(true);
      setIsConnecting(true);
      setCallError(null);
      return vapi.start(assistantId, buildAssistantOverrides() as any);
    };

    beginCall().catch(() => {
      setIsConnecting(false);
      setIsPanelOpen(false);
      const onFirstInteraction = () => {
        beginCall().catch((error) => {
          console.error('Unable to start Vapi call on interaction:', error);
          setIsConnecting(false);
          setCallError(getCallErrorMessage(error));
        });
      };
      window.addEventListener('pointerdown', onFirstInteraction, { once: true });
      window.addEventListener('keydown', onFirstInteraction, { once: true });
      window.addEventListener('scroll', onFirstInteraction, { once: true, passive: true });
    });
  }, [autoStart, isReady, assistantId]);

  if (!publicKey || !assistantId) return null;

  const startCall = async () => {
    const vapi = vapiRef.current;
    if (!vapi || isCallActive || isConnecting) return;

    setIsPanelOpen(true);
    setIsConnecting(true);
    setCallError(null);
    setTranscript([]);
    setLiveCaption(null);
    transcriptIdRef.current = 0;

    try {
      await vapi.start(assistantId, buildAssistantOverrides() as any);
    } catch (error) {
      console.error('Unable to start Vapi call:', error);
      setIsConnecting(false);
      setCallError(getCallErrorMessage(error));
    }
  };

  useImperativeHandle(ref, () => ({
    startCall: () => void startCall(),
  }));

  const handleMicClick = () => {
    if (isCallActive || isConnecting) {
      setIsPanelOpen(true);
      return;
    }
    void startCall();
  };

  const toggleMute = () => {
    const vapi = vapiRef.current;
    if (!vapi || !isCallActive) return;
    const nextMuted = !isMuted;
    vapi.setMuted(nextMuted);
    setIsMuted(nextMuted);
  };

  const endCall = () => {
    vapiRef.current?.stop();
    setIsConnecting(false);
    setIsCallActive(false);
    setIsMuted(false);
    setIsPanelOpen(false);
  };

  const statusText = callError
    ? 'Connection issue'
    : isConnecting
      ? connectionStage === 'daily-call-join'
        ? 'Waiting for microphone…'
        : 'Connecting…'
      : isAssistantSpeaking
        ? 'Speaking…'
        : isCallActive
          ? 'Listening…'
          : 'Ready to connect';
  const stageText = callError
    ? 'Please try starting your practice call again.'
    : isConnecting
      ? connectionStage === 'daily-call-join'
        ? 'Allow microphone access if your browser asks.'
        : 'Connecting you to your coach…'
      : isAssistantSpeaking
        ? 'Your coach is speaking'
        : isCallActive
          ? 'Your coach is listening'
          : 'Start a live practice session';

  return (
    <div className="voice-agent-ui">
      {isPanelOpen && (
        <div className="voice-session-window">
          <section className="voice-session-stage" aria-label="Live practice session">
            <div className="voice-stage-heading">
              <span>Live practice session</span>
              <time>{formatDuration(duration)}</time>
            </div>
            <div className={`voice-stage-visual${isAssistantSpeaking ? ' is-speaking' : ''}`} aria-hidden="true">
              <span className="voice-coach-orb">C</span>
              <div className="voice-waveform">
                {WAVE_HEIGHTS.map((height, index) => (
                  <i
                    key={index}
                    style={{
                      height: `${Math.max(8, height * (0.65 + volumeLevel * 0.7))}px`,
                      animationDelay: `${(index % 7) * -0.12}s`,
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="voice-stage-caption" aria-live="polite">
              <span className="voice-stage-label">CANLAB voice coach</span>
              <p>{stageText}</p>
            </div>
          </section>

          <section className="voice-chat-panel" aria-label="Conversation with CANLAB voice coach">
            <header className="voice-chat-header">
              <span className="voice-chat-avatar" aria-hidden="true">C</span>
              <div className="voice-chat-title">
                <strong>CANLAB · Voice guide</strong>
                <span className={callError ? 'has-error' : ''}>{statusText}</span>
              </div>
              <button
                type="button"
                className="voice-icon-button"
                aria-label="Minimize voice session"
                title="Minimize"
                onClick={() => setIsPanelOpen(false)}
              >
                <CloseIcon />
              </button>
            </header>

            <div className="voice-chat-messages" ref={transcriptScrollRef} aria-live="polite" aria-relevant="additions text">
              {callError && <p className="voice-call-error" role="alert">{callError}</p>}
              {transcript.length === 0 && !liveCaption && !callError && (
                <p className="voice-chat-empty">
                  {isConnecting ? 'Getting your session ready…' : 'Say hello when you are ready to begin.'}
                </p>
              )}
              {transcript.map((line) => (
                <p key={line.id} className={`voice-message ${line.speaker}`}>
                  {line.text}
                </p>
              ))}
              {liveCaption && (
                <p className={`voice-message ${liveCaption.speaker} is-partial`}>
                  {liveCaption.text}
                </p>
              )}
            </div>

            <footer className="voice-chat-controls">
              {isCallActive && (
                <div className="voice-input-status" aria-live="polite">
                  <span className={`voice-input-dot${localVolumeLevel >= 0.035 && !isMuted ? ' has-input' : ''}`} />
                  <span>{isMuted ? 'Microphone muted' : localVolumeLevel >= 0.035 ? 'Microphone is picking up sound' : 'Speak to test your microphone'}</span>
                  <span className="voice-input-meter" aria-hidden="true">
                    <i style={{ width: `${Math.round(localVolumeLevel * 100)}%` }} />
                  </span>
                </div>
              )}
              <button type="button" className="voice-control-button mute" onClick={toggleMute} disabled={!isCallActive}>
                <MicIcon muted={isMuted} />
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
              <button type="button" className="voice-control-button end" onClick={endCall} disabled={!isCallActive && !isConnecting}>
                <EndCallIcon />
                End
              </button>
            </footer>
          </section>
        </div>
      )}

      <button
        type="button"
        className={`voice-agent-mic${isCallActive ? ' is-active' : ''}${isConnecting ? ' is-connecting' : ''}${isAssistantSpeaking ? ' is-speaking' : ''}`}
        onClick={handleMicClick}
        aria-label={isPanelOpen ? 'Reopen voice session' : 'Start a voice practice session'}
        aria-expanded={isPanelOpen}
        title={isPanelOpen ? 'Voice session open' : 'Talk to your CANLAB coach'}
      >
        <MicIcon />
      </button>
    </div>
  );
});

export default VoiceAgent;
