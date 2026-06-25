# Data providers

DayONE is **bring-your-own-key**: you supply API keys (free or paid) for the
providers you want, entered in the **Data providers** panel (gear icon, top-right).
Keys are stored encrypted by your OS keychain and never leave your machine.

## The provider interface

Every adapter implements `DataProvider` (`src/main/providers/provider.ts`):

| Method                                    | Purpose                                                      |
| ----------------------------------------- | ------------------------------------------------------------ |
| `getQuote(symbol, ctx)`                   | Latest price → validated `Quote` (price 0 = halted/no-trade) |
| `getBars(symbol, range, ctx)`             | OHLCV history → `Bar[]` (paginated to the provider cap)      |
| `searchInstruments(query, ctx)`           | Find tickers → canonical `Instrument[]`                      |
| `toProviderSymbol` / `fromProviderSymbol` | Map canonical ↔ provider symbol (e.g. `BTC-USD` ↔ `BTCUSDT`) |
| `validateKey(ctx)`                        | Per-provider key check; reason is sanitized of the key       |

Capabilities are declared **per asset class and tier** (`quotes`/`bars`/
`intradayBars`/`streaming` + stream/connection caps), so the UI shows exactly
what your key can do. Each adapter hardcodes an outbound **host allowlist**.

## Rollout (staged — interface proven before scale)

| Wave               | Providers                                                                                                                  | Notes                                                     |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **v2.0** (shipped) | **Yahoo Finance** (keyless)                                                                                                | Foundation adapter; validates the interface without a key |
| **v2.1**           | **Finnhub** (key, US-equity WS) + a **keyless crypto WS** (Coinbase / Binance.US)                                          | Two credential models, before templating                  |
| then               | Polygon/Massive, Alpaca, EODHD                                                                                             | Template proof                                            |
| backlog            | Twelve Data, Tiingo, FMP, Alpha Vantage, Marketstack, Nasdaq Data Link, Intrinio, Databento, Tradier, CoinGecko, Kraken, … | Additive; never release-gating                            |

### Free-tier realities (corrected by review)

- **Polygon/Massive**: free has **no realtime WS** (realtime ≈ paid).
- **EODHD**: WS is **paid-only**; demo key streams 6 fixed tickers.
- **Alpaca**: API **key-ID + secret** (not OAuth); free = IEX, 1 connection / 30 channels.
- **Finnhub**: free = real-time **US-equity trades** (price+volume); other classes may be delayed.
- **Yahoo**: keyless but rate-limited/crumb-gated → best-effort; handle 401/429 gracefully.

## Adding a provider

1. Implement `DataProvider` under `src/main/providers/`, declaring `ALLOWED_HOSTS`,
   `capabilities`, and `credentialFields`.
2. Zod-validate every payload; map to canonical `Quote`/`Bar`/`Instrument`.
3. Register it in `src/main/index.ts`; it appears automatically in the Data
   providers panel.
4. Unit-test normalization with an injected `fetch` stub (`tests/support/providerStub.ts`).

> You accept each provider's Terms of Service by supplying its key. DayONE never
> redistributes provider data.
