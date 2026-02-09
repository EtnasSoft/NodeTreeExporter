#!/usr/bin/env node

const path = require("path");
const { parseArgs } = require("node:util");
const { loadConfig } = require("./config");
const { getDirectoryStructure } = require("./tree");

const HELP_TEXT = `Usage: tree-export [options] [directory]

Options:
  -h, --help                      Show help with usage and examples
  -f, --include-files             Include files in output (default: from config or false)
      --no-include-files          Show only directories
  -d, --max-depth <number>        Maximum depth (0 = root only, omit for unlimited)
  -D, --exclude-dirs <patterns>   Comma-separated directory exclusion globs
  -X, --exclude-files <patterns>  Comma-separated file exclusion globs
  -c, --config <path>             Path to custom config.json
      --no-config                 Ignore config.json entirely

Examples:
  tree-export
  tree-export --include-files --max-depth 2
  tree-export --exclude-dirs "node_modules,.git" /path/to/project
  tree-export --no-config --include-files`;

function parseCliArgs(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    strict: true,
    options: {
      help: { type: "boolean", short: "h", default: false },
      "include-files": { type: "boolean", short: "f" },
      "no-include-files": { type: "boolean", default: false },
      "max-depth": { type: "string", short: "d" },
      "exclude-dirs": { type: "string", short: "D" },
      "exclude-files": { type: "string", short: "X" },
      config: { type: "string", short: "c" },
      "no-config": { type: "boolean", default: false },
    },
  });

  return { values, positionals };
}

function mergeOptions(configOpts, cliValues) {
  const merged = { ...configOpts };

  if (cliValues["no-include-files"]) {
    merged.includeFiles = false;
  } else if (cliValues["include-files"] !== undefined) {
    merged.includeFiles = cliValues["include-files"];
  }

  if (cliValues["max-depth"] !== undefined) {
    const parsed = Number(cliValues["max-depth"]);
    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new Error(
        `Invalid --max-depth value: "${cliValues["max-depth"]}". Must be a non-negative integer.`
      );
    }
    merged.maxDepth = parsed;
  }

  if (cliValues["exclude-dirs"] !== undefined) {
    merged.excludeDirs = cliValues["exclude-dirs"]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (cliValues["exclude-files"] !== undefined) {
    merged.excludeFiles = cliValues["exclude-files"]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return merged;
}

function main(argv) {
  const args = argv ?? process.argv.slice(2);

  let parsed;
  try {
    parsed = parseCliArgs(args);
  } catch (e) {
    console.error(`Error: ${e.message}`);
    console.error(`Run "tree-export --help" for usage information.`);
    process.exitCode = 1;
    return;
  }

  if (parsed.values.help) {
    console.log(HELP_TEXT);
    return;
  }

  let configPath;
  if (parsed.values["no-config"]) {
    configPath = false;
  } else if (parsed.values.config !== undefined) {
    configPath = path.resolve(parsed.values.config);
  }

  const configOpts = loadConfig(configPath);

  let options;
  try {
    options = mergeOptions(configOpts, parsed.values);
  } catch (e) {
    console.error(`Error: ${e.message}`);
    process.exitCode = 1;
    return;
  }

  const rootDir = parsed.positionals.length > 0
    ? path.resolve(parsed.positionals[0])
    : process.cwd();

  const structure = ".\n" + getDirectoryStructure(rootDir, options);
  console.log(structure);
}

module.exports = { parseCliArgs, mergeOptions, main, HELP_TEXT };

if (require.main === module) {
  main();
}
