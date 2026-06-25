import type { IpcMain } from 'electron';
import { z } from 'zod';
import type { KeysStatus } from '../../shared/instruments';
import type { ProviderRegistry } from '../providers/registry';
import type { SecureStore } from './secureStore';

const CredentialInput = z.object({
  apiKey: z.string().max(512).optional(),
  keyId: z.string().max(512).optional(),
  secret: z.string().max(512).optional(),
  token: z.string().max(512).optional(),
});

const ProviderId = z.string().min(1).max(64);

/** Redact any stored secret substring before a reason crosses the IPC bridge. */
export function sanitize(
  detail: string | undefined,
  secrets: readonly string[],
): string | undefined {
  if (!detail) {
    return detail;
  }
  let out = detail;
  for (const secret of secrets) {
    if (secret) {
      out = out.split(secret).join('***');
    }
  }
  return out;
}

/**
 * Register the key-management IPC. Credentials only ever travel renderer→main on
 * `set`; nothing returns a key, and `validate` reasons are scrubbed of any
 * stored secret. Inputs are Zod-validated and bounded.
 */
export function registerKeyIpc(
  ipcMain: IpcMain,
  registry: ProviderRegistry,
  store: SecureStore,
): void {
  ipcMain.handle(
    'dayone:keys-status',
    (): KeysStatus => ({
      secure: store.encryptionSecure,
      hasKey: Object.fromEntries(
        registry.list().map((p) => [p.id, store.hasCredentials(p.id)]),
      ),
    }),
  );

  ipcMain.handle(
    'dayone:keys-set',
    (_e, providerId: unknown, record: unknown) => {
      const id = ProviderId.parse(providerId);
      const credentials = CredentialInput.parse(record);
      return store.setCredentials(id, credentials);
    },
  );

  ipcMain.handle('dayone:keys-clear', (_e, providerId: unknown) => {
    store.clearCredentials(ProviderId.parse(providerId));
  });

  ipcMain.handle('dayone:keys-validate', async (_e, providerId: unknown) => {
    const id = ProviderId.parse(providerId);
    const provider = registry.get(id);
    if (!provider) {
      return { valid: false, detail: 'unknown-provider' };
    }
    const credentials = store.getCredentials(id);
    try {
      const result = await provider.validateKey({ credentials });
      const secrets = credentials
        ? (Object.values(credentials).filter(Boolean) as string[])
        : [];
      return { valid: result.valid, detail: sanitize(result.detail, secrets) };
    } catch {
      return { valid: false, detail: 'validation-error' };
    }
  });
}
