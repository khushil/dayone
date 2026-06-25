import { z } from 'zod';

/**
 * Platform contracts for the multi-provider terminal — instruments, quotes, and
 * bars. Kept separate from the legacy sector types in `types.ts`. Zod schemas
 * validate every provider payload at the boundary (no cast-and-hope).
 */

export const ASSET_CLASSES = [
  'equity',
  'etf',
  'index',
  'crypto',
  'forex',
  'future',
  'option',
] as const;
export const AssetClassSchema = z.enum(ASSET_CLASSES);
export type AssetClass = z.infer<typeof AssetClassSchema>;

export const TIMEFRAMES = [
  '1m',
  '5m',
  '15m',
  '1h',
  '1d',
  '1wk',
  '1mo',
] as const;
export const TimeframeSchema = z.enum(TIMEFRAMES);
export type Timeframe = z.infer<typeof TimeframeSchema>;

/** A tradable instrument, identified by a canonical (provider-agnostic) symbol. */
export const InstrumentSchema = z.object({
  symbol: z.string().min(1),
  name: z.string().min(1),
  assetClass: AssetClassSchema,
  exchange: z.string().optional(),
  currency: z.string().min(1),
});
export type Instrument = z.infer<typeof InstrumentSchema>;

/** A point-in-time quote. `price` 0 is a legitimate halted/no-trade state. */
export const QuoteSchema = z.object({
  symbol: z.string().min(1),
  price: z.number().finite().nonnegative(),
  ts: z.number().int().nonnegative(),
  currency: z.string().min(1),
  change: z.number().finite().optional(),
  changePct: z.number().finite().optional(),
  bid: z.number().finite().nonnegative().optional(),
  ask: z.number().finite().nonnegative().optional(),
  volume: z.number().finite().nonnegative().optional(),
  stale: z.boolean().optional(),
});
export type Quote = z.infer<typeof QuoteSchema>;

/** An OHLCV bar. `t` is epoch ms (UTC). */
export const BarSchema = z.object({
  t: z.number().int().nonnegative(),
  o: z.number().finite().nonnegative(),
  h: z.number().finite().nonnegative(),
  l: z.number().finite().nonnegative(),
  c: z.number().finite().nonnegative(),
  v: z.number().finite().nonnegative(),
});
export type Bar = z.infer<typeof BarSchema>;

/** What a provider can do for one asset class on the active key's tier. */
export interface AssetCapability {
  quotes: boolean;
  bars: boolean;
  intradayBars: boolean;
  streaming: boolean;
  maxStreamSymbols?: number;
  maxConnections?: number;
}
export type Capabilities = Partial<Record<AssetClass, AssetCapability>>;

/** The credential fields a provider may need (key, key+secret, or token). */
export interface CredentialRecord {
  apiKey?: string;
  keyId?: string;
  secret?: string;
  token?: string;
}

/** Renderer-facing description of a registered provider. */
export interface ProviderInfo {
  id: string;
  name: string;
  requiresKey: boolean;
  credentialFields: Array<keyof CredentialRecord>;
  capabilities: Capabilities;
}

/** Per-provider key state surfaced to the renderer (never the key itself). */
export interface KeysStatus {
  secure: boolean;
  hasKey: Record<string, boolean>;
}

/** Result of a key validation (reason is sanitized of any secret). */
export interface KeyCheck {
  valid: boolean;
  detail?: string;
}
