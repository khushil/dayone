import { useMemo } from 'react';
import type { SectorData, TimeRange } from '@shared/types';
import { useAppStore } from '../store';
import { buildSectorView } from '../lib/view';
import { direction } from '../lib/format';
import { DeltaText } from './ui/DeltaText';
import { Sparkline } from './ui/Sparkline';
import { cn } from './ui/cn';

interface SectorRailProps {
  data: SectorData;
  range: TimeRange;
}

const TONE = {
  gain: 'text-gain',
  loss: 'text-loss',
  neutral: 'text-muted',
} as const;

/** Legend + multi-select filter: swatch, name, sparkline, period return (FR-6). */
export function SectorRail({
  data,
  range,
}: SectorRailProps): React.JSX.Element {
  const selected = useAppStore((s) => s.selected);
  const toggleSector = useAppStore((s) => s.toggleSector);
  const views = useMemo(
    () =>
      data.sectors.map((sector) =>
        buildSectorView(sector, range, data.generatedAt),
      ),
    [data, range],
  );

  return (
    <nav aria-label="Sectors" className="flex flex-col gap-0.5">
      <h2 className="px-3 py-2 text-[0.7rem] tracking-[0.18em] text-muted uppercase">
        Sectors
      </h2>
      {views.map((view) => {
        const on = selected.has(view.sector.key);
        return (
          <button
            key={view.sector.key}
            type="button"
            aria-pressed={on}
            onClick={() => toggleSector(view.sector.key)}
            className={cn(
              'group flex items-center gap-2 rounded-md px-3 py-1.5 text-left transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-accent',
              !on && 'opacity-40',
            )}
          >
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: view.sector.color }}
            />
            <span className="flex-1 truncate text-sm">{view.sector.name}</span>
            <Sparkline
              values={view.rebased}
              width={48}
              height={16}
              className={TONE[direction(view.periodReturn)]}
            />
            <DeltaText
              value={view.periodReturn}
              className="w-16 justify-end text-xs"
            />
          </button>
        );
      })}
    </nav>
  );
}
