export function formatCurrency(value, currency = 'USD', locale = 'en-US') {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return '0.00';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return n.toFixed(2);
  }
}

export function formatNumber(value, locale = 'en-US') {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return '0';
  return new Intl.NumberFormat(locale).format(n);
}