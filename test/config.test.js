const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { loadConfig, DEFAULTS } = require("../src/config");

describe("loadConfig", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "config-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns defaults when config file does not exist", () => {
    const result = loadConfig(path.join(tmpDir, "nonexistent.json"));
    assert.deepStrictEqual(result, DEFAULTS);
  });

  it("reads a valid config file", () => {
    const configPath = path.join(tmpDir, "config.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        excludeDirs: [".git"],
        excludeFiles: ["*.log"],
        includeFiles: true,
        maxDepth: 3,
      })
    );

    const result = loadConfig(configPath);
    assert.deepStrictEqual(result, {
      excludeDirs: [".git"],
      excludeFiles: ["*.log"],
      includeFiles: true,
      maxDepth: 3,
    });
  });

  it("preserves maxDepth: 0 (bug fix)", () => {
    const configPath = path.join(tmpDir, "config.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify({ maxDepth: 0 })
    );

    const result = loadConfig(configPath);
    assert.strictEqual(result.maxDepth, 0);
  });

  it("preserves includeFiles: false explicitly set", () => {
    const configPath = path.join(tmpDir, "config.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify({ includeFiles: false })
    );

    const result = loadConfig(configPath);
    assert.strictEqual(result.includeFiles, false);
  });

  it("returns defaults on malformed JSON", () => {
    const configPath = path.join(tmpDir, "config.json");
    fs.writeFileSync(configPath, "not valid json {{{");

    const result = loadConfig(configPath);
    assert.deepStrictEqual(result, DEFAULTS);
  });

  it("returns defaults when configPath is false (--no-config)", () => {
    const result = loadConfig(false);
    assert.deepStrictEqual(result, DEFAULTS);
  });

  it("fills missing fields with defaults", () => {
    const configPath = path.join(tmpDir, "config.json");
    fs.writeFileSync(configPath, JSON.stringify({ includeFiles: true }));

    const result = loadConfig(configPath);
    assert.strictEqual(result.includeFiles, true);
    assert.deepStrictEqual(result.excludeDirs, []);
    assert.deepStrictEqual(result.excludeFiles, []);
    assert.strictEqual(result.maxDepth, null);
  });
});
