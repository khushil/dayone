import { useMemo, useState } from 'react';
import { formatMonth } from '../lib/format';
import { cn } from './ui/cn';
import type { SectorView } from '../lib/view';

interface ReturnsMatrixProps {
  views: SectorView[];
}

const MAX_MONTHLY = 0.08; // saturate the scale at ±8% per month

function cellStyle(value: number): React.CSSProperties {
  if (value === 0) {
    return {};
  }
  const token = value > 0 ? '--color-gain' : '--color-loss';
  const intensity = Math.min(1, Math.abs(value) / MAX_MONTHLY);
  const pct = Math.round(12 + intensity * 60);
  return {
    backgroundColor: `color-mix(in srgb, var(${token}) ${pct}%, transparent)`,
  };
}

/** Sectors × months heat grid — the signature view (FR-3, FR-7). */
export function ReturnsMatrix({
  views,
}: ReturnsMatrixProps): React.JSX.Element {
  const months = useMemo(
    () => views[0]?.returns.map((r) => r.month) ?? [],
    [views],
  );
  const [hover, setHover] = useState<{ row: string; col: string } | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0.5 tabular text-xs">
        <caption className="sr-only">
          Monthly returns by sector. Cells are tinted by direction and
          magnitude; the value sign also encodes direction.
        </caption>
        <thead>
          <tr>
            <th className="px-2 py-1 text-left font-normal text-muted">
              Sector
            </th>
            {months.map((month) => (
              <th
                key={month}
                scope="col"
                className={cn(
                  'px-1.5 py-1 text-center font-normal text-muted',
                  hover?.col === month && 'text-text',
                )}
              >
                {formatMonth(month).slice(0, 3)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {views.map((view) => (
            <tr key={view.sector.key}>
              <th
                scope="row"
                className={cn(
                  'max-w-[150px] truncate px-2 py-1 text-left font-normal',
                  hover?.row === view.sector.key ? 'text-text' : 'text-muted',
                )}
              >
                <span
                  aria-hidden="true"
                  className="mr-1.5 inline-block size-2 rounded-full align-middle"
                  style={{ backgroundColor: view.sector.color }}
                />
                {view.sector.name}
              </th>
              {view.returns.map((r) => {
                const active =
                  hover?.col === r.month || hover?.row === view.sector.key;
                return (
                  <td
                    key={r.month}
                    style={cellStyle(r.return)}
                    onMouseEnter={() =>
                      setHover({ row: view.sector.key, col: r.month })
                    }
                    onMouseLeave={() => setHover(null)}
                    className={cn(
                      'rounded-sm px-1.5 py-1 text-center tracking-tight text-text/90 transition-[outline]',
                      active && 'outline outline-accent/60',
                    )}
                  >
                    {r.return > 0 ? '+' : r.return < 0 ? '-' : ''}
                    {Math.abs(r.return * 100).toFixed(1)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
