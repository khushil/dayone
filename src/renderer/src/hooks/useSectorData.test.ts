import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { loadFixture } from '../../../../tests/support/fixture';
import { useAppStore } from '../store';
import { useRefresh } from './useSectorData';

const data = loadFixture();

beforeEach(() => {
  useAppStore.getState().setData(data);
  useAppStore.setState({ notice: null });
});

describe('useRefresh (FR-9)', () => {
  it('keeps last-good data and shows a notice when refresh fails', async () => {
    window.api.refreshData = vi
      .fn()
      .mockResolvedValue({ ok: false, reason: 'offline' });
    const { result } = renderHook(() => useRefresh());
    await act(async () => {
      await result.current();
    });
    expect(useAppStore.getState().data).toBe(data); // unchanged
    expect(useAppStore.getState().notice).toMatch(/last update/i);
    expect(useAppStore.getState().refreshing).toBe(false);
  });

  it('clears the notice on a successful refresh', async () => {
    window.api.refreshData = vi.fn().mockResolvedValue({ ok: true, data });
    const { result } = renderHook(() => useRefresh());
    await act(async () => {
      await result.current();
    });
    expect(useAppStore.getState().notice).toBeNull();
  });
});
