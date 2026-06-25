import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SecureStore, type Vault } from './secureStore';
import { ProviderRegistry } from '../providers/registry';
import { registerKeyIpc, sanitize } from './keyIpc';
import type { IpcMain } from 'electron';
import type {
  DataProvider,
  KeyValidation,
  ProviderCtx,
} from '../providers/provider';
import type {
  Bar,
  CredentialRecord,
  Instrument,
  Quote,
} from '../../shared/instruments';

function fakeVault(): Vault {
  return {
    isEncryptionAvailable: () => true,
    getSelectedStorageBackend: () => 'gnome-libsecret',
    encryptString: (s) => Buffer.from(`enc:${s}`),
    decryptString: (b) => b.toString('utf8').replace(/^enc:/, ''),
  };
}

/** A keyed provider whose validate reason deliberately echoes the key. */
class LeakyProvider implements DataProvider {
  readonly id = 'fake';
  readonly name = 'Fake';
  readonly requiresKey = true;
  readonly credentialFields: Array<keyof CredentialRecord> = ['apiKey'];
  readonly capabilities = {
    equity: {
      quotes: true,
      bars: false,
      intradayBars: false,
      streaming: false,
    },
  };
  toProviderSymbol(s: string): string {
    return s;
  }
  fromProviderSymbol(s: string): string {
    return s;
  }
  async searchInstruments(): Promise<Instrument[]> {
    return [];
  }
  async getQuote(): Promise<Quote> {
    throw new Error('not used');
  }
  async getBars(): Promise<Bar[]> {
    return [];
  }
  async validateKey(ctx: ProviderCtx): Promise<KeyValidation> {
    const key = ctx.credentials?.apiKey;
    return key
      ? { valid: true, detail: `validated with ${key}` }
      : { valid: false, detail: 'no-key' };
  }
}

interface FakeIpc {
  handle(channel: string, fn: (...args: unknown[]) => unknown): void;
  invoke(channel: string, ...args: unknown[]): unknown;
}

function fakeIpc(): FakeIpc {
  const handlers: Record<string, (...a: unknown[]) => unknown> = {};
  return {
    handle: (channel, fn) => {
      handlers[channel] = fn;
    },
    invoke: (channel, ...args) => handlers[channel]({}, ...args),
  };
}

let dir: string;
let store: SecureStore;
let registry: ProviderRegistry;
let ipc: FakeIpc;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'dayone-keyipc-'));
  store = new SecureStore({
    filePath: join(dir, 'credentials.json'),
    vault: fakeVault(),
    platform: 'linux',
  });
  registry = new ProviderRegistry();
  registry.register(new LeakyProvider());
  ipc = fakeIpc();
  registerKeyIpc(ipc as unknown as IpcMain, registry, store);
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('sanitize', () => {
  it('redacts stored secrets from a reason string', () => {
    expect(sanitize('validated with SEKRET', ['SEKRET'])).toBe(
      'validated with ***',
    );
  });
});

describe('key IPC', () => {
  it('sets, reports status, validates (scrubbed), and clears', async () => {
    expect((await ipc.invoke('dayone:keys-status')) as unknown).toMatchObject({
      secure: true,
      hasKey: { fake: false },
    });

    const setResult = (await ipc.invoke('dayone:keys-set', 'fake', {
      apiKey: 'SEKRET',
    })) as { persisted: boolean };
    expect(setResult.persisted).toBe(true);

    const status = (await ipc.invoke('dayone:keys-status')) as {
      hasKey: Record<string, boolean>;
    };
    expect(status.hasKey.fake).toBe(true);

    const validation = (await ipc.invoke('dayone:keys-validate', 'fake')) as {
      valid: boolean;
      detail?: string;
    };
    expect(validation.valid).toBe(true);
    expect(validation.detail).not.toContain('SEKRET'); // scrubbed
    expect(validation.detail).toContain('***');

    await ipc.invoke('dayone:keys-clear', 'fake');
    const after = (await ipc.invoke('dayone:keys-status')) as {
      hasKey: Record<string, boolean>;
    };
    expect(after.hasKey.fake).toBe(false);
  });

  it('reports unknown-provider without throwing', async () => {
    const result = (await ipc.invoke('dayone:keys-validate', 'nope')) as {
      valid: boolean;
      detail?: string;
    };
    expect(result).toEqual({ valid: false, detail: 'unknown-provider' });
  });
});
