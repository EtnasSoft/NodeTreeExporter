# NodeTreeExporter

A Node.js CLI tool that prints directory tree structures as ASCII text.

## Installation

```bash
# Clone and install
git clone https://github.com/EtnasSoft/NodeTreeExporter.git
cd NodeTreeExporter
npm install

# Or install globally
npm install -g .
```

Requires **Node.js 18** or later.

## Usage

```bash
# Using npm script
npm run tree-export

# Direct execution
node src/cli.js

# If installed globally
tree-export
```

### CLI Options

| Option | Short | Description |
|--------|-------|-------------|
| `--help` | `-h` | Show help with usage and examples |
| `--include-files` | `-f` | Include files in output (default: from config or `false`) |
| `--no-include-files` | | Show only directories |
| `--max-depth <n>` | `-d` | Maximum depth (`0` = root only, omit for unlimited) |
| `--exclude-dirs <patterns>` | `-D` | Comma-separated directory exclusion globs |
| `--exclude-files <patterns>` | `-X` | Comma-separated file exclusion globs |
| `--config <path>` | `-c` | Path to custom config.json |
| `--no-config` | | Ignore config.json entirely |

### Examples

```bash
# Print directory tree using config.json defaults
tree-export

# Include files, limit to 2 levels deep
tree-export --include-files --max-depth 2

# Exclude specific directories
tree-export --exclude-dirs "node_modules,.git" /path/to/project

# Ignore config file and use only CLI options
tree-export --no-config --include-files

# Use a custom config file
tree-export --config ./my-config.json
```

## Configuration

Settings are loaded with this precedence: **defaults < config.json < CLI arguments**.

### Config File

By default the tool reads `config/config.json` relative to the project root:

```json
{
  "excludeDirs": [".git", "node_modules"],
  "excludeFiles": ["*.log", "*.tmp"],
  "includeFiles": true,
  "maxDepth": 3
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `excludeDirs` | `string[]` | `[]` | Glob patterns for directories to exclude |
| `excludeFiles` | `string[]` | `[]` | Glob patterns for files to exclude |
| `includeFiles` | `boolean` | `false` | Whether to show files in the tree |
| `maxDepth` | `number \| null` | `null` | Max traversal depth (`0` = root only, `null` = unlimited) |

## Testing

```bash
npm test
```

Tests use the built-in `node:test` runner and `node:assert` — no external test dependencies required.

## License

MIT
