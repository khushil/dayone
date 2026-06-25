import { describe, it, expect } from 'vitest';
import { attemptRefresh, fetchSnapshot, toCloses } from './yahoo';
import {
  failingFetch,
  makeChart,
  okFetch,
} from '../../tests/support/yahooStub';

describe('toCloses', () => {
  it('drops the current month and keeps the last 13 completed months', () => {
    const closes = toCloses(makeChart(), 'XLK');
    expect(closes).toHaveLength(13);
    expect(closes[0].date < closes[12].date).toBe(true);
  });

  it('rejects an unexpected (non-chart) shape', () => {
    expect(() => toCloses({ nope: true }, 'XLK')).toThrow();
  });
});

describe('attemptRefresh', () => {
  it('returns a validated snapshot of all 11 sectors on success', async () => {
    const result = await attemptRefresh(okFetch);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.sectors).toHaveLength(11);
    }
  });

  it('never throws — a failing source yields ok:false (keep last-good)', async () => {
    const result = await attemptRefresh(failingFetch);
    expect(result.ok).toBe(false);
  });
});

describe('fetchSnapshot', () => {
  it('throws when the source is unavailable', async () => {
    await expect(fetchSnapshot(failingFetch)).rejects.toThrow();
  });
});
