import { defineConfig, type Plugin } from 'vite';
import { resolve } from 'path';

function addShebang(): Plugin {
  return {
    name: 'add-shebang',
    generateBundle(_, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'chunk' && chunk.isEntry) {
          chunk.code = '#!/usr/bin/env node\n' + chunk.code;
        }
      }
    },
  };
}

export default defineConfig({
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: [addShebang()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/cli.ts'),
      formats: ['es'],
      fileName: () => 'cli.js',
    },
    rollupOptions: {
      external: [],
    },
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
  },
  define: {
    __CLI_VERSION__: JSON.stringify(
      process.env['npm_package_version'] ?? '0.0.0'
    ),
  },
});
