import { useAppStore } from '../store';
import { RANGES } from '../lib/ranges';
import { cn } from './ui/cn';

/** Segmented control for the active look-back range (FR-5). */
export function TimeRangeToggle(): React.JSX.Element {
  const range = useAppStore((s) => s.range);
  const setRange = useAppStore((s) => s.setRange);
  return (
    <div
      role="radiogroup"
      aria-label="Time range"
      className="inline-flex rounded-md border border-line bg-surface p-0.5"
    >
      {RANGES.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={range === option}
          onClick={() => setRange(option)}
          className={cn(
            'rounded px-2.5 py-1 tabular text-xs transition-colors focus-visible:outline-2 focus-visible:outline-accent',
            range === option
              ? 'bg-accent/15 text-accent'
              : 'text-muted hover:text-text',
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
