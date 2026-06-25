import { Moon, Sun } from 'lucide-react';
import { useAppStore } from '../store';
import { IconButton } from './ui/IconButton';

/** Light/dark toggle (FR-8). The applied theme persists across launches. */
export function ThemeToggle(): React.JSX.Element {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  return (
    <IconButton
      label={
        theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
      }
      onClick={toggleTheme}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </IconButton>
  );
}
