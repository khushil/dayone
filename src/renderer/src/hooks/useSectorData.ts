import { useCallback, useEffect } from 'react';
import { useAppStore } from '../store';
import { loadSectorData } from '../lib/data';

/** Load the snapshot via IPC on mount, validating it again before storing. */
export function useLoadSectorData(): void {
  const setData = useAppStore((s) => s.setData);
  const setError = useAppStore((s) => s.setError);

  useEffect(() => {
    let active = true;
    void window.api
      .loadData()
      .then((result) => {
        if (!active) {
          return;
        }
        if (result.ok) {
          setData(loadSectorData(result.data));
        } else {
          setError(result.reason);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load data');
        }
      });
    return () => {
      active = false;
    };
  }, [setData, setError]);
}

/** Trigger a best-effort refresh; keeps last-good data and notices on failure. */
export function useRefresh(): () => Promise<void> {
  const setData = useAppStore((s) => s.setData);
  const setNotice = useAppStore((s) => s.setNotice);
  const setRefreshing = useAppStore((s) => s.setRefreshing);

  return useCallback(async () => {
    setRefreshing(true);
    setNotice(null);
    try {
      const result = await window.api.refreshData();
      if (result.ok) {
        setData(loadSectorData(result.data));
      } else {
        setNotice(
          `Refresh failed — showing the last update. (${result.reason})`,
        );
      }
    } catch (err) {
      setNotice(
        `Refresh failed — showing the last update. (${err instanceof Error ? err.message : 'unknown error'})`,
      );
    } finally {
      setRefreshing(false);
    }
  }, [setData, setNotice, setRefreshing]);
}
