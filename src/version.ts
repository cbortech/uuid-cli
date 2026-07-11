// Replaced with the package.json version by esbuild at build time.
declare const __UUID_CLI_VERSION__: string | undefined;

export const VERSION =
  typeof __UUID_CLI_VERSION__ === 'string' ? __UUID_CLI_VERSION__ : '0.0.0-dev';
