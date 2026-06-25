import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mkdtempSync,
  rmSync,
  existsSync,
  statSync,
  writeFileSync,
  readFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SecureStore, type Vault } from './secureStore';

let dir: string;
let file: string;

/** A fake vault: "encrypts" by prefixing, decrypts by stripping. */
function fakeVault(overrides: Partial<Vault> = {}): Vault {
  return {
    isEncryptionAvailable: () => true,
    getSelectedStorageBackend: () => 'gnome-libsecret',
    encryptString: (s) => Buffer.from(`enc:${s}`),
    decryptString: (b) => b.toString('utf8').replace(/^enc:/, ''),
    ...overrides,
  };
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'dayone-vault-'));
  file = join(dir, 'credentials.json');
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('SecureStore (secure backend)', () => {
  it('round-trips credentials and persists to disk', () => {
    const store = new SecureStore({
      filePath: file,
      vault: fakeVault(),
      platform: 'linux',
    });
    expect(store.encryptionSecure).toBe(true);
    const result = store.setCredentials('finnhub', { apiKey: 'secret-123' });
    expect(result.persisted).toBe(true);
    expect(existsSync(file)).toBe(true);
    // A fresh instance reads it back from disk (not just memory).
    const reopened = new SecureStore({
      filePath: file,
      vault: fakeVault(),
      platform: 'linux',
    });
    expect(reopened.getCredentials('finnhub')).toEqual({
      apiKey: 'secret-123',
    });
  });

  it('writes the credentials file 0600', () => {
    const store = new SecureStore({
      filePath: file,
      vault: fakeVault(),
      platform: 'linux',
    });
    store.setCredentials('x', { apiKey: 'k' });
    expect(statSync(file).mode & 0o777).toBe(0o600);
  });

  it('never writes the plaintext key to disk', () => {
    const store = new SecureStore({
      filePath: file,
      vault: fakeVault(),
      platform: 'linux',
    });
    store.setCredentials('x', { apiKey: 'PLAINTEXT_SECRET' });
    expect(readFileSync(file, 'utf8')).not.toContain('PLAINTEXT_SECRET');
  });

  it('clears credentials', () => {
    const store = new SecureStore({
      filePath: file,
      vault: fakeVault(),
      platform: 'linux',
    });
    store.setCredentials('x', { apiKey: 'k' });
    store.clearCredentials('x');
    expect(store.hasCredentials('x')).toBe(false);
  });
});

describe('SecureStore (insecure / basic_text backend)', () => {
  it('refuses to persist and keeps keys in memory only', () => {
    const vault = fakeVault({ getSelectedStorageBackend: () => 'basic_text' });
    const store = new SecureStore({ filePath: file, vault, platform: 'linux' });
    expect(store.encryptionSecure).toBe(false);
    const result = store.setCredentials('x', { apiKey: 'k' });
    expect(result.persisted).toBe(false);
    expect(existsSync(file)).toBe(false); // nothing written to disk
    expect(store.getCredentials('x')).toEqual({ apiKey: 'k' }); // memory only
  });
});

describe('SecureStore (degraded)', () => {
  it('treats an undecryptable blob as no key (never throws)', () => {
    const store = new SecureStore({
      filePath: file,
      vault: fakeVault({
        decryptString: () => {
          throw new Error('bad ciphertext');
        },
      }),
      platform: 'linux',
    });
    store.setCredentials('x', { apiKey: 'k' }); // caches in memory
    // A fresh instance can't decrypt → undefined, no throw.
    const reopened = new SecureStore({
      filePath: file,
      vault: fakeVault({
        decryptString: () => {
          throw new Error('bad ciphertext');
        },
      }),
      platform: 'linux',
    });
    expect(reopened.getCredentials('x')).toBeUndefined();
  });

  it('tolerates a corrupt credentials file', () => {
    writeFileSync(file, 'not json');
    const store = new SecureStore({
      filePath: file,
      vault: fakeVault(),
      platform: 'linux',
    });
    expect(store.getCredentials('x')).toBeUndefined();
  });
});
