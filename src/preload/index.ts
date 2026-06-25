import { contextBridge, ipcRenderer } from 'electron';
import type { SectorScopeApi } from '../shared/types';

/**
 * Preload bridge. Runs in a sandboxed context, so it imports only `electron`
 * (no external node_modules — those can't be required under sandbox) and
 * exposes a single minimal, typed API on `window.api`.
 */
const api: SectorScopeApi = {
  loadData: () => ipcRenderer.invoke('sectorscope:load-data'),
  refreshData: () => ipcRenderer.invoke('sectorscope:refresh-data'),
};

contextBridge.exposeInMainWorld('api', api);
