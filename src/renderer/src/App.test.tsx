import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { loadFixture } from '../../../tests/support/fixture';
import { App } from './App';

// The performance chart uses ECharts, which we keep out of jsdom tests.
vi.mock('./components/PerformanceChart', () => ({
  PerformanceChart: () => <div data-testid="performance-chart" />,
}));

const data = loadFixture();

beforeEach(() => {
  window.api.loadData = vi.fn().mockResolvedValue({ ok: true, data });
});

describe('App (integration)', () => {
  it('loads data over IPC and composes the full dashboard', async () => {
    render(<App />);
    // The chart only mounts once data has loaded and status is "ready".
    expect(await screen.findByTestId('performance-chart')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument(); // returns matrix
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(11); // rail
    expect(screen.getAllByText('Technology').length).toBeGreaterThan(0);
  });
});
