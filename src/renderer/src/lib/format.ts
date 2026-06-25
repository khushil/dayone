const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** Direction of a value, for redundant (non-color) gain/loss encoding. */
export type Direction = 'gain' | 'loss' | 'neutral';

/** Classify a number as gain / loss / neutral. */
export function direction(value: number): Direction {
  if (!Number.isFinite(value) || value === 0) {
    return value > 0 ? 'gain' : value < 0 ? 'loss' : 'neutral';
  }
  return value > 0 ? 'gain' : 'loss';
}

/**
 * Format a ratio as a signed, one-decimal percent (`+24.3%`, `-7.1%`). Zero
 * (and `-0`) render without a sign; non-finite input renders as an em dash.
 */
export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return '—';
  }
  const percent = value * 100;
  if (Object.is(percent, -0) || percent === 0) {
    return '0.0%';
  }
  const sign = percent > 0 ? '+' : '-';
  return `${sign}${Math.abs(percent).toFixed(1)}%`;
}

/** Format a `YYYY-MM` or `YYYY-MM-DD` string as `Mon YYYY` (e.g. `Jul 2025`). */
export function formatMonth(value: string): string {
  const [year, month] = value.split('-');
  const index = Number(month) - 1;
  const name = MONTHS[index] ?? month;
  return `${name} ${year}`;
}
