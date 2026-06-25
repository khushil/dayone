import { create } from 'zustand';
import type { SectorData, TimeRange } from '@shared/types';

export type Theme = 'dark' | 'light';
type Status = 'loading' | 'ready' | 'error';

function readBool(key: string, fallback: boolean): boolean {
  const value = globalThis.localStorage?.getItem(key);
  return value === null || value === undefined ? fallback : value === 'true';
}

function readTheme(): Theme {
  return globalThis.localStorage?.getItem('theme') === 'light'
    ? 'light'
    : 'dark';
}

interface AppState {
  data: SectorData | null;
  status: Status;
  error: string | null;
  notice: string | null;
  refreshing: boolean;
  selected: ReadonlySet<string>;
  range: TimeRange;
  theme: Theme;
  cvd: boolean;
  hoveredMonth: string | null;
  setData: (data: SectorData) => void;
  setError: (reason: string) => void;
  setNotice: (message: string | null) => void;
  setRefreshing: (refreshing: boolean) => void;
  toggleSector: (key: string) => void;
  setRange: (range: TimeRange) => void;
  toggleTheme: () => void;
  toggleCvd: () => void;
  setHoveredMonth: (month: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  data: null,
  status: 'loading',
  error: null,
  notice: null,
  refreshing: false,
  selected: new Set<string>(),
  range: '12M',
  theme: readTheme(),
  cvd: readBool('cvd', false),
  hoveredMonth: null,

  setData: (data) =>
    set({
      data,
      status: 'ready',
      error: null,
      selected: new Set(data.sectors.map((s) => s.key)),
    }),
  setError: (reason) => set({ status: 'error', error: reason }),
  setNotice: (notice) => set({ notice }),
  setRefreshing: (refreshing) => set({ refreshing }),

  toggleSector: (key) =>
    set((state) => {
      const next = new Set(state.selected);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return { selected: next };
    }),

  setRange: (range) => set({ range }),

  toggleTheme: () =>
    set((state) => {
      const theme: Theme = state.theme === 'dark' ? 'light' : 'dark';
      globalThis.localStorage?.setItem('theme', theme);
      return { theme };
    }),

  toggleCvd: () =>
    set((state) => {
      const cvd = !state.cvd;
      globalThis.localStorage?.setItem('cvd', String(cvd));
      return { cvd };
    }),

  setHoveredMonth: (hoveredMonth) => set({ hoveredMonth }),
}));
