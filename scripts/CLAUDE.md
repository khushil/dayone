# scripts — data pipeline & fixtures

Node ESM (`.mjs`). Dev tooling only — not bundled into the app.

- `fetch-data.mjs` — **best-effort** refresh of `data/sectors.json` from the Yahoo Finance chart JSON endpoint (no key, **adjusted close**). Validate every response (reject HTML/non-JSON/non-finite/≤0), sort ascending, de-dupe by month, drop the incomplete current month, keep exactly 13 closes. On any failure, **keep the existing committed file**. Writes only `data/sectors.json`.
- `make-fixture.mjs` — the **only** writer of `tests/fixtures/sectors.fixture.json`. Deterministic (no randomness, no wall-clock); its constructed trends define the expected best/worst/breadth that BDD asserts.

Never perform a live network fetch as part of the app, the tests, or the live demo. Verify any fetch from Node on the demo machine before relying on it.
