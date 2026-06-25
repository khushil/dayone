import { describe, it, expect } from 'vitest';
import { direction, formatMonth, formatPercent } from './format';

describe('formatPercent', () => {
  it('always shows a sign for non-zero values, to one decimal', () => {
    expect(formatPercent(0.243)).toBe('+24.3%');
    expect(formatPercent(-0.071)).toBe('-7.1%');
  });

  it('shows zero without a sign and normalizes -0', () => {
    expect(formatPercent(0)).toBe('0.0%');
    expect(formatPercent(-0)).toBe('0.0%');
  });

  it('renders non-finite values as an em dash', () => {
    expect(formatPercent(Number.NaN)).toBe('—');
    expect(formatPercent(Number.POSITIVE_INFINITY)).toBe('—');
  });
});

describe('formatMonth', () => {
  it('formats YYYY-MM and YYYY-MM-DD as "Mon YYYY"', () => {
    expect(formatMonth('2025-07')).toBe('Jul 2025');
    expect(formatMonth('2025-07-31')).toBe('Jul 2025');
  });
});

describe('direction', () => {
  it('maps sign to gain/loss/neutral', () => {
    expect(direction(0.1)).toBe('gain');
    expect(direction(-0.1)).toBe('loss');
    expect(direction(0)).toBe('neutral');
  });
});
