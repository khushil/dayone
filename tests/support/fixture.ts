import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parseSectorData, type SectorData } from '../../src/shared/types';

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = resolve(here, '../fixtures/sectors.fixture.json');

/**
 * Load the frozen test fixture, validated through the production schema. This
 * is the single source of truth for every value-asserting test; it is never
 * written by the app or the data-fetch path.
 */
export function loadFixture(): SectorData {
  return parseSectorData(JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')));
}
