import { ElectronAPI } from '@electron-toolkit/preload';
import { SectorScopeApi } from '../shared/types';

declare global {
  interface Window {
    electron: ElectronAPI;
    api: SectorScopeApi;
  }
}
