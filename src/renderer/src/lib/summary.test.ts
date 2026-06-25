import { describe, it, expect } from 'vitest';
import { loadFixture } from '../../../../tests/support/fixture';
import { bestWorstSector, marketBreadth } from './summary';

const data = loadFixture();

describe('bestWorstSector', () => {
  it('finds the best and worst sector over twelve months', () => {
    const { best, worst } = bestWorstSector(data, '12M');
    expect(best.name).toBe('Technology');
    expect(worst.name).toBe('Energy');
  });
});

describe('marketBreadth', () => {
  it('counts the advancing sectors', () => {
    expect(marketBreadth(data, '12M')).toEqual({ advancing: 8, total: 11 });
  });
});
