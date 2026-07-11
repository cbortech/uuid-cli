import { defineCommand } from 'citty';
import { resolveColors } from '../colors.js';
import { outputArgs, printRows, requireUuid } from '../options.js';
import { fail } from '../report.js';

const VERSION_NAMES: Readonly<Partial<Record<number, string>>> = {
  0: 'Nil UUID',
  1: 'time-based',
  2: 'DCE Security',
  3: 'MD5 name-based',
  4: 'random',
  5: 'SHA-1 name-based',
  6: 'reordered time',
  7: 'time-ordered random',
  8: 'custom',
  15: 'Max UUID',
};

export default defineCommand({
  meta: {
    name: 'inspect',
    description: 'Inspect UUID (version, timestamp, etc.)',
  },
  args: {
    uuid: {
      type: 'positional',
      description: 'UUID string to inspect',
      required: false,
    },
    ...outputArgs,
  },
  run({ args }) {
    try {
      const uuid = requireUuid(args.uuid, 'inspect');
      const version = uuid.getVersion();
      const variant = uuid.getVariant();
      const versionLabel =
        version === 0 || version === 15
          ? VERSION_NAMES[version]!
          : `UUID v${version}  ${VERSION_NAMES[version] ?? ''}`.trimEnd();

      let timestamp: string | null = null;
      if (version === 1 || version === 2 || version === 6 || version === 7) {
        try {
          timestamp = new Date(uuid.getTime()).toISOString();
        } catch {
          // not all time-based UUIDs yield a valid timestamp
        }
      }

      if (args.json) {
        const obj: Record<string, unknown> = {
          uuid: uuid.toString(),
          version,
          versionLabel,
          variant,
        };
        if (timestamp !== null) obj['timestamp'] = timestamp;
        console.log(JSON.stringify(obj, null, 2));
        return;
      }

      const c = resolveColors(args.color);
      const rows: Array<[string, string]> = [
        ['UUID', c.bold(uuid.toString())],
        ['Version', `${version}  ${c.dim(versionLabel)}`],
        ['Variant', variant],
      ];
      if (timestamp !== null) {
        rows.push(['Timestamp', c.cyan(timestamp)]);
      }

      printRows(rows, c);
    } catch (err) {
      fail(err);
    }
  },
});
