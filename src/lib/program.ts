// Micro-Influencer Program terms (Canlab Group, Oct 2026). One source for the
// public page, the portal, the partner agreement and the voice agent, so the
// numbers never drift apart.

export const COMMISSION_TIERS = [
  { min: 0, max: 9_999, rate: 0, label: 'Under $10k', reward: '60% off product' },
  { min: 10_000, max: 49_999, rate: 0.1, label: '$10k–$49,999', reward: '10%' },
  { min: 50_000, max: 149_999, rate: 0.15, label: '$50k–$149,999', reward: '15%' },
  { min: 150_000, max: Infinity, rate: 0.2, label: '$150k+', reward: '20%' },
] as const;

export const CREATOR_DISCOUNT = 0.6;
export const MIN_PAYOUT = 75;

export function tierForSales(sales: number) {
  const i = COMMISSION_TIERS.findIndex((t) => sales >= t.min && sales <= t.max);
  const idx = i === -1 ? 0 : i;
  const tier = COMMISSION_TIERS[idx];
  return { idx, tier, commission: Math.round(sales * tier.rate) };
}

export const PROGRAM_FACTS = [
  'Who can join: US residents aged 18+ with 500 to 3,500 genuine followers on their main platform. Acceptance is subject to Canlab approval.',
  'Everyone joins as a Product Partner. There is no monthly fee.',
  'Commission is based on monthly eligible net sales through your link or code: under $10,000 no commission (but you get product at 60% off); $10,000 to $49,999 earns 10%; $50,000 to $149,999 earns 15%; $150,000+ earns 20%.',
  'Once you reach a tier, that rate applies to the whole month\'s sales, not just the amount above the threshold.',
  'Approved creators get 60% off purchases from the approved catalog. Buying is optional. Your own discounted purchases count as self-purchases and never earn commission.',
  'Weekly output: 4 posts and 2 reels. The reels are supplied by the Canlab Micro Influencer Academy.',
  'When Canlab sends an authorised promotional package, you post an introductory unboxing, then regular progress updates about your partnership. Show the packaging only; never show or imply human or animal use.',
  'Eligible sales = net collected revenue through your link or code, minus discounts, refunds, chargebacks, taxes and shipping. Your own orders are excluded.',
  'Tracking: 30-day link-click window, last click wins when more than one creator is involved.',
  'Payouts: calculated monthly, paid on the 30th (last business day in February) after a 30-day refund hold. Balances under $75 roll over to next month.',
  'Before your first payout you sign the Partner Agreement online and complete a W-9 and payout details through a secure request.',
  'Term: 3 months, then month to month. Either side can end it with 14 days\' written notice.',
  'Every post needs a clear #ad or "Paid partnership" disclosure. No treatment, efficacy, dosing, injection or before-and-after claims, and no personal health results.',
];
