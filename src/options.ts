import { UUID } from '@cbortech/uuid';
import type { Colors } from './colors.js';

/** citty arg definitions shared by every command. */
export const outputArgs = {
  json: {
    type: 'boolean',
    default: false,
    description: 'Output as JSON',
  },
  color: {
    type: 'boolean',
    default: true,
    description: 'Colorize output',
    negativeDescription: 'Disable color output',
  },
} as const;

/** Parse -n / --count as a positive integer; throws on invalid input. */
export function parseCount(value: string | undefined): number {
  const s = value ?? '1';
  if (!/^\d+$/.test(s)) {
    throw new Error(`invalid -n value "${s}" (must be a positive integer)`);
  }
  const n = parseInt(s, 10);
  if (n < 1) {
    throw new Error(`invalid -n value "${s}" (must be a positive integer)`);
  }
  return n;
}

/** Parse the uuid positional argument; throws when missing or invalid. */
export function requireUuid(
  input: string | undefined,
  commandName: string
): UUID {
  if (input === undefined) {
    throw new Error(
      `uuid argument is required (usage: uuid ${commandName} <uuid>)`
    );
  }
  return new UUID(input);
}

/** Print aligned key/value rows with a dimmed key column. */
export function printRows(rows: Array<[string, string]>, c: Colors): void {
  const maxLen = Math.max(...rows.map(([k]) => k.length));
  for (const [key, value] of rows) {
    console.log(`${c.dim(key.padEnd(maxLen))}  ${value}`);
  }
}
