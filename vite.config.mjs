import { defineConfig } from 'vite';
import { extensions, classicEmberSupport, ember } from '@embroider/vite';
import { babel } from '@rollup/plugin-babel';

export default defineConfig({
  server: {
    // Listen on all interfaces so the dev server can be reached from other
    // machines (LAN, VPN, etc.), not just localhost. Firewall access is the
    // operator's responsibility.
    host: true,
    port: 4200,
    // Fail loudly instead of silently moving to another port, so the port
    // referenced in docs/URLs stays predictable.
    strictPort: true,
  },
  optimizeDeps: {
    include: [
      'hammerjs',
      'remotestoragejs',
      'localforage',
      '@kosmos/remotestorage-module-kosmos',
      '@sockethub/client',
      'hsluv',
      'linkify-string',
    ],
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['import', 'global-builtin', 'legacy-js-api', 'if-function'],
      },
    },
  },
  plugins: [
    classicEmberSupport(),
    ember(),
    babel({
      babelHelpers: 'runtime',
      extensions,
    }),
  ],
});
