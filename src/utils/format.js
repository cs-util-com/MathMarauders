const compactFormatter = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return '—';
  }

  if (Math.abs(value) >= 1000) {
    return compactFormatter.format(value);
  }

  return Math.round(value).toLocaleString('en');
}

export function formatDelta(delta) {
  if (!Number.isFinite(delta) || delta === 0) {
    return null;
  }

  const sign = delta > 0 ? '+' : '';
  return `${sign}${Math.round(delta)}`;
}

export function toSeconds(milliseconds) {
  return (milliseconds / 1000).toFixed(1);
}
