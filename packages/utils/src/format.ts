export function formatProbability(probability: number): string {
  return `${Math.round(probability * 100)}%`;
}

export function formatProbabilityDecimal(probability: number, decimals = 1): string {
  return `${(probability * 100).toFixed(decimals)}%`;
}

export function formatCurrency(
  amount: number,
  currency = 'KRW',
  locale = 'ko-KR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(
  num: number,
  locale = 'ko-KR',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(num);
}

export function formatCompactNumber(num: number, locale = 'ko-KR'): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num);
}

export function formatPercentChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${(change * 100).toFixed(2)}%`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function capitalizeFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function formatUsername(username: string | null, displayName: string | null): string {
  if (displayName) return displayName;
  if (username) return `@${username}`;
  return 'Anonymous';
}
