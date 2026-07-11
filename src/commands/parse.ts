import { defineCommand } from 'citty';
import { resolveColors } from '../colors.js';
import { outputArgs, printRows, requireUuid } from '../options.js';
import { fail } from '../report.js';

// Fields displayed as decimal rather than hex
const DECIMAL_FIELDS: ReadonlySet<string> = new Set([
  'ver',
  'unix_ts_ms',
  'local_id',
  'local_domain',
]);

function fieldToDisplay(key: string, value: unknown): string {
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'bigint') return `0x${value.toString(16)}`;
  if (typeof value === 'number') {
    return DECIMAL_FIELDS.has(key) ? String(value) : `0x${value.toString(16)}`;
  }
  return String(value);
}

function fieldToJson(value: unknown): unknown {
  if (typeof value === 'bigint') return `0x${value.toString(16)}`;
  return value;
}

export default defineCommand({
  meta: {
    name: 'parse',
    description: 'Parse UUID fields',
  },
  args: {
    uuid: {
      type: 'positional',
      description: 'UUID string to parse',
      required: false,
    },
    ...outputArgs,
  },
  run({ args }) {
    try {
      const uuid = requireUuid(args.uuid, 'parse');
      const parsed = uuid.parse();
      const c = resolveColors(args.color);

      if (args.json) {
        const obj = Object.fromEntries(
          Object.entries(parsed).map(([k, v]) => [k, fieldToJson(v)])
        );
        console.log(JSON.stringify(obj, null, 2));
        return;
      }

      const rows: Array<[string, string]> = Object.entries(parsed).map(
        ([key, value]) => {
          let display = fieldToDisplay(key, value);
          if (key === 'unix_ts_ms' && typeof value === 'number') {
            display += `  ${c.dim(new Date(value).toISOString())}`;
          }
          return [key, display];
        }
      );

      printRows(rows, c);
    } catch (err) {
      fail(err);
    }
  },
});
