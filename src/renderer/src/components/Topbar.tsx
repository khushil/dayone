import { TimeRangeToggle } from './TimeRangeToggle';
import { ThemeToggle } from './ThemeToggle';
import { CvdToggle } from './CvdToggle';
import { RefreshButton } from './RefreshButton';

/** App header: wordmark, range control, and display/refresh actions. */
export function Topbar(): React.JSX.Element {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-xl">
          Day<span className="text-accent">ONE</span>
        </span>
        <span className="hidden text-[0.7rem] tracking-[0.2em] text-muted uppercase sm:inline">
          12-month sector performance
        </span>
      </div>
      <div className="flex items-center gap-3">
        <TimeRangeToggle />
        <div className="flex items-center gap-1.5">
          <CvdToggle />
          <ThemeToggle />
          <RefreshButton />
        </div>
      </div>
    </header>
  );
}
