import type { Sector, SectorData, TimeRange } from '@shared/types';
import { sliceByRange } from './ranges';
import {
  monthlyReturns,
  periodReturn,
  rebaseToHundred,
  type MonthlyReturn,
} from './returns';

/** Everything the UI needs for one sector over the active range. */
export interface SectorView {
  sector: Sector;
  months: string[];
  rebased: number[];
  returns: MonthlyReturn[];
  periodReturn: number;
}

/** Derive a sector's view (sliced + rebased + returns) for the active range. */
export function buildSectorView(
  sector: Sector,
  range: TimeRange,
  asOf: string,
): SectorView {
  const sliced = sliceByRange(sector.closes, range, asOf);
  return {
    sector,
    months: sliced.map((c) => c.date.slice(0, 7)),
    rebased: rebaseToHundred(sliced),
    returns: monthlyReturns(sliced),
    periodReturn: periodReturn(sliced),
  };
}

/** Views for the currently selected sectors, in dataset order. */
export function buildViews(
  data: SectorData,
  range: TimeRange,
  selected: ReadonlySet<string>,
): SectorView[] {
  return data.sectors
    .filter((sector) => selected.has(sector.key))
    .map((sector) => buildSectorView(sector, range, data.generatedAt));
}
