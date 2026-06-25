// Best-effort refresh of data/sectors.json, reusing the same fetch + validation
// the in-app Refresh uses (src/main/yahoo.ts) — one source of truth. On any
// failure it keeps the existing committed file so the offline demo never breaks.
// Run with: npm run fetch-data  (verify on the demo machine before relying on it)
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchSnapshot } from '../src/main/yahoo';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '../data/sectors.json');

async function main(): Promise<void> {
  console.log('Fetching 11 sector ETFs from Yahoo Finance …');
  const data = await fetchSnapshot();
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n');
  console.log(
    `Wrote ${OUT} — ${data.sectors.length} sectors, generatedAt ${data.generatedAt}`,
  );
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`fetch-data failed: ${message}`);
  console.error(
    existsSync(OUT)
      ? 'Keeping the existing committed data/sectors.json (offline-safe).'
      : 'No existing data/sectors.json to fall back to.',
  );
  process.exitCode = 1;
});
