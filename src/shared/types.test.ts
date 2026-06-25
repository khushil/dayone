import { describe, it, expect } from 'vitest';
import { loadFixture } from '../../tests/support/fixture';
import { DataError, SECTOR_COUNT, parseSectorData } from './types';

describe('parseSectorData', () => {
  it('accepts the frozen fixture and loads all 11 sectors', () => {
    const data = loadFixture();
    expect(data.sectors).toHaveLength(SECTOR_COUNT);
  });

  it('rejects malformed data with a DataError', () => {
    expect(() => parseSectorData({ sectors: [] })).toThrow(DataError);
  });

  it('rejects a sector with a non-positive close', () => {
    const bad = {
      generatedAt: '2026-06-30',
      source: 'test',
      sectors: [
        {
          key: 'x',
          name: 'X',
          symbol: 'X',
          color: '#000000',
          closes: [
            { date: '2025-06-30', close: 0 },
            { date: '2025-07-31', close: 1 },
          ],
        },
      ],
    };
    expect(() => parseSectorData(bad)).toThrow(DataError);
  });
});
