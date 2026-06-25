import '@fontsource-variable/fraunces';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './assets/main.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

const container = document.getElementById('root');

/** Last-resort visible message if the app never mounts (e.g. a load failure). */
function showFatal(message: string): void {
  if (container && container.childElementCount === 0) {
    container.textContent = `SectorScope failed to start: ${message}. Press F12 for details.`;
  }
}

window.addEventListener('error', (e) => showFatal(e.message));
window.addEventListener('unhandledrejection', (e) =>
  showFatal(String(e.reason)),
);

if (!container) {
  document.body.textContent =
    'SectorScope: root container #root was not found.';
} else {
  try {
    createRoot(container).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
  } catch (err) {
    showFatal(err instanceof Error ? err.message : String(err));
  }
}
