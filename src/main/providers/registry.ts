import type { ProviderInfo } from '../../shared/instruments';
import type { DataProvider } from './provider';

/** Holds the registered data providers and exposes renderer-safe descriptions. */
export class ProviderRegistry {
  private readonly providers = new Map<string, DataProvider>();

  register(provider: DataProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(id: string): DataProvider | undefined {
    return this.providers.get(id);
  }

  list(): DataProvider[] {
    return [...this.providers.values()];
  }

  /** Renderer-safe metadata (never exposes credentials). */
  describe(): ProviderInfo[] {
    return this.list().map((p) => ({
      id: p.id,
      name: p.name,
      requiresKey: p.requiresKey,
      credentialFields: p.credentialFields,
      capabilities: p.capabilities,
    }));
  }
}
