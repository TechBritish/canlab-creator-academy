export type Module = {
  n: string;
  t: string;
  req?: boolean;
  video: string;
  lessons: [string, string][];
  pts: string[];
};

export const MODS: Module[] = [
  { n: 'M1', t: 'What CANLAB sells', video: '/academy/m3.mp4', lessons: [['Research peptides, purity and who the customer is', '—']], pts: ['CANLAB supplies research compounds tested to 99%+ purity, verified by HPLC and mass-spec.', 'Certificates of Analysis are available on request. Use them as a trust point.', 'Customers are researchers and labs. Buyers must be 21+.'] },
  { n: 'M2', t: 'The rules: research use only', req: true, video: '/academy/m2.mp4', lessons: [['What "research use only" means, and disclosure rules', '—']], pts: ['Never suggest human or animal use, dosing or health outcomes.', 'No before-and-after, injection or consumption footage.', 'Disclose every affiliate link clearly.'] },
  { n: 'M3', t: 'Content that converts', video: '/academy/m1.mp4', lessons: [['Hooks, formats and calls to action', '—']], pts: ['Lead with a pattern interrupt, not a logo.', 'Show the product, the paperwork and the packaging. Trust sells.', 'One call to action per post.'] },
  { n: 'M4', t: 'Workflow, tracking and rewards', video: '/academy/m4.mp4', lessons: [['Clip library, posting cadence, your link and tiers', '—']], pts: ['Pick a clip, add your voice, keep the compliance line. Post 4 to 5 times a week.', 'Every order through your link or code is tracked. Submit every post so it counts toward your tier.', 'Tiers and your member discount update on the 1st of each month.'] },
];

export const QUIZ = [
  { q: 'A follower comments "how much should I take?" What do you reply?', o: ['Start low, most people use a small daily amount.', "I can't advise on that. CANLAB products are for laboratory and research use only.", "DM me and I'll send you my protocol."], a: 1 },
  { q: 'Which caption is compliant?', o: ['This melted 10lbs off me in a month.', '99%+ purity, HPLC tested, COA on request. For research use only. #ad', 'Best anti-ageing stack on the market.'], a: 1 },
  { q: 'Do you need to disclose your affiliate link?', o: ['Only if you are paid in cash.', 'Yes, clearly on every post: #ad or "affiliate link". Discounts count too.', 'No, the link speaks for itself.'], a: 1 },
  { q: 'Can you post a before-and-after transformation?', o: ['Yes, if it is your own result.', 'Yes, with a disclaimer.', 'No. Never.'], a: 2 },
  { q: 'Who can CANLAB sell to?', o: ['Anyone over 18.', 'Qualified researchers and labs, 21+.', 'Anyone with a prescription.'], a: 1 },
];

export type Clip = {
  h: string;
  f: string;
  p: string;
  d: string;
  g: [string, string];
  cap: string;
  video: string;
};

export const CLIPS: Clip[] = [
  { h: 'Your REALISTIC guide to 30% body fat', f: 'Myth vs fact', p: 'TikTok', d: '0:45', g: ['#1B4A6B', '#0B1B2A'], cap: "What 30% body fat actually looks like, and what the research says about getting it down safely.\n\nFor laboratory and research use only. #ad #labtok", video: '/clips/c1.mp4' },
  { h: 'Alpha-GPC: the real dosage research', f: 'COA read', p: 'Instagram', d: '0:45', g: ['#3A2E6B', '#140F26'], cap: "Alpha-GPC dosage, explained from the research, not the hype.\n\nFor laboratory and research use only. Affiliate link in bio. #ad", video: '/clips/c2.mp4' },
  { h: 'Artificial sweeteners: moderation is key', f: 'Myth vs fact', p: 'TikTok', d: '0:45', g: ['#17504A', '#0A1C1A'], cap: "What the research actually says about artificial sweeteners and moderation.\n\nFor laboratory and research use only. #ad", video: '/clips/c3.mp4' },
  { h: 'Methylene blue & nicotine: athlete performance', f: 'Lab tour', p: 'YouTube Shorts', d: '0:45', g: ['#27415A', '#0C141C'], cap: "Cycling methylene blue and nicotine for athlete performance research. Here's what the data shows.\n\nFor laboratory and research use only. #ad", video: '/clips/c4.mp4' },
  { h: 'Growth hormone & red light therapy for recovery', f: 'Q&A', p: 'X', d: '0:45', g: ['#4A2C4F', '#160D18'], cap: "Biohacking recovery research: growth hormone and red light therapy, what the studies say.\n\nFor laboratory and research use only. #ad", video: '/clips/c5.mp4' },
  { h: 'Build muscle & lose fat: the anabolic secret', f: 'Myth vs fact', p: 'TikTok', d: '0:45', g: ['#1F4E63', '#0A161C'], cap: "The anabolic secret behind building muscle and losing fat, backed by the research.\n\nFor laboratory and research use only. #ad", video: '/clips/c6.mp4' },
  { h: 'GLP-1s: the obesity game-changer', f: 'COA read', p: 'Instagram', d: '0:45', g: ['#2A3E6B', '#0D1226'], cap: "What you need to know about GLP-1s as the obesity research game-changer.\n\nFor laboratory and research use only. #ad", video: '/clips/c7.mp4' },
  { h: 'Grow your brain: neuroplasticity secrets', f: 'Myth vs fact', p: 'YouTube Shorts', d: '0:45', g: ['#2F5A3E', '#0D1C12'], cap: "Neuroplasticity secrets from the research: how to grow your brain.\n\nFor laboratory and research use only. #ad", video: '/clips/c8.mp4' },
  { h: 'L-Carnitine pre-workout: sweat, muscle, pumps', f: 'Lab tour', p: 'TikTok', d: '0:45', g: ['#6B3A2E', '#261410'], cap: "L-Carnitine pre-workout research: sweat, muscle and pumps, explained.\n\nFor laboratory and research use only. #ad", video: '/clips/c9.mp4' },
  { h: 'MK: the only peptide driving growth hormone', f: 'Q&A', p: 'Instagram', d: '0:45', g: ['#4F2C4A', '#180D16'], cap: "The only peptide shown to drive growth hormone through enzymatic action, per the research.\n\nFor laboratory and research use only. #ad", video: '/clips/c10.mp4' },
];

export const clipBg = (c: Clip) =>
  `radial-gradient(90% 60% at 30% 20%,${c.g[0]},transparent 70%),linear-gradient(170deg,${c.g[0]},${c.g[1]})`;

export type Submission = [string, string, string, string, string, string];

export const INITIAL_SUBS: Submission[] = [
  ['COA read · purity explainer', 'TikTok', '24 Sep', 'good', 'Approved', '12,410'],
  ['Unboxing same-day order', 'Instagram', '22 Sep', 'good', 'Approved', '6,902'],
  ['"Best stack for recovery"', 'TikTok', '20 Sep', 'bad', 'Needs changes', '—'],
  ['Myth vs fact #2', 'YouTube Shorts', '18 Sep', 'good', 'Approved', '3,288'],
];

export type ReviewRow = [string, string, string, string, string];

export const INITIAL_REV: ReviewRow[] = [
  ['Maya Reyes', 'Unboxing v2', 'Clean', 'good', ''],
  ['Chris Nakamura', '"Feel 10 years younger"', 'Health claim', 'bad', ''],
  ['Lena Brandt', 'Lab tour remix', 'Missing #ad', 'warn', ''],
  ['Sam Whitlock', 'COA read', 'Clean', 'good', ''],
];

export type AppRow = [string, string, string];

export const INITIAL_APPS: AppRow[] = [
  ['Jordan Ellis · TikTok', '24,300', ''],
  ['Priya Shah · Instagram', '8,950', ''],
  ['Tom Hale · YouTube', '61,200', ''],
];
