import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAppStore } from '../store';
import { ThemeToggle } from './ThemeToggle';

beforeEach(() => {
  globalThis.localStorage?.clear();
  useAppStore.setState({ theme: 'dark' });
});

describe('ThemeToggle (FR-8)', () => {
  it('toggles the theme and persists the choice', async () => {
    render(<ThemeToggle />);
    await userEvent.click(
      screen.getByRole('button', { name: /switch to light theme/i }),
    );
    expect(useAppStore.getState().theme).toBe('light');
    expect(globalThis.localStorage?.getItem('theme')).toBe('light');
  });
});
