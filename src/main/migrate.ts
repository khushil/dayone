import { existsSync, mkdirSync, copyFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Files carried over from the legacy SectorScope userData directory. */
const MIGRATABLE = ['sectors.json', 'dayone-prefs.json', 'credentials.json'];

const MARKER = '.migrated-from-sectorscope';

/**
 * One-time migration of the legacy SectorScope userData directory into DayONE's.
 * Renaming the app moved `app.getPath('userData')` from …/SectorScope to
 * …/DayONE, orphaning the cached snapshot and (future) settings/keys. Pure and
 * idempotent — a marker file prevents re-copying, and existing files are never
 * overwritten. Returns the names copied.
 */
export function migrateUserData(
  legacyDir: string,
  newDir: string,
): { migrated: string[] } {
  const marker = join(newDir, MARKER);
  if (existsSync(marker) || !existsSync(legacyDir)) {
    return { migrated: [] };
  }
  mkdirSync(newDir, { recursive: true });
  const migrated: string[] = [];
  for (const name of MIGRATABLE) {
    const src = join(legacyDir, name);
    const dest = join(newDir, name);
    if (existsSync(src) && !existsSync(dest)) {
      copyFileSync(src, dest);
      migrated.push(name);
    }
  }
  writeFileSync(marker, 'migrated\n');
  return { migrated };
}
