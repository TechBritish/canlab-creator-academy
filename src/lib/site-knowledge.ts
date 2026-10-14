// Everything the voice agent knows about the CANLAB Creator Academy site, so
// it can answer questions and move visitors/creators around by voice. Mirrors
// the pattern used for the UW Partner Coach voice guide.
import { MODS, CLIPS } from '../data/mockData';

// Top-level routes the agent can jump to with the "navigate" tool.
export const VOICE_ROUTES = {
  home: '/',
  login: '/login',
  portal: '/portal',
  admin: '/admin',
} as const;

export type VoiceRoute = keyof typeof VOICE_ROUTES;

// Anchor ids on the public landing page the agent can scroll to/highlight.
export const PUBLIC_SECTIONS: Record<string, string> = {
  'how it works': 'how',
  'the portal / inside tour': 'inside',
  'rewards & tiers': 'earn',
  'the research standard': 'standard',
  'apply form': 'apply',
};

// Tabs inside the creator portal the agent can switch to with "switch_tab".
export const PORTAL_TABS = {
  dash: 'Dashboard — KPIs, up next, this week\'s clip drop',
  academy: 'Academy — training modules and lessons',
  clips: 'Clip library — ready-to-post clips with captions',
  subs: 'Submissions — submit posts for tier credit',
  earn: 'Rewards — tier, discount and order tracking',
  comm: 'Community — other creators, discussion',
} as const;

export type PortalTab = keyof typeof PORTAL_TABS;

export function buildSiteKnowledge(opts: {
  currentPath: string;
  inPortal: boolean;
  currentTab?: PortalTab;
}) {
  const { currentPath, inPortal, currentTab } = opts;

  const modules = MODS.map(
    (m) => `- ${m.n} "${m.t}"${m.req ? ' (required)' : ''}. Key points: ${m.pts.join(' ')}`,
  ).join('\n');

  const clips = CLIPS.slice(0, 5)
    .map((c) => `- "${c.h}" (${c.f}, ${c.p}, ${c.d})`)
    .join('\n');

  const sections = Object.entries(PUBLIC_SECTIONS)
    .map(([label, id]) => `- "${id}" = ${label}`)
    .join('\n');

  const tabs = Object.entries(PORTAL_TABS)
    .map(([id, desc]) => `- "${id}": ${desc}`)
    .join('\n');

  return `You are the friendly voice guide for CANLAB Creator Academy — a program that trains micro-creators to promote high-purity research compounds compliantly, then rewards them with tiered member pricing based on the orders they drive.

STYLE
- Speak in short, warm, natural sentences (1-3 sentences per turn).
- When the user asks to go somewhere or do something, call the matching tool right away, then briefly confirm what you did.
- Always remind creators that CANLAB products are strictly for laboratory and research use only (21+ buyers), and every affiliate link/discount must be disclosed (#ad). Never suggest human or animal use, dosing or health outcomes.
- If you don't know something, say so and suggest the "How it works" or "The standard" sections, or the Academy tab once signed in.

CONTEXT
- The visitor is currently on route: ${currentPath}${inPortal ? ` (inside the creator portal, tab: "${currentTab ?? 'dash'}")` : ''}.
- Signed-out visitors only see the public landing page and the login page. Only signed-in, approved creators can reach the portal (/portal). Admins reach /admin.

PUBLIC PAGE SECTIONS (use scroll_to with these ids; navigate to "home" first if needed)
${sections}

CREATOR PORTAL TABS (use switch_tab; only works once inside /portal)
${tabs}

TRAINING MODULES (Academy tab)
${modules}

SAMPLE CLIP LIBRARY ENTRIES
${clips}

QUIZ TOPICS: compliant replies to dosing questions, compliant captions, affiliate disclosure rules, no before/after content, 21+ research-only customers.

TOOLS
- navigate: go to a top-level route — "home", "login", "portal", or "admin".
- scroll_to: scroll to and highlight a section on the public landing page by id (only works when on "home").
- switch_tab: switch to a tab inside the creator portal (only works when already on "portal").
- end_call: when the user says goodbye or asks you to stop.`;
}
