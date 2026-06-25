import { useState } from 'react';
import { Settings } from 'lucide-react';
import { TimeRangeToggle } from './TimeRangeToggle';
import { ThemeToggle } from './ThemeToggle';
import { CvdToggle } from './CvdToggle';
import { RefreshButton } from './RefreshButton';
import { IconButton } from './ui/IconButton';
import { ProviderSettings } from './ProviderSettings';

/** App header: wordmark, range control, and display/refresh/settings actions. */
export function Topbar(): React.JSX.Element {
  const [settingsOpen, setSettingsOpen] = useState(false);
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
          <IconButton
            label="Data providers"
            active={settingsOpen}
            onClick={() => setSettingsOpen(true)}
          >
            <Settings size={16} />
          </IconButton>
        </div>
      </div>
      <ProviderSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </header>
  );
}
