type Amount = { type: string; amount: number; currency?: string; amountUsd?: number;
  netProceedsUsd?: number; displayAmount?: number; displayUnit?: string;
  metadata?: { credits?: number | string; totalCredits?: number | string } };
const creditTypes = new Set(['session_charge', 'session_refund', 'tip', 'advisor_tip',
  'advisor_earning', 'unlock_recording', 'unlock_transcript', 'promotion_purchase',
  'credit_expiration', 'free_credit_grant']);
export const formatCredits = (value?: number | null) => `${Number(value || 0).toLocaleString()} credits`;
export function formatTransactionAmount(tx: Amount) {
  if (tx.type === 'credit_pack_purchase') {
    const purchasedCredits = Number(tx.metadata?.totalCredits ?? tx.metadata?.credits);
    if (Number.isFinite(purchasedCredits)) return formatCredits(purchasedCredits);
  }
  if (tx.displayUnit === 'credits' || creditTypes.has(tx.type)) return formatCredits(tx.displayAmount ?? tx.amount);
  const usd = ['advisor_tip_fiat', 'advisor_payout'].includes(tx.type);
  const currency = tx.displayUnit || (usd ? 'USD' : tx.currency || 'USD');
  const amount = tx.displayAmount ?? (usd ? tx.netProceedsUsd ?? tx.amountUsd ?? tx.amount : tx.amount);
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount); }
  catch { return `${amount.toLocaleString()} ${currency}`; }
}
