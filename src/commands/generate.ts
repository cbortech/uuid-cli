import { defineCommand } from 'citty';
import { UUID } from '@cbortech/uuid';
import { outputArgs, parseCount } from '../options.js';
import { fail } from '../report.js';

export default defineCommand({
  meta: {
    name: 'generate',
    description: 'Generate a UUID',
  },
  args: {
    v4: {
      type: 'boolean',
      default: false,
      description: 'UUID v4 — random (default)',
    },
    v7: {
      type: 'boolean',
      default: false,
      description: 'UUID v7 — time-ordered random',
    },
    count: {
      type: 'string',
      alias: 'n',
      default: '1',
      description: 'Number of UUIDs to generate',
    },
    ...outputArgs,
  },
  run({ args }) {
    try {
      const count = parseCount(args.count);
      const version = args.v7 ? 7 : 4;
      const uuids: string[] = Array.from({ length: count }, () =>
        UUID.random({ ver: version }).toString()
      );

      if (args.json) {
        console.log(
          JSON.stringify(uuids.length === 1 ? uuids[0] : uuids, null, 2)
        );
      } else {
        for (const uuid of uuids) console.log(uuid);
      }
    } catch (err) {
      fail(err);
    }
  },
});
