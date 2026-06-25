import { writeFileSync, renameSync } from 'node:fs';
import type { RefreshResult, SectorData } from '../shared/types';
import { attemptRefresh } from './yahoo';
import { userDataPath } from './data';

/** Persist a refreshed snapshot to userData atomically (temp write + rename). */
function writeUserData(data: SectorData): void {
  const target = userDataPath();
  const tmp = `${target}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n');
  renameSync(tmp, target);
}

/**
 * Best-effort network refresh (FR-9). Fetches a fresh snapshot, writes it only
 * to userData (never the read-only app bundle), and returns a typed result. On
 * any failure the committed data is untouched and the renderer keeps last-good.
 */
export async function refreshData(): Promise<RefreshResult> {
  const result = await attemptRefresh();
  if (result.ok) {
    try {
      writeUserData(result.data);
    } catch (err) {
      // Fresh data is still returned for this session even if persisting failed.
      console.error('Failed to persist refreshed data:', err);
    }
  }
  return result;
}
