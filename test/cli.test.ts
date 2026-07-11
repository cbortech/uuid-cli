import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const CLI = fileURLToPath(new URL('../dist/uuid.mjs', import.meta.url));

interface RunResult {
  out: string;
  err: string;
  code: number;
}

function run(...args: string[]): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [CLI, ...args],
      // Disable colors for predictable string matching
      { env: { ...process.env, NO_COLOR: '1' } },
      (err, stdout, stderr) => {
        if (err && typeof err.code !== 'number') {
          reject(err);
          return;
        }
        resolve({
          out: stdout.trim(),
          err: stderr.trim(),
          code: err ? (err.code as number) : 0,
        });
      }
    );
  });
}

// UUID format patterns
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const UUID_V7_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// Well-known UUIDs used across tests
const V1 = 'c232ab00-9414-11ec-b3c8-9f6bdeced846'; // RFC 9562 Appendix A.1
const V4 = '550e8400-e29b-41d4-a716-446655440000';
const V7 = '019ca305-7aa2-7d6b-8b95-fbcbf17e1d66';

// =============================================================================
// Test suite
// =============================================================================

describe('generate', () => {
  test('default (no args) generates a v4 UUID', async () => {
    const { out, code } = await run();
    expect(code).toBe(0);
    expect(out).toMatch(UUID_V4_RE);
  });

  test('-v4 generates a v4 UUID', async () => {
    const { out, code } = await run('-v4');
    expect(code).toBe(0);
    expect(out).toMatch(UUID_V4_RE);
  });

  test('-v7 generates a v7 UUID', async () => {
    const { out, code } = await run('-v7');
    expect(code).toBe(0);
    expect(out).toMatch(UUID_V7_RE);
  });

  test('-n generates multiple UUIDs, one per line', async () => {
    const { out, code } = await run('-n', '3');
    expect(code).toBe(0);
    const lines = out.split('\n');
    expect(lines).toHaveLength(3);
    for (const line of lines) expect(line).toMatch(UUID_V4_RE);
  });

  test('-v7 -n generates monotonically increasing v7 UUIDs', async () => {
    const { out, code } = await run('-v7', '-n', '5');
    expect(code).toBe(0);
    const lines = out.split('\n');
    expect(lines).toHaveLength(5);
    for (const line of lines) expect(line).toMatch(UUID_V7_RE);
    for (let i = 1; i < lines.length; i++) {
      expect(lines[i]! >= lines[i - 1]!).toBe(true);
    }
  });

  test('generate subcommand works explicitly', async () => {
    const { out, code } = await run('generate', '-v7');
    expect(code).toBe(0);
    expect(out).toMatch(UUID_V7_RE);
  });

  test('--json with single UUID outputs a JSON string', async () => {
    const { out, code } = await run('--json');
    expect(code).toBe(0);
    const parsed: unknown = JSON.parse(out);
    expect(typeof parsed).toBe('string');
    expect(parsed as string).toMatch(UUID_RE);
  });

  test('--json with -n outputs a JSON array', async () => {
    const { out, code } = await run('-n', '3', '--json');
    expect(code).toBe(0);
    const parsed: unknown = JSON.parse(out);
    expect(Array.isArray(parsed)).toBe(true);
    expect((parsed as string[]).length).toBe(3);
    for (const u of parsed as string[]) expect(u).toMatch(UUID_RE);
  });

  test('-n with invalid value exits 1 with error on stderr', async () => {
    const { code, err } = await run('-n', 'abc');
    expect(code).toBe(1);
    expect(err).toContain('-n');
  });

  test.each(['3abc', '3.9', '1e3', '-2', '0'])(
    '-n rejects malformed value %s',
    async (value) => {
      const { code, err } = await run('-n', value);
      expect(code).toBe(1);
      expect(err).toContain('-n');
    }
  );
});

// ── parse ───────────────────────────────────────────────────────────────────

describe('parse', () => {
  test('parses a v1 UUID and shows time fields', async () => {
    const { out, code } = await run('parse', V1);
    expect(code).toBe(0);
    expect(out).toContain('ver');
    expect(out).toContain('1');
    expect(out).toContain('time_low');
    expect(out).toContain('RFC4122');
  });

  test('parses a v4 UUID and shows random fields', async () => {
    const { out, code } = await run('parse', V4);
    expect(code).toBe(0);
    expect(out).toContain('ver');
    expect(out).toContain('4');
    expect(out).toContain('random_a');
  });

  test('parses a v7 UUID and shows unix_ts_ms with ISO timestamp', async () => {
    const { out, code } = await run('parse', V7);
    expect(code).toBe(0);
    expect(out).toContain('ver');
    expect(out).toContain('7');
    expect(out).toContain('unix_ts_ms');
    // ISO date annotation
    expect(out).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  test('--json outputs valid JSON with correct types', async () => {
    const { out, code } = await run('parse', V7, '--json');
    expect(code).toBe(0);
    const parsed = JSON.parse(out) as Record<string, unknown>;
    expect(parsed['ver']).toBe(7);
    expect(parsed['var']).toBe('RFC4122');
    expect(typeof parsed['unix_ts_ms']).toBe('number');
    // BigInt fields are serialized as hex strings
    expect(typeof parsed['rand_b']).toBe('string');
    expect((parsed['rand_b'] as string).startsWith('0x')).toBe(true);
  });

  test('missing UUID arg exits 1 with error on stderr', async () => {
    const { code, err } = await run('parse');
    expect(code).toBe(1);
    expect(err).toContain('uuid argument is required');
  });

  test('invalid UUID exits 1 with error on stderr', async () => {
    const { code, err } = await run('parse', 'not-a-uuid');
    expect(code).toBe(1);
    expect(err).toContain('Invalid UUID');
  });
});

// ── UUID shorthand ───────────────────────────────────────────────────────────

describe('UUID shorthand (no subcommand)', () => {
  test('bare UUID argument behaves identically to parse subcommand', async () => {
    const shorthand = await run(V7);
    const explicit = await run('parse', V7);
    expect(shorthand.code).toBe(0);
    expect(shorthand.out).toBe(explicit.out);
  });

  test('bare UUID with --json works', async () => {
    const { out, code } = await run(V4, '--json');
    expect(code).toBe(0);
    const parsed = JSON.parse(out) as Record<string, unknown>;
    expect(parsed['ver']).toBe(4);
  });

  test('--json before bare UUID works (flag before positional)', async () => {
    const { out, code } = await run('--json', V4);
    expect(code).toBe(0);
    const parsed = JSON.parse(out) as Record<string, unknown>;
    expect(parsed['ver']).toBe(4);
  });
});

// ── flag ordering ─────────────────────────────────────────────────────────────

describe('flag ordering (flags before subcommand)', () => {
  test('--json before parse subcommand works', async () => {
    const flagFirst = await run('--json', 'parse', V7);
    const cmdFirst = await run('parse', '--json', V7);
    expect(flagFirst.code).toBe(0);
    expect(flagFirst.out).toBe(cmdFirst.out);
  });

  test('--json before inspect subcommand works', async () => {
    const { out, code } = await run('--json', 'inspect', V7);
    expect(code).toBe(0);
    const parsed = JSON.parse(out) as Record<string, unknown>;
    expect(parsed['version']).toBe(7);
  });

  test('--json before validate subcommand works', async () => {
    const { out, code } = await run('--json', 'validate', V4);
    expect(code).toBe(0);
    const parsed = JSON.parse(out) as Record<string, unknown>;
    expect(parsed['valid']).toBe(true);
  });

  test('-n before generate subcommand works', async () => {
    const { out, code } = await run('-n', '3', 'generate', '-v7');
    expect(code).toBe(0);
    const lines = out.split('\n');
    expect(lines).toHaveLength(3);
    for (const line of lines) expect(line).toMatch(UUID_V7_RE);
  });
});

// ── inspect ─────────────────────────────────────────────────────────────────

describe('inspect', () => {
  test('inspects a v4 UUID showing version and variant', async () => {
    const { out, code } = await run('inspect', V4);
    expect(code).toBe(0);
    expect(out).toContain(V4);
    expect(out).toContain('4');
    expect(out).toContain('RFC4122');
    // v4 has no Timestamp line
    expect(out).not.toContain('Timestamp');
  });

  test('inspects a v7 UUID showing timestamp', async () => {
    const { out, code } = await run('inspect', V7);
    expect(code).toBe(0);
    expect(out).toContain('7');
    expect(out).toContain('Timestamp');
    expect(out).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  test('inspects a v1 UUID showing timestamp', async () => {
    const { out, code } = await run('inspect', V1);
    expect(code).toBe(0);
    expect(out).toContain('1');
    expect(out).toContain('Timestamp');
  });

  test('--json outputs valid JSON with expected fields', async () => {
    const { out, code } = await run('inspect', V7, '--json');
    expect(code).toBe(0);
    const parsed = JSON.parse(out) as Record<string, unknown>;
    expect(parsed['uuid']).toBe(V7);
    expect(parsed['version']).toBe(7);
    expect(parsed['variant']).toBe('RFC4122');
    expect(typeof parsed['timestamp']).toBe('string');
  });

  test('--json for v4 has no timestamp field', async () => {
    const { out, code } = await run('inspect', V4, '--json');
    expect(code).toBe(0);
    const parsed = JSON.parse(out) as Record<string, unknown>;
    expect(parsed['version']).toBe(4);
    expect(parsed['timestamp']).toBeUndefined();
  });

  test('missing UUID arg exits 1 with error on stderr', async () => {
    const { code, err } = await run('inspect');
    expect(code).toBe(1);
    expect(err).toContain('uuid argument is required');
  });
});

// ── validate ─────────────────────────────────────────────────────────────────

describe('validate', () => {
  test('valid UUID exits 0 with checkmark', async () => {
    const { out, code } = await run('validate', V4);
    expect(code).toBe(0);
    expect(out).toContain('✓');
    expect(out).toContain('version 4');
    expect(out).toContain('RFC4122');
  });

  test('invalid UUID exits 1 with cross mark', async () => {
    const { out, code } = await run('validate', 'not-a-uuid');
    expect(code).toBe(1);
    expect(out).toContain('✗');
  });

  test('--json with valid UUID', async () => {
    const { out, code } = await run('validate', V7, '--json');
    expect(code).toBe(0);
    const parsed = JSON.parse(out) as Record<string, unknown>;
    expect(parsed['valid']).toBe(true);
    expect(parsed['version']).toBe(7);
    expect(parsed['variant']).toBe('RFC4122');
  });

  test('--json with invalid UUID', async () => {
    const { out, code } = await run('validate', 'bad', '--json');
    expect(code).toBe(1);
    const parsed = JSON.parse(out) as Record<string, unknown>;
    expect(parsed['valid']).toBe(false);
    expect(typeof parsed['error']).toBe('string');
  });

  test('missing UUID arg exits 1 with error on stderr', async () => {
    const { code, err } = await run('validate');
    expect(code).toBe(1);
    expect(err).toContain('uuid argument is required');
  });
});

// ── global options ───────────────────────────────────────────────────────────

describe('options', () => {
  test('--version prints the package version', async () => {
    const pkg = JSON.parse(
      await readFile(new URL('../package.json', import.meta.url), 'utf-8')
    ) as { version: string };
    const { out, code } = await run('--version');
    expect(code).toBe(0);
    expect(out).toBe(pkg.version);
  });

  test('-v outputs same as --version', async () => {
    const version = await run('--version');
    const short = await run('-v');
    expect(short.code).toBe(0);
    expect(short.out).toBe(version.out);
  });

  test('--help shows usage and all subcommands', async () => {
    const { out, code } = await run('--help');
    expect(code).toBe(0);
    expect(out).toContain('uuid');
    expect(out).toContain('generate');
    expect(out).toContain('parse');
    expect(out).toContain('inspect');
    expect(out).toContain('validate');
  });

  test('generate --help shows version flags', async () => {
    const { out, code } = await run('generate', '--help');
    expect(code).toBe(0);
    expect(out).toContain('v4');
    expect(out).toContain('v7');
    expect(out).toContain('count');
  });

  test('-h outputs same as --help', async () => {
    const { out, code } = await run('-h');
    expect(code).toBe(0);
    expect(out).toContain('uuid');
  });

  test('--version wins over positional arguments', async () => {
    const version = await run('--version');
    const { out, code } = await run('--version', 'foo');
    expect(code).toBe(0);
    expect(out).toBe(version.out);
  });

  test('-h wins over positional arguments', async () => {
    const { out, code } = await run('-h', 'foo');
    expect(code).toBe(0);
    expect(out).toContain('generate');
    expect(out).toContain('validate');
  });
});
