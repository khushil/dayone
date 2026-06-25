import type {
  Bar,
  Capabilities,
  CredentialRecord,
  Instrument,
  Quote,
  Timeframe,
} from '../../shared/instruments';

/** Per-call context. Credentials live only in main; fetch/socket are injectable for tests. */
export interface ProviderCtx {
  credentials?: CredentialRecord;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}

/** A historical-bar request. `from`/`to` are epoch ms; `limit` caps the count. */
export interface BarRange {
  timeframe: Timeframe;
  from?: number;
  to?: number;
  limit?: number;
}

/** Outcome of a per-provider key check. */
export interface KeyValidation {
  valid: boolean;
  detail?: string;
}

/**
 * A market-data provider. Adapters translate canonical symbols to/from their own
 * vocabulary, validate their own payloads, and never let a symbol or payload
 * determine the request host (see {@link assertAllowedHost}). Streaming
 * (`openStream`) is added in the streaming phase.
 */
export interface DataProvider {
  readonly id: string;
  readonly name: string;
  readonly requiresKey: boolean;
  readonly credentialFields: Array<keyof CredentialRecord>;
  readonly capabilities: Capabilities;

  toProviderSymbol(canonical: string): string;
  fromProviderSymbol(raw: string): string;

  searchInstruments(query: string, ctx: ProviderCtx): Promise<Instrument[]>;
  getQuote(symbol: string, ctx: ProviderCtx): Promise<Quote>;
  getBars(symbol: string, range: BarRange, ctx: ProviderCtx): Promise<Bar[]>;
  validateKey(ctx: ProviderCtx): Promise<KeyValidation>;
}

/**
 * Guard every outbound request against a hardcoded per-adapter allowlist so no
 * symbol/payload/redirect can redirect a key-bearing request off-host (SSRF /
 * key-misdirection). Hosts are never derived from renderer input.
 */
export function assertAllowedHost(
  url: string,
  allowedHosts: readonly string[],
): void {
  const { host } = new URL(url);
  if (!allowedHosts.includes(host)) {
    throw new Error(`Refusing request to non-allowlisted host: ${host}`);
  }
}
