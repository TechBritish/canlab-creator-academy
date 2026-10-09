# Voice Agent and Sidebar Implementation Plan

> **For agentic workers:** Follow the tasks in order and validate after each UI change.

**Goal:** Match the supplied live voice-session reference using the portal palette and place profile details plus Log out in the sidebar footer.

**Architecture:** Keep Vapi calls on the existing direct `@vapi-ai/web` client. `VoiceAgent.tsx` will own call state, duration, transcript, mute state, and panel visibility; a colocated stylesheet will own responsive presentation. `Portal.tsx` will group profile and Log out in a sidebar footer, with matching desktop and mobile rules in the global stylesheet.

**Tech Stack:** React 19, TypeScript, Vite, `@vapi-ai/web`, existing CSS variables.

---

### Task 1: Build the working voice-session UI

**Files:**
- Modify: `src/components/portal/VoiceAgent.tsx`
- Create: `src/components/portal/VoiceAgent.css`

- [ ] Keep the floating mic as the closed state. Clicking it opens the panel and starts the configured assistant.
- [ ] Use Vapi `message`, `call-start`, `call-end`, `error`, and `volume-level` events for live transcript, status, errors, and visualizer activity.
- [ ] Implement actual mute and end controls with `setMuted()` and `stop()`; ensure cleanup removes event listeners and stops a live call.
- [ ] Match the reference composition with a live-session card, conversation panel, portal-colored purple/blue accents, and responsive mobile layout.
- [ ] Validate the app build before moving on.

### Task 2: Correct the sidebar account footer

**Files:**
- Modify: `src/pages/Portal.tsx`
- Modify: `src/index.css`

- [ ] Group profile identity and Log out at the bottom of the desktop sidebar with consistent spacing and aligned padding.
- [ ] Keep Log out accessible on mobile when the sidebar switches to horizontal navigation.
- [ ] Validate the app build and lint command.

### Validation

- Run `npm run build`; expected: exit code 0.
- Run `npm run lint`; inspect and resolve any issues introduced by these changes.
- Manually verify the closed mic, call-open panel, transcript/status, mute/end controls, and sidebar footer in the portal.