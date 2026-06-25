import { RefreshCw } from 'lucide-react';
import { useAppStore } from '../store';
import { useRefresh } from '../hooks/useSectorData';
import { IconButton } from './ui/IconButton';
import { cn } from './ui/cn';

/** Trigger a best-effort data refresh (FR-9). */
export function RefreshButton(): React.JSX.Element {
  const refreshing = useAppStore((s) => s.refreshing);
  const refresh = useRefresh();
  return (
    <IconButton label="Refresh data" onClick={() => void refresh()}>
      <RefreshCw size={16} className={cn(refreshing && 'animate-spin')} />
    </IconButton>
  );
}
