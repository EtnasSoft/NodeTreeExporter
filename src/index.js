#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { minimatch } = require("minimatch");

// Function to load configuration
function loadConfig() {
  try {
    const configPath = path.join(__dirname, "../config/config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

    return {
      excludeDirs: config.excludeDirs || [],
      excludeFiles: config.excludeFiles || [],
      includeFiles: config.includeFiles || false,
      maxDepth: config.maxDepth || null,
    };
  } catch (e) {
    // If config.json doesn't exist, return empty exclusions and default false
    return {
      excludeDirs: [],
      excludeFiles: [],
      includeFiles: false,
      maxDepth: null,
    };
  }
}

// Function to recursively get directory structure
function getDirectoryStructure(
  dir,
  includeFiles,
  config,
  indent = "",
  depth = 0
) {
  const items = fs.readdirSync(dir);

  // Filter visible items
  const visibleItems = items.filter((item) => {
    const fullPath = path.join(dir, item);
    const isDir = fs.statSync(fullPath).isDirectory();

    // Check exclusions
    if (isDir && config.excludeDirs.some((pattern) => minimatch(item, pattern)))
      return false;
    if (
      !isDir &&
      config.excludeFiles.some((pattern) => minimatch(item, pattern))
    )
      return false;

    // Skip if not including files and it's a file
    if (!includeFiles && !isDir) return false;

    return true;
  });

  let result = "";

  visibleItems.forEach((item, index) => {
    const isLast = index === visibleItems.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const subIndent = indent + (isLast ? "    " : "│   ");

    result += indent + connector + item + "\n";

    const fullPath = path.join(dir, item);
    const isDir = fs.statSync(fullPath).isDirectory();

    if (isDir && (config.maxDepth == null || depth < config.maxDepth)) {
      const subResult = getDirectoryStructure(
        fullPath,
        includeFiles,
        config,
        subIndent,
        depth + 1
      );
      result += subResult;
    }
  });

  return result;
}

async function main() {
  const config = loadConfig();
  const includeFiles = config.includeFiles;
  const rootDir = process.cwd();

  const structure =
    "." + "\n" + getDirectoryStructure(rootDir, includeFiles, config);

  console.log(structure);
}

main();
