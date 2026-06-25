import '@fontsource-variable/fraunces';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './assets/main.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container #root was not found in index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
