import { useCallback, useEffect, useState } from 'react';
import type {
  CredentialRecord,
  KeyCheck,
  KeysStatus,
  ProviderInfo,
} from '@shared/instruments';

export interface ProvidersController {
  providers: ProviderInfo[];
  status: KeysStatus | null;
  setKey: (id: string, record: CredentialRecord) => Promise<void>;
  clearKey: (id: string) => Promise<void>;
  validateKey: (id: string) => Promise<KeyCheck>;
}

/**
 * The single IPC seam for provider/key management (mirrors `useSectorData` —
 * components never touch `window.api` directly). Loads providers + key status
 * when `active` becomes true and keeps status fresh after mutations.
 */
export function useProviders(active: boolean): ProvidersController {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [status, setStatus] = useState<KeysStatus | null>(null);

  const refreshStatus = useCallback(async () => {
    setStatus(await window.api.keysStatus());
  }, []);

  useEffect(() => {
    if (!active) {
      return;
    }
    let alive = true;
    void (async () => {
      const [list, st] = await Promise.all([
        window.api.listProviders(),
        window.api.keysStatus(),
      ]);
      if (alive) {
        setProviders(list);
        setStatus(st);
      }
    })();
    return () => {
      alive = false;
    };
  }, [active]);

  const setKey = useCallback(
    async (id: string, record: CredentialRecord) => {
      await window.api.setKey(id, record);
      await refreshStatus();
    },
    [refreshStatus],
  );

  const clearKey = useCallback(
    async (id: string) => {
      await window.api.clearKey(id);
      await refreshStatus();
    },
    [refreshStatus],
  );

  const validateKey = useCallback(
    (id: string) => window.api.validateKey(id),
    [],
  );

  return { providers, status, setKey, clearKey, validateKey };
}
