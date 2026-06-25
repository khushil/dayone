import { z } from 'zod';

/**
 * Shared contracts for DayONE, imported by the main, preload, and renderer
 * processes. Zod schemas are the single validator used at both data load and
 * refresh; the TypeScript types are inferred from them so they never drift.
 *
 * The data model stores only **raw monthly adjusted closes** — every derived
 * value (rebased series, returns, breadth) is computed on demand by `lib/`,
 * because those depend on the active time range.
 */

/** A single month's adjusted closing price. `date` is the month-end (YYYY-MM-DD). */
export const ClosePointSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  close: z.number().positive().finite(),
});
export type ClosePoint = z.infer<typeof ClosePointSchema>;

/** One market sector, tracked via its SPDR sector ETF. */
export const SectorSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  symbol: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'color must be a #RRGGBB hex'),
  closes: z.array(ClosePointSchema).min(2),
});
export type Sector = z.infer<typeof SectorSchema>;

/** Number of sectors we track (the 11 GICS sectors). */
export const SECTOR_COUNT = 11;

/** Selectable look-back ranges for the dashboard. */
export type TimeRange = '1M' | '3M' | '6M' | 'YTD' | '12M';

/** The full dataset: a dated snapshot of every sector's monthly closes. */
export const SectorDataSchema = z.object({
  generatedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'generatedAt must be YYYY-MM-DD'),
  source: z.string().min(1),
  sectors: z.array(SectorSchema).length(SECTOR_COUNT),
});
export type SectorData = z.infer<typeof SectorDataSchema>;

/**
 * Result of an IPC data load/refresh. A discriminated union so failures cross
 * the bridge as data, never as a thrown exception.
 */
export type RefreshResult =
  | { ok: true; data: SectorData }
  | { ok: false; reason: string };

/** The minimal, typed surface the preload exposes on `window.api`. */
export interface DayoneApi {
  /** Load the committed snapshot (or the last good refreshed copy). */
  loadData(): Promise<RefreshResult>;
  /** Best-effort refresh from the network; keeps last-good data on failure. */
  refreshData(): Promise<RefreshResult>;
}

/** Raised when input data is missing or fails schema validation (FR-1). */
export class DataError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'DataError';
  }
}

/**
 * Parse and validate an unknown value as {@link SectorData}, throwing a
 * {@link DataError} with a readable message on failure.
 */
export function parseSectorData(input: unknown): SectorData {
  const result = SectorDataSchema.safeParse(input);
  if (!result.success) {
    throw new DataError(`Invalid sector data: ${result.error.message}`, {
      cause: result.error,
    });
  }
  return result.data;
}
