// Guest order tracking without a paid backend: a lookup doc is stored at
// order_lookup/{trackingKey}, where the key mixes the order number with the
// last 4 digits of the customer's phone. Firestore rules allow a public
// `get` (fetch-by-exact-key) on this collection but never `list`, so a
// visitor can only read a tracking record if they already know both the
// order number and the phone's last 4 digits — the collection can't be
// browsed or dumped.
export function getTrackingKey(orderNumber: string, phone: string): string {
  const cleanOrder = orderNumber.trim().toUpperCase();
  const digits = String(phone || '').replace(/\D/g, '');
  const last4 = digits.slice(-4);
  return `${cleanOrder}_${last4}`;
}
