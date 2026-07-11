export function formatPrice(value: number | string) {
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatPriceWithTiming(price: number | string, timing?: string | number | null) {
  const amount = formatPrice(price);
  const hours = String(timing ?? 24).trim() || '24';
  return `${amount}/${hours}hr`;
}
