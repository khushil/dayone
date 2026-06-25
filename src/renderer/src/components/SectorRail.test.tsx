import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { loadFixture } from '../../../../tests/support/fixture';
import { useAppStore } from '../store';
import { SectorRail } from './SectorRail';

const data = loadFixture();

beforeEach(() => {
  useAppStore.getState().setData(data);
});

describe('SectorRail (FR-6)', () => {
  it('renders all 11 sectors, all selected', () => {
    render(<SectorRail data={data} range="12M" />);
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(11);
  });

  it('deselects a sector when clicked', async () => {
    render(<SectorRail data={data} range="12M" />);
    const tech = screen.getByRole('button', { name: /Technology/ });
    expect(tech).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(tech);
    expect(tech).toHaveAttribute('aria-pressed', 'false');
    expect(useAppStore.getState().selected.has('tech')).toBe(false);
  });
});
