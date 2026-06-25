import { describe, it, expect } from 'vitest';
import { DataError } from '@shared/types';
import { loadFixture } from '../../../../tests/support/fixture';
import { loadSectorData } from './data';

const fixtureData = loadFixture();

describe('loadSectorData', () => {
  it('loads the fixture with all 11 sectors', () => {
    expect(loadSectorData(fixtureData).sectors).toHaveLength(11);
  });

  it('rejects non-ascending or duplicate dates', () => {
    const bad = structuredClone(fixtureData);
    bad.sectors[0].closes[1].date = bad.sectors[0].closes[0].date;
    expect(() => loadSectorData(bad)).toThrow(DataError);
  });
});
