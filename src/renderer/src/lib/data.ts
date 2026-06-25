import { DataError, parseSectorData, type SectorData } from '@shared/types';

/**
 * Validate and load a dataset (FR-1). Runs the Zod schema, then enforces that
 * each sector's closes are in strictly ascending date order (no duplicates).
 * Throws a {@link DataError} the renderer turns into a designed error state.
 */
export function loadSectorData(input: unknown): SectorData {
  const data = parseSectorData(input);
  for (const sector of data.sectors) {
    for (let i = 1; i < sector.closes.length; i++) {
      if (sector.closes[i].date <= sector.closes[i - 1].date) {
        throw new DataError(
          `Sector "${sector.key}" has non-ascending or duplicate dates`,
        );
      }
    }
  }
  return data;
}
