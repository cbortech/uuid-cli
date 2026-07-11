import { defineCommand } from 'citty';
import { UUID } from '@cbortech/uuid';
import { resolveColors } from '../colors.js';
import { outputArgs } from '../options.js';
import { fail } from '../report.js';

export default defineCommand({
  meta: {
    name: 'validate',
    description: 'Validate a UUID string',
  },
  args: {
    uuid: {
      type: 'positional',
      description: 'UUID string to validate',
      required: false,
    },
    ...outputArgs,
  },
  run({ args }) {
    const input = args.uuid;
    if (input === undefined) {
      fail(
        new Error('uuid argument is required (usage: uuid validate <uuid>)')
      );
      return;
    }
    const c = resolveColors(args.color);

    let uuid: UUID;
    try {
      uuid = new UUID(input);
    } catch (e) {
      if (args.json) {
        console.log(
          JSON.stringify({ valid: false, error: (e as Error).message })
        );
      } else {
        console.log(`${c.red('✗')} Invalid UUID: ${(e as Error).message}`);
      }
      process.exitCode = 1;
      return;
    }

    const version = uuid.getVersion();
    const variant = uuid.getVariant();
    if (args.json) {
      console.log(JSON.stringify({ valid: true, version, variant }));
    } else {
      console.log(
        `${c.green('✓')} Valid UUID  (version ${version}, variant ${variant})`
      );
    }
  },
});
