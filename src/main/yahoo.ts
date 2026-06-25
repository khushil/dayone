import {
  parseSectorData,
  type RefreshResult,
  type Sector,
  type SectorData,
} from '../shared/types';

/** A tracked sector and its SPDR sector ETF. */
interface SectorMeta {
  key: string;
  name: string;
  symbol: string;
  color: string;
}

/** The 11 GICS sectors. Single source of truth for the fetch + refresh paths. */
export const SECTOR_UNIVERSE: readonly SectorMeta[] = [
  { key: 'tech', name: 'Technology', symbol: 'XLK', color: '#5b8def' },
  {
    key: 'comm',
    name: 'Communication Services',
    symbol: 'XLC',
    color: '#9b6cf0',
  },
  { key: 'fin', name: 'Financials', symbol: 'XLF', color: '#2dbe9c' },
  { key: 'indu', name: 'Industrials', symbol: 'XLI', color: '#e0a33e' },
  {
    key: 'disc',
    name: 'Consumer Discretionary',
    symbol: 'XLY',
    color: '#e8705a',
  },
  { key: 'matr', name: 'Materials', symbol: 'XLB', color: '#c77d4a' },
  { key: 'hlth', name: 'Health Care', symbol: 'XLV', color: '#4fb3c4' },
  { key: 'stpl', name: 'Consumer Staples', symbol: 'XLP', color: '#7fa86b' },
  { key: 'util', name: 'Utilities', symbol: 'XLU', color: '#6c8aa6' },
  { key: 'real', name: 'Real Estate', symbol: 'XLRE', color: '#b07fa8' },
  { key: 'enrg', name: 'Energy', symbol: 'XLE', color: '#d4574e' },
];

const MONTHS_KEPT = 13; // 13 closes → 12 monthly returns
const TIMEOUT_MS = 8000;

/** Shape of the slice of the Yahoo chart response we consume. */
interface ChartResponse {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: { adjclose?: Array<{ adjclose?: Array<number | null> }> };
      meta?: { regularMarketTime?: number };
    }>;
  };
}

const isoDate = (epochSeconds: number): string =>
  new Date(epochSeconds * 1000).toISOString().slice(0, 10);

/** Turn a chart response into ascending, completed, monthly adjusted closes. */
export function toCloses(
  json: unknown,
  symbol: string,
): Array<{ date: string; close: number }> {
  const result = (json as ChartResponse).chart?.result?.[0];
  const timestamps = result?.timestamp;
  const adjclose = result?.indicators?.adjclose?.[0]?.adjclose;
  const marketTime = result?.meta?.regularMarketTime;
  if (!Array.isArray(timestamps) || !Array.isArray(adjclose) || !marketTime) {
    throw new Error(`${symbol}: unexpected chart shape (not JSON as expected)`);
  }
  const currentMonth = isoDate(marketTime).slice(0, 7);

  const byMonth = new Map<string, { date: string; close: number }>();
  for (let i = 0; i < timestamps.length; i++) {
    const close = adjclose[i];
    if (typeof close !== 'number' || !Number.isFinite(close) || close <= 0) {
      continue;
    }
    const date = isoDate(timestamps[i]);
    const month = date.slice(0, 7);
    if (month >= currentMonth) {
      continue; // drop the in-progress current month
    }
    byMonth.set(month, { date, close: Math.round(close * 100) / 100 });
  }

  const closes = [...byMonth.values()].sort((a, b) =>
    a.date < b.date ? -1 : 1,
  );
  if (closes.length < MONTHS_KEPT) {
    throw new Error(`${symbol}: only ${closes.length} completed months`);
  }
  return closes.slice(-MONTHS_KEPT);
}

async function fetchChart(
  symbol: string,
  fetchImpl: typeof fetch,
): Promise<unknown> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=2y&interval=1mo`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetchImpl(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (SectorScope)' },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch every sector and assemble a validated snapshot (throws on any failure). */
export async function fetchSnapshot(
  fetchImpl: typeof fetch = fetch,
): Promise<SectorData> {
  const sectors: Sector[] = [];
  for (const meta of SECTOR_UNIVERSE) {
    const closes = toCloses(
      await fetchChart(meta.symbol, fetchImpl),
      meta.symbol,
    );
    sectors.push({ ...meta, closes });
  }
  const generatedAt = sectors
    .map((s) => s.closes[s.closes.length - 1].date)
    .reduce((a, b) => (a > b ? a : b));
  return parseSectorData({
    generatedAt,
    source: 'yahoo-finance v8 chart, adjclose',
    sectors,
  });
}

/** Try a refresh; never throws — returns a typed result so callers keep last-good. */
export async function attemptRefresh(
  fetchImpl: typeof fetch = fetch,
): Promise<RefreshResult> {
  try {
    return { ok: true, data: await fetchSnapshot(fetchImpl) };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : 'refresh failed',
    };
  }
}
