import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  renameSync,
  chmodSync,
} from 'node:fs';
import { dirname } from 'node:path';
import { z } from 'zod';
import type { CredentialRecord } from '../../shared/instruments';

/** The slice of Electron's `safeStorage` we depend on (injectable for tests). */
export interface Vault {
  isEncryptionAvailable(): boolean;
  getSelectedStorageBackend?(): string;
  encryptString(plain: string): Buffer;
  decryptString(encrypted: Buffer): string;
}

// On-disk shape: providerId → base64 ciphertext. Validated before use (the file
// is attacker-writable).
const FileSchema = z.record(z.string(), z.string());

export interface SecureStoreOptions {
  filePath: string;
  vault: Vault;
  platform?: NodeJS.Platform;
}

/**
 * Per-provider credential vault backed by Electron `safeStorage`.
 *
 * Critical Linux caveat: `isEncryptionAvailable()` can return true while the
 * backend is `basic_text` — a hardcoded password, i.e. effectively plaintext.
 * We therefore also check `getSelectedStorageBackend()` and, when insecure,
 * **refuse to persist** (keys are kept in memory for the session only) rather
 * than write secrets we'd falsely call "encrypted". Decryption failures (corrupt
 * or foreign-machine blobs) degrade to "no key", never a crash. Keys are never
 * logged.
 */
export class SecureStore {
  private readonly mem = new Map<string, CredentialRecord>();
  private readonly file: string;
  private readonly vault: Vault;
  private readonly platform: NodeJS.Platform;
  private readonly secure: boolean;

  constructor(opts: SecureStoreOptions) {
    this.file = opts.filePath;
    this.vault = opts.vault;
    this.platform = opts.platform ?? process.platform;
    this.secure = this.computeSecure();
  }

  /** Whether keys are persisted with real OS-backed encryption. */
  get encryptionSecure(): boolean {
    return this.secure;
  }

  private computeSecure(): boolean {
    if (!this.vault.isEncryptionAvailable()) {
      return false;
    }
    if (this.platform === 'linux' && this.vault.getSelectedStorageBackend) {
      return this.vault.getSelectedStorageBackend() !== 'basic_text';
    }
    return true;
  }

  private read(): Record<string, string> {
    if (!existsSync(this.file)) {
      return {};
    }
    try {
      const parsed = FileSchema.safeParse(
        JSON.parse(readFileSync(this.file, 'utf8')),
      );
      return parsed.success ? parsed.data : {};
    } catch {
      return {};
    }
  }

  private write(map: Record<string, string>): void {
    mkdirSync(dirname(this.file), { recursive: true });
    const tmp = `${this.file}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(map), { mode: 0o600 });
    renameSync(tmp, this.file);
    try {
      chmodSync(this.file, 0o600); // POSIX only; on Windows DPAPI/ACL is the control
    } catch {
      /* non-POSIX */
    }
  }

  /** Store credentials. Persists only when encryption is secure; else memory-only. */
  setCredentials(
    providerId: string,
    record: CredentialRecord,
  ): { persisted: boolean } {
    this.mem.set(providerId, record);
    if (!this.secure) {
      return { persisted: false };
    }
    const map = this.read();
    map[providerId] = this.vault
      .encryptString(JSON.stringify(record))
      .toString('base64');
    this.write(map);
    return { persisted: true };
  }

  getCredentials(providerId: string): CredentialRecord | undefined {
    const cached = this.mem.get(providerId);
    if (cached) {
      return cached;
    }
    if (!this.secure) {
      return undefined;
    }
    const b64 = this.read()[providerId];
    if (!b64) {
      return undefined;
    }
    try {
      const record = JSON.parse(
        this.vault.decryptString(Buffer.from(b64, 'base64')),
      ) as CredentialRecord;
      this.mem.set(providerId, record);
      return record;
    } catch {
      return undefined; // corrupt / foreign-machine blob → treat as no key
    }
  }

  hasCredentials(providerId: string): boolean {
    return (
      this.mem.has(providerId) ||
      (this.secure && Boolean(this.read()[providerId]))
    );
  }

  clearCredentials(providerId: string): void {
    this.mem.delete(providerId);
    if (!this.secure) {
      return;
    }
    const map = this.read();
    delete map[providerId];
    this.write(map);
  }
}
