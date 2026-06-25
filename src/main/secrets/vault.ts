import { safeStorage } from 'electron';
import type { Vault } from './secureStore';

/**
 * A {@link Vault} backed by Electron `safeStorage`. The Linux backend check is
 * wired only on Linux (where `basic_text` can masquerade as encryption); other
 * platforms always use the OS keychain/DPAPI. Call after `app` is ready.
 */
export function electronVault(): Vault {
  return {
    isEncryptionAvailable: () => safeStorage.isEncryptionAvailable(),
    getSelectedStorageBackend:
      process.platform === 'linux'
        ? () => safeStorage.getSelectedStorageBackend()
        : undefined,
    encryptString: (plain) => safeStorage.encryptString(plain),
    decryptString: (encrypted) => safeStorage.decryptString(encrypted),
  };
}
