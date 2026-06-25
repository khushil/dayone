import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// A default window.api double so the renderer can be tested without Electron.
// Individual tests override these to simulate success/failure (FR-9).
window.api = {
  loadData: vi.fn(async () => ({ ok: false, reason: 'not stubbed' })),
  refreshData: vi.fn(async () => ({ ok: false, reason: 'not stubbed' })),
  listProviders: vi.fn(async () => []),
  keysStatus: vi.fn(async () => ({ secure: true, hasKey: {} })),
  setKey: vi.fn(async () => ({ persisted: true })),
  clearKey: vi.fn(async () => undefined),
  validateKey: vi.fn(async () => ({ valid: true })),
};
