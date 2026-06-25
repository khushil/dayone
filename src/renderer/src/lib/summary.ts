import { type Sector, type SectorData, type TimeRange } from '@shared/types';
import { sliceByRange } from './ranges';
import { periodReturn } from './returns';

/** A sector's total return over the active range, anchored to the snapshot date. */
export function sectorPeriodReturn(
  sector: Sector,
  range: TimeRange,
  asOf: string,
): number {
  return periodReturn(sliceByRange(sector.closes, range, asOf));
}

/** The best- and worst-performing sectors over the range. */
export interface BestWorst {
  best: Sector;
  worst: Sector;
}

/**
 * Find the sectors with the highest and lowest return over the range. YTD is
 * anchored to the dataset's `generatedAt`, so the result is deterministic.
 */
export function bestWorstSector(data: SectorData, range: TimeRange): BestWorst {
  const asOf = data.generatedAt;
  let best = data.sectors[0];
  let worst = data.sectors[0];
  let bestReturn = sectorPeriodReturn(best, range, asOf);
  let worstReturn = bestReturn;
  for (const sector of data.sectors) {
    const value = sectorPeriodReturn(sector, range, asOf);
    if (value > bestReturn) {
      bestReturn = value;
      best = sector;
    }
    if (value < worstReturn) {
      worstReturn = value;
      worst = sector;
    }
  }
  return { best, worst };
}

/** How many sectors advanced over the range, out of the total. */
export interface Breadth {
  advancing: number;
  total: number;
}

/** Count sectors whose return over the range is positive ("X / 11 advancing"). */
export function marketBreadth(data: SectorData, range: TimeRange): Breadth {
  const asOf = data.generatedAt;
  const advancing = data.sectors.filter(
    (sector) => sectorPeriodReturn(sector, range, asOf) > 0,
  ).length;
  return { advancing, total: data.sectors.length };
}
