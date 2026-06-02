export function formatCurrency(min: number, max: number): string {
  if (min === 0 && max === 0) return '—';
  if (min === max) return `$${min}`;
  return `$${min} – $${max}`;
}

export function formatBondAmount(amount: number): string {
  if (amount === 0) return '—';
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}k`;
  return `$${amount}`;
}
