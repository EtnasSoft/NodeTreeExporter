const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { parseCliArgs, mergeOptions, main, HELP_TEXT } = require("../src/cli");
const { DEFAULTS } = require("../src/config");

describe("parseCliArgs", () => {
  it("parses --include-files flag", () => {
    const { values } = parseCliArgs(["--include-files"]);
    assert.strictEqual(values["include-files"], true);
  });

  it("parses -f short flag", () => {
    const { values } = parseCliArgs(["-f"]);
    assert.strictEqual(values["include-files"], true);
  });

  it("parses --no-include-files", () => {
    const { values } = parseCliArgs(["--no-include-files"]);
    assert.strictEqual(values["no-include-files"], true);
  });

  it("parses --max-depth", () => {
    const { values } = parseCliArgs(["--max-depth", "3"]);
    assert.strictEqual(values["max-depth"], "3");
  });

  it("parses -d short flag", () => {
    const { values } = parseCliArgs(["-d", "5"]);
    assert.strictEqual(values["max-depth"], "5");
  });

  it("parses --exclude-dirs", () => {
    const { values } = parseCliArgs(["--exclude-dirs", "node_modules,.git"]);
    assert.strictEqual(values["exclude-dirs"], "node_modules,.git");
  });

  it("parses --exclude-files", () => {
    const { values } = parseCliArgs(["--exclude-files", "*.log,*.tmp"]);
    assert.strictEqual(values["exclude-files"], "*.log,*.tmp");
  });

  it("parses --config path", () => {
    const { values } = parseCliArgs(["--config", "./my-config.json"]);
    assert.strictEqual(values.config, "./my-config.json");
  });

  it("parses --no-config", () => {
    const { values } = parseCliArgs(["--no-config"]);
    assert.strictEqual(values["no-config"], true);
  });

  it("captures positional directory", () => {
    const { positionals } = parseCliArgs(["/some/path"]);
    assert.deepStrictEqual(positionals, ["/some/path"]);
  });

  it("parses --help flag", () => {
    const { values } = parseCliArgs(["--help"]);
    assert.strictEqual(values.help, true);
  });

  it("parses -h short flag", () => {
    const { values } = parseCliArgs(["-h"]);
    assert.strictEqual(values.help, true);
  });

  it("rejects unknown flags", () => {
    assert.throws(() => parseCliArgs(["--unknown-flag"]), {
      code: "ERR_PARSE_ARGS_UNKNOWN_OPTION",
    });
  });

  it("parses combined flags", () => {
    const { values, positionals } = parseCliArgs([
      "-f",
      "-d",
      "2",
      "--exclude-dirs",
      "node_modules",
      "/my/dir",
    ]);
    assert.strictEqual(values["include-files"], true);
    assert.strictEqual(values["max-depth"], "2");
    assert.strictEqual(values["exclude-dirs"], "node_modules");
    assert.deepStrictEqual(positionals, ["/my/dir"]);
  });
});

describe("mergeOptions", () => {
  it("returns config values when no CLI overrides", () => {
    const config = {
      excludeDirs: [".git"],
      excludeFiles: ["*.log"],
      includeFiles: true,
      maxDepth: 5,
    };
    const result = mergeOptions(config, {});
    assert.deepStrictEqual(result, config);
  });

  it("CLI --include-files overrides config", () => {
    const config = { ...DEFAULTS, includeFiles: false };
    const result = mergeOptions(config, { "include-files": true });
    assert.strictEqual(result.includeFiles, true);
  });

  it("CLI --no-include-files overrides config", () => {
    const config = { ...DEFAULTS, includeFiles: true };
    const result = mergeOptions(config, { "no-include-files": true });
    assert.strictEqual(result.includeFiles, false);
  });

  it("CLI --max-depth overrides config", () => {
    const config = { ...DEFAULTS, maxDepth: 10 };
    const result = mergeOptions(config, { "max-depth": "3" });
    assert.strictEqual(result.maxDepth, 3);
  });

  it("CLI --max-depth 0 is valid", () => {
    const result = mergeOptions({ ...DEFAULTS }, { "max-depth": "0" });
    assert.strictEqual(result.maxDepth, 0);
  });

  it("throws on invalid --max-depth (non-number)", () => {
    assert.throws(() => mergeOptions({ ...DEFAULTS }, { "max-depth": "abc" }), {
      message: /Invalid --max-depth/,
    });
  });

  it("throws on negative --max-depth", () => {
    assert.throws(() => mergeOptions({ ...DEFAULTS }, { "max-depth": "-1" }), {
      message: /Invalid --max-depth/,
    });
  });

  it("throws on fractional --max-depth", () => {
    assert.throws(
      () => mergeOptions({ ...DEFAULTS }, { "max-depth": "2.5" }),
      { message: /Invalid --max-depth/ }
    );
  });

  it("CLI --exclude-dirs splits comma-separated values", () => {
    const result = mergeOptions({ ...DEFAULTS }, {
      "exclude-dirs": "node_modules, .git, dist",
    });
    assert.deepStrictEqual(result.excludeDirs, ["node_modules", ".git", "dist"]);
  });

  it("CLI --exclude-files splits comma-separated values", () => {
    const result = mergeOptions({ ...DEFAULTS }, {
      "exclude-files": "*.log,*.tmp",
    });
    assert.deepStrictEqual(result.excludeFiles, ["*.log", "*.tmp"]);
  });
});

describe("main", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cli-test-"));
    fs.mkdirSync(path.join(tmpDir, "src"));
    fs.writeFileSync(path.join(tmpDir, "src", "app.js"), "code");
    fs.writeFileSync(path.join(tmpDir, "readme.txt"), "text");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("--help outputs help text", () => {
    const logs = [];
    const origLog = console.log;
    console.log = (...args) => logs.push(args.join(" "));

    main(["--help"]);

    console.log = origLog;
    assert.ok(logs.join("\n").includes("Usage: tree-export"));
  });

  it("runs with positional directory and --no-config", () => {
    const logs = [];
    const origLog = console.log;
    console.log = (...args) => logs.push(args.join(" "));

    main(["--no-config", tmpDir]);

    console.log = origLog;
    const output = logs.join("\n");
    assert.ok(output.includes("."));
    assert.ok(output.includes("src"));
  });

  it("sets exitCode on unknown flag", () => {
    const origExitCode = process.exitCode;
    const errors = [];
    const origError = console.error;
    console.error = (...args) => errors.push(args.join(" "));

    main(["--bad-flag"]);

    console.error = origError;
    assert.strictEqual(process.exitCode, 1);
    process.exitCode = origExitCode;
  });

  it("sets exitCode on invalid --max-depth", () => {
    const origExitCode = process.exitCode;
    const errors = [];
    const origError = console.error;
    console.error = (...args) => errors.push(args.join(" "));

    main(["--no-config", "--max-depth", "abc", tmpDir]);

    console.error = origError;
    assert.strictEqual(process.exitCode, 1);
    assert.ok(errors.some((e) => e.includes("Invalid --max-depth")));
    process.exitCode = origExitCode;
  });
});

describe("HELP_TEXT", () => {
  it("contains usage line", () => {
    assert.ok(HELP_TEXT.includes("Usage: tree-export"));
  });

  it("documents all main options", () => {
    assert.ok(HELP_TEXT.includes("--help"));
    assert.ok(HELP_TEXT.includes("--include-files"));
    assert.ok(HELP_TEXT.includes("--max-depth"));
    assert.ok(HELP_TEXT.includes("--exclude-dirs"));
    assert.ok(HELP_TEXT.includes("--exclude-files"));
    assert.ok(HELP_TEXT.includes("--config"));
    assert.ok(HELP_TEXT.includes("--no-config"));
  });
});
