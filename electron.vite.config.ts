import { resolve } from 'path';
import { defineConfig } from 'electron-vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Remove the `crossorigin` attribute Vite adds to the module script/stylesheet.
 * Under the packaged app's `file://` origin, a crossorigin module is fetched
 * with CORS, which `file://` cannot satisfy — leaving a blank screen. Stripping
 * it lets the renderer load normally.
 */
function stripCrossorigin(): Plugin {
  return {
    name: 'strip-crossorigin',
    transformIndexHtml(html: string): string {
      return html.replace(/ crossorigin/g, '');
    },
  };
}

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@': resolve('src/renderer/src'),
        '@shared': resolve('src/shared'),
      },
    },
    plugins: [react(), tailwindcss(), stripCrossorigin()],
  },
});
