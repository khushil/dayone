import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { app } from 'electron';
import { parseSectorData, type RefreshResult } from '../shared/types';

/** The committed snapshot — read-only seed/fallback (project root in dev). */
function bundledPath(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'data', 'sectors.json')
    : join(app.getAppPath(), 'data', 'sectors.json');
}

/** The writable copy a successful Refresh produces (never the app bundle). */
export function userDataPath(): string {
  return join(app.getPath('userData'), 'sectors.json');
}

/**
 * Load sector data from disk, preferring a refreshed copy in `userData` and
 * falling back to the committed snapshot. Always returns a typed result; a
 * missing or corrupt file yields `{ok:false}`, never a throw.
 */
export function readDataFromDisk(): RefreshResult {
  const path = existsSync(userDataPath()) ? userDataPath() : bundledPath();
  try {
    const data = parseSectorData(JSON.parse(readFileSync(path, 'utf8')));
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : 'Failed to load data',
    };
  }
}
