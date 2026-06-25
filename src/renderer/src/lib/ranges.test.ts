import { describe, it, expect } from 'vitest';
import { loadFixture } from '../../../../tests/support/fixture';
import { RANGES, sliceByRange } from './ranges';

const closes = loadFixture().sectors[0].closes; // 13 monthly points

describe('sliceByRange', () => {
  it('exposes all five ranges', () => {
    expect(RANGES).toEqual(['1M', '3M', '6M', 'YTD', '12M']);
  });

  it.each([
    ['12M', 13],
    ['6M', 7],
    ['3M', 4],
    ['1M', 2],
  ] as const)('keeps %s as %i points', (range, points) => {
    expect(sliceByRange(closes, range)).toHaveLength(points);
  });

  it('YTD is anchored to the as-of year with a prior-year baseline', () => {
    // Fixture spans 2025-06 … 2026-06; as-of 2026 → Dec-2025 baseline + H1 2026.
    const ytd = sliceByRange(closes, 'YTD', '2026-06-30');
    expect(ytd).toHaveLength(7);
    expect(ytd[0].date).toBe('2025-12-31');
  });

  it('never returns more points than exist', () => {
    expect(sliceByRange(closes.slice(0, 2), '12M')).toHaveLength(2);
  });
});
