# @cbortech/uuid-cli

CLI tool for generating, parsing, and inspecting UUIDs (RFC 9562).

## Install

```bash
npm install -g @cbortech/uuid-cli
```

Or run without installing:

```bash
npx @cbortech/uuid-cli
```

## Usage

```
uuid [command] [options]
```

### Commands

| Command | Description |
|---|---|
| `generate` (default) | Generate a UUID |
| `parse <uuid>` | Show all UUID fields |
| `inspect <uuid>` | Show version, variant, and timestamp |
| `validate <uuid>` | Validate a UUID string |

A bare UUID argument without a subcommand is treated as `parse`.

### Options

| Option | Description |
|---|---|
| `-v4` | UUID v4 — random (default) |
| `-v7` | UUID v7 — time-ordered random |
| `-n <count>` | Number of UUIDs to generate |
| `--json` | Output as JSON |
| `--no-color` | Disable color output |
| `-h, --help` | Show help |
| `-v, --version` | Show version |

## Examples

```bash
# Generate a UUID v4
uuid

# Generate a UUID v7
uuid -v7

# Generate 5 UUID v7s
uuid -v7 -n 5

# Parse a UUID (shorthand — no subcommand needed)
uuid 017f22e2-79b0-7cc3-98c4-dc0c0c07398f

# Parse with JSON output
uuid parse 017f22e2-79b0-7cc3-98c4-dc0c0c07398f --json

# Inspect a UUID (version, variant, timestamp)
uuid inspect 017f22e2-79b0-7cc3-98c4-dc0c0c07398f

# Validate a UUID
uuid validate 017f22e2-79b0-7cc3-98c4-dc0c0c07398f
```

### `parse` output

```
$ uuid parse 017f22e2-79b0-7cc3-98c4-dc0c0c07398f
ver         7
unix_ts_ms  1645557742000  2022-02-22T19:22:22.000Z
rand_a      0xcc3
var         RFC4122
rand_b      0x18c4dc0c0c07398f
```

### `inspect` output

```
$ uuid inspect 017f22e2-79b0-7cc3-98c4-dc0c0c07398f
UUID       017f22e2-79b0-7cc3-98c4-dc0c0c07398f
Version    7  UUID v7  time-ordered random
Variant    RFC4122
Timestamp  2022-02-22T19:22:22.000Z
```

### `validate` output

```
$ uuid validate 017f22e2-79b0-7cc3-98c4-dc0c0c07398f
✓ Valid UUID  (version 7, variant RFC4122)

$ uuid validate not-a-uuid
✗ Invalid UUID: Invalid UUID string: not-a-uuid
```

## Runtime

Node.js 20 or newer.

The UUID implementation from [@cbortech/uuid](https://github.com/cbortech/uuid) is bundled into the CLI binary.

## Specifications

- [RFC 9562: Universally Unique IDentifiers (UUIDs)](https://www.rfc-editor.org/rfc/rfc9562.html)
- [RFC 4122: A Universally Unique IDentifier (UUID) URN Namespace](https://www.rfc-editor.org/rfc/rfc4122)

## License

Apache-2.0
