import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { loadFixture } from '../../../../tests/support/fixture';
import { StatCards } from './StatCards';

const data = loadFixture();

describe('StatCards (FR-4, FR-7)', () => {
  it('shows the best and worst sector', () => {
    render(<StatCards data={data} range="12M" />);
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Energy')).toBeInTheDocument();
  });

  it('encodes direction without relying on color (▲/▼ glyphs)', () => {
    render(<StatCards data={data} range="12M" />);
    expect(screen.getByText('▲')).toBeInTheDocument(); // best is a gain
    expect(screen.getByText('▼')).toBeInTheDocument(); // worst is a loss
  });
});
