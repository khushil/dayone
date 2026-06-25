import type { SectorScopeApi } from '../shared/types';

declare global {
  interface Window {
    api: SectorScopeApi;
  }
}
