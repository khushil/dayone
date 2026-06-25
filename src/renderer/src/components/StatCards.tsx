import { useMemo } from 'react';
import type { SectorData, TimeRange } from '@shared/types';
import {
  bestWorstSector,
  marketBreadth,
  sectorPeriodReturn,
} from '../lib/summary';
import { formatMonth } from '../lib/format';
import { DeltaText } from './ui/DeltaText';

interface StatCardsProps {
  data: SectorData;
  range: TimeRange;
}

function Card(props: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-line bg-surface px-4 py-3">
      <span className="text-[0.7rem] tracking-[0.18em] text-muted uppercase">
        {props.label}
      </span>
      {props.children}
    </div>
  );
}

/** The hero summary: best, worst, breadth, and the snapshot date (FR-4, FR-7). */
export function StatCards({ data, range }: StatCardsProps): React.JSX.Element {
  const { best, worst } = useMemo(
    () => bestWorstSector(data, range),
    [data, range],
  );
  const breadth = useMemo(() => marketBreadth(data, range), [data, range]);
  const asOf = data.generatedAt;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card label="Best sector">
        <span className="font-display text-2xl leading-tight">{best.name}</span>
        <DeltaText value={sectorPeriodReturn(best, range, asOf)} />
      </Card>
      <Card label="Worst sector">
        <span className="font-display text-2xl leading-tight">
          {worst.name}
        </span>
        <DeltaText value={sectorPeriodReturn(worst, range, asOf)} />
      </Card>
      <Card label="Breadth">
        <span className="tabular text-2xl">
          {breadth.advancing} / {breadth.total}
        </span>
        <span className="text-sm text-muted">advancing</span>
      </Card>
      <Card label="Updated">
        <span className="text-2xl">{formatMonth(asOf)}</span>
        <span className="text-sm text-muted">monthly close</span>
      </Card>
    </div>
  );
}
