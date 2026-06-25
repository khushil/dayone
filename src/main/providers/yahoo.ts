import { z } from 'zod';
import type {
  AssetClass,
  Bar,
  Capabilities,
  Instrument,
  Quote,
} from '../../shared/instruments';
import {
  assertAllowedHost,
  type BarRange,
  type DataProvider,
  type KeyValidation,
  type ProviderCtx,
} from './provider';

const HOSTS = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'] as const;
const BASE = 'https://query1.finance.yahoo.com';
const TIMEOUT_MS = 8000;

const INTERVAL: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '60m',
  '1d': '1d',
  '1wk': '1wk',
  '1mo': '1mo',
};

// Yahoo quoteType → our AssetClass.
const QUOTE_TYPE: Record<string, AssetClass> = {
  EQUITY: 'equity',
  ETF: 'etf',
  INDEX: 'index',
  CRYPTOCURRENCY: 'crypto',
  CURRENCY: 'forex',
  FUTURE: 'future',
  OPTION: 'option',
};

const ChartSchema = z.object({
  chart: z.object({
    result: z
      .array(
        z.object({
          meta: z.object({
            regularMarketPrice: z.number().optional(),
            previousClose: z.number().optional(),
            chartPreviousClose: z.number().optional(),
            currency: z.string().optional(),
          }),
          timestamp: z.array(z.number()).optional(),
          indicators: z
            .object({
              quote: z
                .array(
                  z.object({
                    open: z.array(z.number().nullable()).optional(),
                    high: z.array(z.number().nullable()).optional(),
                    low: z.array(z.number().nullable()).optional(),
                    close: z.array(z.number().nullable()).optional(),
                    volume: z.array(z.number().nullable()).optional(),
                  }),
                )
                .optional(),
            })
            .optional(),
        }),
      )
      .nonempty(),
  }),
});

const SearchSchema = z.object({
  quotes: z.array(
    z.object({
      symbol: z.string(),
      shortname: z.string().optional(),
      longname: z.string().optional(),
      quoteType: z.string().optional(),
      exchange: z.string().optional(),
    }),
  ),
});

const CAPABILITY = {
  quotes: true,
  bars: true,
  intradayBars: true,
  streaming: false,
} as const;

/**
 * Keyless Yahoo Finance adapter built on the public chart + search endpoints
 * (OHLCV bars, last price). Best-effort: Yahoo rate-limits/crumb-gates, so
 * callers handle failures gracefully. Symbols are treated as canonical (Yahoo
 * uses `BTC-USD`, `^GSPC`, `EURUSD=X`).
 */
export class YahooProvider implements DataProvider {
  readonly id = 'yahoo';
  readonly name = 'Yahoo Finance';
  readonly requiresKey = false;
  readonly credentialFields = [];
  readonly capabilities: Capabilities = {
    equity: CAPABILITY,
    etf: CAPABILITY,
    index: CAPABILITY,
    crypto: CAPABILITY,
    forex: CAPABILITY,
  };

  toProviderSymbol(canonical: string): string {
    return canonical;
  }

  fromProviderSymbol(raw: string): string {
    return raw;
  }

  private async fetchJson(url: string, ctx: ProviderCtx): Promise<unknown> {
    assertAllowedHost(url, HOSTS);
    const fetchImpl = ctx.fetchImpl ?? fetch;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetchImpl(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (DayONE)' },
        signal: ctx.signal ?? controller.signal,
      });
      if (!res.ok) {
        throw new Error(`Yahoo HTTP ${res.status}`);
      }
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async getQuote(symbol: string, ctx: ProviderCtx): Promise<Quote> {
    const url = `${BASE}/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1m`;
    const { chart } = ChartSchema.parse(await this.fetchJson(url, ctx));
    const { meta } = chart.result[0];
    const price = meta.regularMarketPrice;
    if (typeof price !== 'number' || !Number.isFinite(price)) {
      throw new Error(`Yahoo: no price for ${symbol}`);
    }
    const prev = meta.chartPreviousClose ?? meta.previousClose;
    const change = prev ? price - prev : undefined;
    return {
      symbol,
      price,
      ts: Date.now(),
      currency: meta.currency ?? 'USD',
      change,
      changePct: prev ? (price / prev - 1) * 100 : undefined,
    };
  }

  async getBars(
    symbol: string,
    range: BarRange,
    ctx: ProviderCtx,
  ): Promise<Bar[]> {
    const interval = INTERVAL[range.timeframe];
    const params = new URLSearchParams({ interval });
    if (range.from && range.to) {
      params.set('period1', String(Math.floor(range.from / 1000)));
      params.set('period2', String(Math.floor(range.to / 1000)));
    } else {
      params.set('range', interval.endsWith('m') ? '5d' : '1y');
    }
    const url = `${BASE}/v8/finance/chart/${encodeURIComponent(symbol)}?${params}`;
    const { chart } = ChartSchema.parse(await this.fetchJson(url, ctx));
    const result = chart.result[0];
    const ts = result.timestamp ?? [];
    const q = result.indicators?.quote?.[0];
    const bars: Bar[] = [];
    for (let i = 0; i < ts.length; i++) {
      const o = q?.open?.[i];
      const h = q?.high?.[i];
      const l = q?.low?.[i];
      const c = q?.close?.[i];
      const v = q?.volume?.[i];
      if ([o, h, l, c].some((x) => typeof x !== 'number')) {
        continue;
      }
      bars.push({
        t: ts[i] * 1000,
        o: o as number,
        h: h as number,
        l: l as number,
        c: c as number,
        v: typeof v === 'number' ? v : 0,
      });
    }
    return range.limit ? bars.slice(-range.limit) : bars;
  }

  async searchInstruments(
    query: string,
    ctx: ProviderCtx,
  ): Promise<Instrument[]> {
    const url = `${BASE}/v1/finance/search?q=${encodeURIComponent(query)}`;
    const { quotes } = SearchSchema.parse(await this.fetchJson(url, ctx));
    return quotes
      .filter((r) => r.quoteType && QUOTE_TYPE[r.quoteType])
      .map((r) => ({
        symbol: r.symbol,
        name: r.longname ?? r.shortname ?? r.symbol,
        assetClass: QUOTE_TYPE[r.quoteType as string],
        exchange: r.exchange,
        currency: 'USD',
      }));
  }

  async validateKey(): Promise<KeyValidation> {
    return { valid: true, detail: 'Yahoo is keyless' };
  }
}
