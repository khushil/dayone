import { DataError, type ClosePoint } from '@shared/types';

/** A single month's return, keyed by the close's `YYYY-MM`. */
export interface MonthlyReturn {
  month: string;
  return: number;
}

function assertPositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new DataError(
      `${label} must be a positive, finite number (got ${value})`,
    );
  }
}

/**
 * Rebase a close series to 100 at its first point, so sectors with different
 * absolute prices can be compared on one axis. `rebased[i] = close[i]/close[0]*100`.
 */
export function rebaseToHundred(series: readonly ClosePoint[]): number[] {
  if (series.length === 0) {
    return [];
  }
  const base = series[0].close;
  assertPositive(base, 'base close');
  return series.map((point) => (point.close / base) * 100);
}

/**
 * Month-over-month returns: `return[i] = close[i]/close[i-1] − 1`. A series of N
 * closes yields N−1 returns, each keyed by the later month.
 */
export function monthlyReturns(series: readonly ClosePoint[]): MonthlyReturn[] {
  const out: MonthlyReturn[] = [];
  for (let i = 1; i < series.length; i++) {
    const previous = series[i - 1].close;
    assertPositive(previous, 'previous close');
    out.push({
      month: series[i].date.slice(0, 7),
      return: series[i].close / previous - 1,
    });
  }
  return out;
}

/** Total return across the whole series: `last/first − 1`. */
export function periodReturn(series: readonly ClosePoint[]): number {
  if (series.length < 2) {
    return 0;
  }
  const base = series[0].close;
  assertPositive(base, 'base close');
  return series[series.length - 1].close / base - 1;
}
