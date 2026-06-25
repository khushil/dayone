import { direction, formatPercent } from '../../lib/format';
import { cn } from './cn';

const GLYPH = { gain: '▲', loss: '▼', neutral: '·' } as const;
const TONE = {
  gain: 'text-gain',
  loss: 'text-loss',
  neutral: 'text-muted',
} as const;

interface DeltaTextProps {
  value: number;
  className?: string;
}

/**
 * A return value rendered so its direction reads without color (FR-7): an
 * explicit ▲/▼ glyph and a signed percent, tinted with the gain/loss token.
 */
export function DeltaText({
  value,
  className,
}: DeltaTextProps): React.JSX.Element {
  const tone = direction(value);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 tabular',
        TONE[tone],
        className,
      )}
    >
      <span aria-hidden="true">{GLYPH[tone]}</span>
      {formatPercent(value)}
    </span>
  );
}
