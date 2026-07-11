function makeColors(enabled: boolean) {
  const c =
    (open: number, close: number) =>
    (s: string): string =>
      enabled ? `\x1b[${open}m${s}\x1b[${close}m` : s;
  return {
    bold: c(1, 22),
    dim: c(2, 22),
    red: c(31, 39),
    green: c(32, 39),
    cyan: c(36, 39),
  };
}

export type Colors = ReturnType<typeof makeColors>;

/** Resolve the color palette from the --color flag, NO_COLOR, and the TTY. */
export function resolveColors(colorFlag: boolean | undefined): Colors {
  return makeColors(
    colorFlag !== false &&
      !process.env['NO_COLOR'] &&
      Boolean(process.stdout.isTTY)
  );
}
