/** A fetch stub that returns a canned JSON body (for provider adapter tests). */
export function jsonFetch(
  body: unknown,
  ok = true,
  status = 200,
): typeof fetch {
  return (async () => ({
    ok,
    status,
    json: async () => body,
  })) as unknown as typeof fetch;
}

/** A fetch stub that always rejects (network failure / abort). */
export const failingFetch = (async () => {
  throw new Error('network down');
}) as unknown as typeof fetch;

interface StubBar {
  t: number; // epoch SECONDS (Yahoo timestamps)
  o: number | null;
  h: number | null;
  l: number | null;
  c: number | null;
  v: number | null;
}

/** Build a Yahoo `chart` response with a meta price and optional OHLCV bars. */
export function yahooChart(opts: {
  price?: number;
  prevClose?: number;
  currency?: string;
  bars?: StubBar[];
}): unknown {
  const bars = opts.bars ?? [];
  return {
    chart: {
      result: [
        {
          meta: {
            regularMarketPrice: opts.price ?? 100,
            chartPreviousClose: opts.prevClose,
            currency: opts.currency ?? 'USD',
          },
          timestamp: bars.map((b) => b.t),
          indicators: {
            quote: [
              {
                open: bars.map((b) => b.o),
                high: bars.map((b) => b.h),
                low: bars.map((b) => b.l),
                close: bars.map((b) => b.c),
                volume: bars.map((b) => b.v),
              },
            ],
          },
        },
      ],
    },
  };
}

/** Build a Yahoo `search` response. */
export function yahooSearch(
  quotes: Array<{
    symbol: string;
    shortname?: string;
    quoteType?: string;
    exchange?: string;
  }>,
): unknown {
  return { quotes };
}
