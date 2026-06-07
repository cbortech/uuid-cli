# @cbortech/uuid-cli

UUIDの生成、解析、確認を行うCLIツールです（RFC 9562）。

## インストール

```bash
npm install -g @cbortech/uuid-cli
```

インストールせずに実行することもできます。

```bash
npx @cbortech/uuid-cli
```

## 使い方

```
uuid [command] [options]
```

### コマンド

| コマンド | 説明 |
|---|---|
| `generate`（デフォルト） | UUIDを生成 |
| `parse <uuid>` | UUIDの各フィールドを表示 |
| `inspect <uuid>` | バージョン、バリアント、タイムスタンプを表示 |
| `validate <uuid>` | UUID文字列を検証 |

サブコマンドなしでUUID引数を渡した場合は、`parse` として扱われます。

### オプション

| オプション | 説明 |
|---|---|
| `-v4` | UUID v4 — ランダム（デフォルト） |
| `-v7` | UUID v7 — 時刻順ランダム |
| `-n <count>` | 生成するUUIDの数 |
| `--json` | JSON形式で出力 |
| `--no-color` | 色付き出力を無効化 |
| `-h, --help` | ヘルプを表示 |
| `-v, --version` | バージョンを表示 |

## 使用例

```bash
# UUID v4 を生成
uuid

# UUID v7 を生成
uuid -v7

# UUID v7 を5個生成
uuid -v7 -n 5

# UUIDを解析（省略記法 — サブコマンド不要）
uuid 017f22e2-79b0-7cc3-98c4-dc0c0c07398f

# JSON形式で解析
uuid parse 017f22e2-79b0-7cc3-98c4-dc0c0c07398f --json

# UUIDを確認（バージョン、バリアント、タイムスタンプ）
uuid inspect 017f22e2-79b0-7cc3-98c4-dc0c0c07398f

# UUIDを検証
uuid validate 017f22e2-79b0-7cc3-98c4-dc0c0c07398f
```

### `parse` の出力

```
$ uuid parse 017f22e2-79b0-7cc3-98c4-dc0c0c07398f
ver         7
unix_ts_ms  1645557742000  2022-02-22T19:22:22.000Z
rand_a      0xcc3
var         RFC4122
rand_b      0x18c4dc0c0c07398f
```

### `inspect` の出力

```
$ uuid inspect 017f22e2-79b0-7cc3-98c4-dc0c0c07398f
UUID       017f22e2-79b0-7cc3-98c4-dc0c0c07398f
Version    7  UUID v7  time-ordered random
Variant    RFC4122
Timestamp  2022-02-22T19:22:22.000Z
```

### `validate` の出力

```
$ uuid validate 017f22e2-79b0-7cc3-98c4-dc0c0c07398f
✓ Valid UUID  (version 7, variant RFC4122)

$ uuid validate not-a-uuid
✗ Invalid UUID: Invalid UUID string: not-a-uuid
```

## 実行環境

Node.js 20 以上。

UUID の実装は [@cbortech/uuid](https://github.com/cbortech/uuid) を CLI バイナリにバンドルして配布しています。

## 仕様

- [RFC 9562: Universally Unique IDentifiers (UUIDs)](https://www.rfc-editor.org/rfc/rfc9562.html)
- [RFC 4122: A Universally Unique IDentifier (UUID) URN Namespace](https://www.rfc-editor.org/rfc/rfc4122)

## ライセンス

Apache-2.0
