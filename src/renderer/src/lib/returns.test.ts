import { describe, it, expect } from 'vitest';
import { DataError, type ClosePoint } from '@shared/types';
import { monthlyReturns, periodReturn, rebaseToHundred } from './returns';

const series = (closes: number[]): ClosePoint[] =>
  closes.map((close, i) => ({
    date: `2025-${String(i + 1).padStart(2, '0')}-28`,
    close,
  }));

describe('rebaseToHundred', () => {
  it('starts at 100 and scales proportionally', () => {
    const rebased = rebaseToHundred(series([200, 220, 180]));
    expect(rebased[0]).toBe(100);
    expect(rebased[1]).toBeCloseTo(110, 10);
    expect(rebased[2]).toBeCloseTo(90, 10);
  });

  it('throws a DataError when the base close is not positive', () => {
    expect(() => rebaseToHundred(series([0, 100]))).toThrow(DataError);
  });
});

describe('monthlyReturns', () => {
  it('yields one fewer return than closes', () => {
    const r = monthlyReturns(series([100, 110, 121]));
    expect(r).toHaveLength(2);
    expect(r[0].return).toBeCloseTo(0.1, 10);
    expect(r[1].return).toBeCloseTo(0.1, 10);
    expect(r[0].month).toBe('2025-02');
  });

  it('throws a DataError on a non-positive divisor', () => {
    expect(() => monthlyReturns(series([100, 0, 100]))).toThrow(DataError);
  });
});

describe('periodReturn', () => {
  it('is the total change from first to last close', () => {
    expect(periodReturn(series([100, 124]))).toBeCloseTo(0.24, 10);
  });
});
