import { defineConfig } from 'vite';
import { extensions, classicEmberSupport, ember } from '@embroider/vite';
import { babel } from '@rollup/plugin-babel';

export default defineConfig({
  optimizeDeps: {
    include: [
      'hammerjs',
      'remotestoragejs',
      'localforage',
      '@kosmos/remotestorage-module-kosmos',
      '@sockethub/client',
      'consistent-color-generation',
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
