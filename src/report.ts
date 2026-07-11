/** Report a fatal error on stderr and mark the process as failed. */
export function fail(err: unknown): void {
  process.stderr.write(
    `uuid: ${err instanceof Error ? err.message : String(err)}\n`
  );
  process.exitCode = 1;
}
