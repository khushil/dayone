import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { loadFixture } from '../../../tests/support/fixture';
import { App } from './App';

vi.mock('./components/PerformanceChart', () => ({
  PerformanceChart: () => <div data-testid="performance-chart" />,
}));

const data = loadFixture();

beforeEach(() => {
  window.api.loadData = vi.fn().mockResolvedValue({ ok: true, data });
});

describe('App accessibility (FR-12)', () => {
  it('has no axe violations on the main dashboard view', async () => {
    const { container } = render(<App />);
    await screen.findByTestId('performance-chart'); // wait until ready
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
