// Generates tests/fixtures/sectors.fixture.json — the FROZEN, deterministic
// dataset every value-asserting test reads. By construction: Technology is the
// best performer, Energy the worst, and 8 of 11 sectors advance. No randomness,
// no wall-clock, so the expected values never drift. This is the ONLY writer of
// tests/fixtures/. Run with: npm run make-fixture
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, '../tests/fixtures/sectors.fixture.json');

// 13 month-end dates → 12 monthly returns.
const DATES = [
  '2025-06-30',
  '2025-07-31',
  '2025-08-31',
  '2025-09-30',
  '2025-10-31',
  '2025-11-30',
  '2025-12-31',
  '2026-01-31',
  '2026-02-28',
  '2026-03-31',
  '2026-04-30',
  '2026-05-31',
  '2026-06-30',
];

// key, name, symbol, color, start price, constant monthly growth rate.
const SECTORS = [
  ['tech', 'Technology', 'XLK', '#5b8def', 200, 0.018],
  ['comm', 'Communication Services', 'XLC', '#9b6cf0', 95, 0.015],
  ['fin', 'Financials', 'XLF', '#2dbe9c', 45, 0.012],
  ['indu', 'Industrials', 'XLI', '#e0a33e', 130, 0.01],
  ['disc', 'Consumer Discretionary', 'XLY', '#e8705a', 205, 0.008],
  ['matr', 'Materials', 'XLB', '#c77d4a', 90, 0.005],
  ['hlth', 'Health Care', 'XLV', '#4fb3c4', 145, 0.004],
  ['stpl', 'Consumer Staples', 'XLP', '#7fa86b', 80, 0.002],
  ['util', 'Utilities', 'XLU', '#6c8aa6', 75, -0.001],
  ['real', 'Real Estate', 'XLRE', '#b07fa8', 42, -0.003],
  ['enrg', 'Energy', 'XLE', '#d4574e', 90, -0.006],
];

const round2 = (n) => Math.round(n * 100) / 100;

const sectors = SECTORS.map(([key, name, symbol, color, start, rate]) => ({
  key,
  name,
  symbol,
  color,
  closes: DATES.map((date, i) => ({
    date,
    close: round2(start * Math.pow(1 + rate, i)),
  })),
}));

const data = {
  generatedAt: DATES[DATES.length - 1],
  source: 'synthetic-fixture (deterministic)',
  sectors,
};

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(data, null, 2) + '\n');

// Report the constructed outcome for documentation.
const totals = sectors
  .map((s) => ({
    name: s.name,
    total: s.closes.at(-1).close / s.closes[0].close - 1,
  }))
  .sort((a, b) => b.total - a.total);
const advancing = totals.filter((t) => t.total > 0).length;
console.log(`Wrote ${out}`);
console.log(
  `Best:  ${totals[0].name} (${(totals[0].total * 100).toFixed(1)}%)`,
);
console.log(
  `Worst: ${totals.at(-1).name} (${(totals.at(-1).total * 100).toFixed(1)}%)`,
);
console.log(`Breadth: ${advancing} / ${sectors.length} advancing`);
