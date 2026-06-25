import { Contrast } from 'lucide-react';
import { useAppStore } from '../store';
import { IconButton } from './ui/IconButton';

/** Toggle the colorblind-safe diverging palette (FR-7). */
export function CvdToggle(): React.JSX.Element {
  const cvd = useAppStore((s) => s.cvd);
  const toggleCvd = useAppStore((s) => s.toggleCvd);
  return (
    <IconButton
      label="Toggle colorblind-safe palette"
      active={cvd}
      onClick={toggleCvd}
    >
      <Contrast size={16} />
    </IconButton>
  );
}
