/** A Yahoo-shaped chart response with 15 monthly points (last = current month). */
export function makeChart(): unknown {
  const timestamps = Array.from(
    { length: 15 },
    (_, i) => Date.UTC(2025, i, 1) / 1000,
  );
  const adjclose = timestamps.map((_, i) => 100 + i);
  return {
    chart: {
      result: [
        {
          timestamp: timestamps,
          indicators: { adjclose: [{ adjclose }] },
          meta: { regularMarketTime: timestamps[timestamps.length - 1] },
        },
      ],
    },
  };
}

/** A fetch stub that always returns valid chart data. */
export const okFetch = (async () => ({
  ok: true,
  json: async () => makeChart(),
})) as unknown as typeof fetch;

/** A fetch stub that always fails, to exercise keep-last-good. */
export const failingFetch = (async () => {
  throw new Error('network down');
}) as unknown as typeof fetch;
