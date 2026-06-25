import { cn } from './cn';

interface IconButtonProps {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}

/** A square, labelled icon button used across the top bar. */
export function IconButton({
  label,
  onClick,
  children,
  active = false,
}: IconButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-md border border-line text-muted transition-colors hover:bg-surface hover:text-text focus-visible:outline-2 focus-visible:outline-accent',
        active && 'border-accent/40 text-accent',
      )}
    >
      {children}
    </button>
  );
}
