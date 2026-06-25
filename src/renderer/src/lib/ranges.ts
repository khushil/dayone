import { type ClosePoint, type TimeRange } from '@shared/types';

/** All ranges, in display order. */
export const RANGES: readonly TimeRange[] = ['1M', '3M', '6M', 'YTD', '12M'];

const RANGE_MONTHS: Record<Exclude<TimeRange, 'YTD'>, number> = {
  '1M': 1,
  '3M': 3,
  '6M': 6,
  '12M': 12,
};

function sliceYtd(
  series: readonly ClosePoint[],
  asOf: string,
): readonly ClosePoint[] {
  const year = asOf.slice(0, 4);
  const firstInYear = series.findIndex(
    (point) => point.date.slice(0, 4) === year,
  );
  if (firstInYear < 0) {
    return [];
  }
  // Include the prior close as the rebasing baseline (Dec → 100) when present.
  return series.slice(Math.max(0, firstInYear - 1));
}

/**
 * Slice a close series to the selected look-back window. N-month ranges keep
 * the last N+1 closes (N monthly returns). YTD is anchored to `asOf`'s calendar
 * year (defaulting to the series' last date) with the prior year-end close as
 * the rebasing baseline — never the wall clock, so results are deterministic.
 */
export function sliceByRange(
  series: readonly ClosePoint[],
  range: TimeRange,
  asOf?: string,
): readonly ClosePoint[] {
  if (series.length === 0) {
    return [];
  }
  if (range === 'YTD') {
    return sliceYtd(series, asOf ?? series[series.length - 1].date);
  }
  const count = RANGE_MONTHS[range] + 1;
  return series.slice(Math.max(0, series.length - count));
}
