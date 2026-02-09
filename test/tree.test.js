const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { getDirectoryStructure } = require("../src/tree");
const { DEFAULTS } = require("../src/config");

function createTree(tmpDir, structure) {
  for (const [name, type] of Object.entries(structure)) {
    const fullPath = path.join(tmpDir, name);
    if (type === "dir") {
      fs.mkdirSync(fullPath, { recursive: true });
    } else {
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, type);
    }
  }
}

describe("getDirectoryStructure", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tree-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("shows directories only by default", () => {
    createTree(tmpDir, {
      "src": "dir",
      "src/app.js": "code",
      "lib": "dir",
      "readme.txt": "text",
    });

    const result = getDirectoryStructure(tmpDir, { ...DEFAULTS });
    assert.ok(result.includes("src"));
    assert.ok(result.includes("lib"));
    assert.ok(!result.includes("readme.txt"));
    assert.ok(!result.includes("app.js"));
  });

  it("includes files when includeFiles is true", () => {
    createTree(tmpDir, {
      "src": "dir",
      "src/app.js": "code",
      "readme.txt": "text",
    });

    const result = getDirectoryStructure(tmpDir, {
      ...DEFAULTS,
      includeFiles: true,
    });
    assert.ok(result.includes("src"));
    assert.ok(result.includes("app.js"));
    assert.ok(result.includes("readme.txt"));
  });

  it("respects maxDepth limit", () => {
    createTree(tmpDir, {
      "a": "dir",
      "a/b": "dir",
      "a/b/c": "dir",
    });

    const result = getDirectoryStructure(tmpDir, {
      ...DEFAULTS,
      maxDepth: 1,
    });
    assert.ok(result.includes("a"));
    assert.ok(result.includes("b"));
    assert.ok(!result.includes("c"));
  });

  it("maxDepth 0 shows only root children", () => {
    createTree(tmpDir, {
      "a": "dir",
      "a/b": "dir",
    });

    const result = getDirectoryStructure(tmpDir, {
      ...DEFAULTS,
      maxDepth: 0,
    });
    assert.ok(result.includes("a"));
    assert.ok(!result.includes("b"));
  });

  it("excludes directories matching excludeDirs patterns", () => {
    createTree(tmpDir, {
      "src": "dir",
      "node_modules": "dir",
      ".git": "dir",
    });

    const result = getDirectoryStructure(tmpDir, {
      ...DEFAULTS,
      excludeDirs: ["node_modules", ".git"],
    });
    assert.ok(result.includes("src"));
    assert.ok(!result.includes("node_modules"));
    assert.ok(!result.includes(".git"));
  });

  it("excludes files matching excludeFiles patterns", () => {
    createTree(tmpDir, {
      "app.js": "code",
      "app.test.js": "test",
      "style.css": "css",
    });

    const result = getDirectoryStructure(tmpDir, {
      ...DEFAULTS,
      includeFiles: true,
      excludeFiles: ["*.test.js"],
    });
    assert.ok(result.includes("app.js"));
    assert.ok(!result.includes("app.test.js"));
    assert.ok(result.includes("style.css"));
  });

  it("uses correct ASCII connectors", () => {
    createTree(tmpDir, {
      "aaa": "dir",
      "zzz": "dir",
    });

    const result = getDirectoryStructure(tmpDir, { ...DEFAULTS });
    const lines = result.trimEnd().split("\n");
    assert.ok(lines[0].includes("├── "));
    assert.ok(lines[1].includes("└── "));
  });

  it("returns empty string for empty directory", () => {
    const result = getDirectoryStructure(tmpDir, { ...DEFAULTS });
    assert.strictEqual(result, "");
  });

  it("unlimited depth when maxDepth is null", () => {
    createTree(tmpDir, {
      "a": "dir",
      "a/b": "dir",
      "a/b/c": "dir",
      "a/b/c/d": "dir",
    });

    const result = getDirectoryStructure(tmpDir, {
      ...DEFAULTS,
      maxDepth: null,
    });
    assert.ok(result.includes("a"));
    assert.ok(result.includes("b"));
    assert.ok(result.includes("c"));
    assert.ok(result.includes("d"));
  });
});
