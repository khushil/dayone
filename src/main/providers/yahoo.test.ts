import { describe, it, expect } from 'vitest';
import { QuoteSchema, BarSchema } from '../../shared/instruments';
import { assertAllowedHost } from './provider';
import { YahooProvider } from './yahoo';
import {
  jsonFetch,
  yahooChart,
  yahooSearch,
} from '../../../tests/support/providerStub';

const yahoo = new YahooProvider();

describe('YahooProvider.getQuote', () => {
  it('normalizes the chart meta into a validated Quote', async () => {
    const ctx = {
      fetchImpl: jsonFetch(yahooChart({ price: 100, prevClose: 80 })),
    };
    const q = await yahoo.getQuote('AAPL', ctx);
    expect(() => QuoteSchema.parse(q)).not.toThrow();
    expect(q.price).toBe(100);
    expect(q.change).toBe(20);
    expect(q.changePct).toBeCloseTo(25, 6);
    expect(q.currency).toBe('USD');
  });
});

describe('YahooProvider.getBars', () => {
  it('parses OHLCV, skips null bars, and applies the limit', async () => {
    const bars = [
      { t: 1700000000, o: 1, h: 2, l: 0.5, c: 1.5, v: 100 },
      { t: 1700086400, o: 1.5, h: 3, l: 1, c: 2.5, v: 200 },
      { t: 1700172800, o: 2.5, h: 4, l: 2, c: null, v: null }, // null close → skipped
    ];
    const ctx = { fetchImpl: jsonFetch(yahooChart({ bars })) };
    const out = await yahoo.getBars('AAPL', { timeframe: '1d' }, ctx);
    expect(out).toHaveLength(2);
    expect(() => out.forEach((b) => BarSchema.parse(b))).not.toThrow();
    expect(out[0].t).toBe(1700000000 * 1000); // seconds → ms
    const limited = await yahoo.getBars(
      'AAPL',
      { timeframe: '1d', limit: 1 },
      ctx,
    );
    expect(limited).toHaveLength(1);
    expect(limited[0].c).toBe(2.5);
  });
});

describe('YahooProvider.searchInstruments', () => {
  it('maps quoteType to AssetClass and drops unknown types', async () => {
    const ctx = {
      fetchImpl: jsonFetch(
        yahooSearch([
          {
            symbol: 'AAPL',
            shortname: 'Apple',
            quoteType: 'EQUITY',
            exchange: 'NMS',
          },
          {
            symbol: 'BTC-USD',
            shortname: 'Bitcoin',
            quoteType: 'CRYPTOCURRENCY',
          },
          { symbol: '???', quoteType: 'MUTUALFUND' },
        ]),
      ),
    };
    const results = await yahoo.searchInstruments('app', ctx);
    expect(results.map((r) => r.symbol)).toEqual(['AAPL', 'BTC-USD']);
    expect(results[0].assetClass).toBe('equity');
    expect(results[1].assetClass).toBe('crypto');
  });
});

describe('YahooProvider.validateKey', () => {
  it('is trivially valid (keyless)', async () => {
    expect((await yahoo.validateKey()).valid).toBe(true);
  });
});

describe('assertAllowedHost', () => {
  it('rejects a non-allowlisted host', () => {
    expect(() =>
      assertAllowedHost('https://evil.example.com/x', [
        'query1.finance.yahoo.com',
      ]),
    ).toThrow();
    expect(() =>
      assertAllowedHost('https://query1.finance.yahoo.com/x', [
        'query1.finance.yahoo.com',
      ]),
    ).not.toThrow();
  });
});
