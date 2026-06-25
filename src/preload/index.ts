import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import type { SectorScopeApi } from '../shared/types';

/**
 * Preload bridge. Context isolation is always enabled, so the renderer reaches
 * the main process only through this minimal, typed surface.
 */
const api: SectorScopeApi = {
  loadData: () => ipcRenderer.invoke('sectorscope:load-data'),
  refreshData: () => ipcRenderer.invoke('sectorscope:refresh-data'),
};

contextBridge.exposeInMainWorld('electron', electronAPI);
contextBridge.exposeInMainWorld('api', api);
