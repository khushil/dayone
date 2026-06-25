import { contextBridge, ipcRenderer } from 'electron';
import type { DayoneApi } from '../shared/types';

/**
 * Preload bridge. Runs in a sandboxed context, so it imports only `electron`
 * (no external node_modules — those can't be required under sandbox) and
 * exposes a single minimal, typed API on `window.api`.
 */
const api: DayoneApi = {
  loadData: () => ipcRenderer.invoke('dayone:load-data'),
  refreshData: () => ipcRenderer.invoke('dayone:refresh-data'),
  listProviders: () => ipcRenderer.invoke('dayone:providers-list'),
  keysStatus: () => ipcRenderer.invoke('dayone:keys-status'),
  setKey: (providerId, record) =>
    ipcRenderer.invoke('dayone:keys-set', providerId, record),
  clearKey: (providerId) => ipcRenderer.invoke('dayone:keys-clear', providerId),
  validateKey: (providerId) =>
    ipcRenderer.invoke('dayone:keys-validate', providerId),
};

contextBridge.exposeInMainWorld('api', api);
