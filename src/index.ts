import { defineCommand, runMain } from 'citty';
import { VERSION } from './version.js';
import generate from './commands/generate.js';
import parse from './commands/parse.js';
import inspect from './commands/inspect.js';
import validate from './commands/validate.js';

const subCommands = {
  generate,
  parse,
  inspect,
  validate,
};

const main = defineCommand({
  meta: {
    name: 'uuid',
    description:
      'UUID generation and inspection tool (RFC 9562). ' +
      'When no command is given, a UUID is generated: `uuid -v7` prints a UUID v7. ' +
      'A bare UUID argument is parsed: `uuid <uuid>` behaves like `uuid parse <uuid>`.',
    version: VERSION,
  },
  subCommands,
});

/**
 * Historic single-dash flags accepted for compatibility, mapped to their
 * canonical forms before citty parses the argv.
 */
const FLAG_ALIASES: Readonly<Record<string, string>> = {
  '-v4': '--v4',
  '-v7': '--v7',
  '-v': '--version',
  '-h': '--help',
};

function normalizeFlags(rawArgs: string[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i]!;
    if (arg === '--') {
      result.push(...rawArgs.slice(i));
      break;
    }
    result.push(FLAG_ALIASES[arg] ?? arg);
  }
  return result;
}

/** Flags that consume a value, so the argv scan below can skip it. */
const VALUE_FLAGS: ReadonlySet<string> = new Set(['-n', '--count']);

/**
 * Locate the first positional argument, skipping flags (and the values of
 * value-taking flags). Returns the index, or -1 if there is none;
 * `afterDoubleDash` is true when the positional follows a `--` terminator
 * and thus can never be a subcommand name.
 */
function firstPositionalIndex(rawArgs: string[]): {
  index: number;
  afterDoubleDash: boolean;
} {
  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i]!;
    if (arg === '--') {
      return {
        index: i + 1 < rawArgs.length ? i + 1 : -1,
        afterDoubleDash: true,
      };
    }
    if (arg.startsWith('-')) {
      if (!arg.includes('=') && VALUE_FLAGS.has(arg)) {
        i++; // skip the flag's value
      }
      continue;
    }
    return { index: i, afterDoubleDash: false };
  }
  return { index: -1, afterDoubleDash: false };
}

/**
 * Make `generate` the implicit command (`uuid -v7` behaves like
 * `uuid generate -v7`) and treat a bare UUID argument as `parse`
 * (`uuid <uuid>` behaves like `uuid parse <uuid>`). An explicit subcommand
 * is moved to the front so flags may appear before it (citty drops
 * everything preceding the subcommand name).
 *
 * `--help` and `--version` win over everything else, as global flags: help
 * is left for citty (which resolves it anywhere in the argv and shows the
 * usage of the resolved subcommand), while version is reduced to a lone
 * `--version` because citty only honors it as the sole argument.
 */
function withImplicitCommand(rawArgs: string[]): string[] {
  const flags = rawArgs.slice(
    0,
    rawArgs.includes('--') ? rawArgs.indexOf('--') : undefined
  );
  if (flags.includes('--version')) return ['--version'];
  if (flags.includes('--help')) return rawArgs;

  const { index, afterDoubleDash } = firstPositionalIndex(rawArgs);
  if (index >= 0) {
    const token = rawArgs[index]!;
    if (!afterDoubleDash && Object.hasOwn(subCommands, token)) {
      return [token, ...rawArgs.slice(0, index), ...rawArgs.slice(index + 1)];
    }
    return ['parse', ...rawArgs];
  }
  return ['generate', ...rawArgs];
}

runMain(main, {
  rawArgs: withImplicitCommand(normalizeFlags(process.argv.slice(2))),
});
