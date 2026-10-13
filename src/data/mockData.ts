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
};

export const CLIPS: Clip[] = [
  { h: 'What 99% purity looks like on paper', f: 'COA read', p: 'TikTok', d: '0:28', g: ['#1B4A6B', '#0B1B2A'], cap: 'What does 99%+ purity actually look like on paper? A real COA, line by line. HPLC + mass-spec verified.\n\nFor laboratory and research use only. #ad #labtok' },
  { h: 'Ordered at 10am. Shipped at 2pm.', f: 'Unboxing', p: 'Instagram', d: '0:34', g: ['#3A2E6B', '#140F26'], cap: 'Ordered at 10am, shipped same day. Packaging, labelling, paperwork, all of it.\n\nFor laboratory and research use only. Affiliate link in bio. #ad' },
  { h: '3 myths about research peptides', f: 'Myth vs fact', p: 'TikTok', d: '0:41', g: ['#17504A', '#0A1C1A'], cap: 'Three things people get wrong about research peptides, and what the paperwork actually tells you.\n\nFor laboratory and research use only. #ad' },
  { h: 'Inside a North American lab', f: 'Lab tour', p: 'YouTube Shorts', d: '0:52', g: ['#27415A', '#0C141C'], cap: 'Where North-American made research compounds come from. Quick tour.\n\nFor laboratory and research use only. #ad' },
  { h: '"Is this legit?" How to check', f: 'Q&A', p: 'X', d: '0:30', g: ['#4A2C4F', '#160D18'], cap: "Most asked question in my comments: is this legit? Here's how to check any supplier's COA.\n\nFor laboratory and research use only. #ad" },
  { h: 'Read a mass-spec chart in 30s', f: 'COA read', p: 'Instagram', d: '0:30', g: ['#1F4E63', '#0A161C'], cap: "You don't need a PhD to read this chart. 30 seconds.\n\nFor laboratory and research use only. #ad" },
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
