// WooCommerce order statuses that count toward click/order attribution,
// tiers and payouts. Refunded, cancelled and failed orders are stored but
// excluded everywhere this list is used.
export const COUNTED_ORDER_STATUSES = ['processing', 'completed'] as const;
