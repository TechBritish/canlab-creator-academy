import { Component, type ReactNode } from 'react';

// Isolates the third-party Vapi widget so that if it throws (bad SDK build,
// bad keys, browser incompatibility, etc.) it only removes itself instead of
// crashing the whole portal to a black screen.
export default class VoiceAgentBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: { componentStack?: string | null }) {
    // Keep the dashboard alive; just log the widget failure loudly so it's
    // obvious in devtools why the round button disappeared.
    console.error('Voice agent widget failed to load:', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
