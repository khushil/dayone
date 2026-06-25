import type { DayoneApi } from '../shared/types';

declare global {
  interface Window {
    api: DayoneApi;
  }
}
