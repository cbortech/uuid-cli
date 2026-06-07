import { UUID } from '@cbortech/uuid';

declare const __CLI_VERSION__: string;

// ─── Color support ────────────────────────────────────────────────────────────

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

type Colors = ReturnType<typeof makeColors>;

// ─── Arg parsing ──────────────────────────────────────────────────────────────

type Command = 'generate' | 'parse' | 'inspect' | 'validate';

interface Args {
  command: Command;
  v7: boolean;
  count: number;
  json: boolean;
  noColor: boolean;
  help: boolean;
  showVersion: boolean;
  positional: string[];
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    command: 'generate',
    v7: false,
    count: 1,
    json: false,
    noColor: false,
    help: false,
    showVersion: false,
    positional: [],
  };

  const SUBCOMMANDS: ReadonlySet<string> = new Set([
    'generate',
    'parse',
    'inspect',
    'validate',
  ]);

  // Pre-scan: find subcommand keyword at any position (flags may appear before it)
  let subcommandIdx = -1;
  for (let j = 0; j < argv.length; j++) {
    const a = argv[j]!;
    if (!a.startsWith('-') && SUBCOMMANDS.has(a)) {
      args.command = a as Command;
      subcommandIdx = j;
      break;
    }
  }

  const hasExplicitCommand = subcommandIdx !== -1;
  let uuidShorthandApplied = false;

  for (let i = 0; i < argv.length; i++) {
    if (i === subcommandIdx) continue; // subcommand keyword itself is consumed

    const arg = argv[i]!;
    switch (arg) {
      case '-v4':
        // v4 is the default; flag accepted for explicitness
        break;
      case '-v7':
        args.v7 = true;
        break;
      case '-n': {
        const next = argv[++i];
        const n = parseInt(next ?? '', 10);
        if (isNaN(n) || n < 1) {
          process.stderr.write('Error: -n requires a positive integer\n');
          process.exit(1);
        }
        args.count = n;
        break;
      }
      case '--json':
        args.json = true;
        break;
      case '--no-color':
        args.noColor = true;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      case '--version':
      case '-v':
        args.showVersion = true;
        break;
      default:
        if (arg.startsWith('-')) {
          process.stderr.write(`Unknown option: ${arg}\n`);
          process.exit(1);
        }
        // Non-flag, non-subcommand positional arg
        if (!hasExplicitCommand && !uuidShorthandApplied) {
          // First positional without an explicit subcommand → UUID shorthand for parse
          args.command = 'parse';
          uuidShorthandApplied = true;
        }
        args.positional.push(arg);
    }
  }

  return args;
}

// ─── Help ─────────────────────────────────────────────────────────────────────

function printHelp(c: Colors): void {
  console.log(
    [
      `${c.bold('uuid')} — UUID generation and inspection tool (RFC 9562)`,
      '',
      `${c.bold('Usage:')}  uuid [command] [options]`,
      '',
      `${c.bold('Commands:')}`,
      `  ${c.cyan('generate')} (default)   Generate a UUID`,
      `  ${c.cyan('parse')} <uuid>         Parse UUID fields`,
      `  ${c.cyan('inspect')} <uuid>       Inspect UUID (version, timestamp, etc.)`,
      `  ${c.cyan('validate')} <uuid>      Validate a UUID string`,
      '',
      `${c.bold('Generate options:')}`,
      `  ${c.dim('-v4')}                 UUID v4 — random (default)`,
      `  ${c.dim('-v7')}                 UUID v7 — time-ordered random`,
      `  ${c.dim('-n')} <count>          Number of UUIDs to generate (default: 1)`,
      '',
      `${c.bold('Output options:')}`,
      `  ${c.dim('--json')}              Output as JSON`,
      `  ${c.dim('--no-color')}          Disable color output`,
      '',
      `${c.bold('Other options:')}`,
      `  ${c.dim('-h, --help')}          Show this help`,
      `  ${c.dim('-v, --version')}       Show version`,
      '',
      `${c.bold('Examples:')}`,
      `  uuid                               Generate UUID v4`,
      `  uuid -v7                           Generate UUID v7`,
      `  uuid -v7 -n 5                      Generate 5 UUID v7s`,
      `  uuid <uuid>                        Parse UUID fields (shorthand)`,
      `  uuid inspect <uuid>                Inspect a UUID`,
      `  uuid parse <uuid> --json           Parse UUID fields as JSON`,
      `  uuid validate <uuid>               Validate a UUID`,
    ].join('\n')
  );
}

// ─── Generate ─────────────────────────────────────────────────────────────────

function cmdGenerate(args: Args): void {
  const version = args.v7 ? 7 : 4;
  const uuids: string[] = Array.from({ length: args.count }, () =>
    UUID.random({ ver: version }).toString()
  );

  if (args.json) {
    console.log(JSON.stringify(uuids.length === 1 ? uuids[0] : uuids, null, 2));
  } else {
    for (const uuid of uuids) console.log(uuid);
  }
}

// ─── Parse ────────────────────────────────────────────────────────────────────

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

function requireUuid(args: Args, commandName: string): UUID {
  const input = args.positional[0];
  if (input === undefined) {
    process.stderr.write('Error: uuid argument is required\n');
    process.stderr.write(`Usage: uuid ${commandName} <uuid>\n`);
    process.exit(1);
  }
  try {
    return new UUID(input);
  } catch (e) {
    process.stderr.write(`Error: ${(e as Error).message}\n`);
    process.exit(1);
  }
}

function cmdParse(args: Args, c: Colors): void {
  const uuid = requireUuid(args, 'parse');
  const parsed = uuid.parse();

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

  const maxLen = Math.max(...rows.map(([k]) => k.length));
  for (const [key, value] of rows) {
    console.log(`${c.dim(key.padEnd(maxLen))}  ${value}`);
  }
}

// ─── Inspect ──────────────────────────────────────────────────────────────────

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

function cmdInspect(args: Args, c: Colors): void {
  const uuid = requireUuid(args, 'inspect');
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

  const rows: Array<[string, string]> = [
    ['UUID', c.bold(uuid.toString())],
    ['Version', `${version}  ${c.dim(versionLabel)}`],
    ['Variant', variant],
  ];
  if (timestamp !== null) {
    rows.push(['Timestamp', c.cyan(timestamp)]);
  }

  const maxLen = Math.max(...rows.map(([k]) => k.length));
  for (const [key, value] of rows) {
    console.log(`${c.dim(key.padEnd(maxLen))}  ${value}`);
  }
}

// ─── Validate ─────────────────────────────────────────────────────────────────

function cmdValidate(args: Args, c: Colors): void {
  const input = args.positional[0];
  if (input === undefined) {
    process.stderr.write('Error: uuid argument is required\n');
    process.stderr.write('Usage: uuid validate <uuid>\n');
    process.exit(1);
  }

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
    process.exit(1);
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
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const colorEnabled =
    !args.noColor && !process.env['NO_COLOR'] && Boolean(process.stdout.isTTY);
  const c = makeColors(colorEnabled);

  if (args.showVersion) {
    console.log(__CLI_VERSION__);
    return;
  }

  if (args.help) {
    printHelp(c);
    return;
  }

  switch (args.command) {
    case 'generate':
      cmdGenerate(args);
      break;
    case 'parse':
      cmdParse(args, c);
      break;
    case 'inspect':
      cmdInspect(args, c);
      break;
    case 'validate':
      cmdValidate(args, c);
      break;
  }
}

main();
