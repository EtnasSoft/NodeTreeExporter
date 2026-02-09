const fs = require("fs");
const path = require("path");

const DEFAULTS = {
  excludeDirs: [],
  excludeFiles: [],
  includeFiles: false,
  maxDepth: null,
};

function loadConfig(configPath) {
  if (configPath === false) {
    return { ...DEFAULTS };
  }

  const resolvedPath =
    configPath ?? path.join(__dirname, "../config/config.json");

  try {
    const config = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));

    return {
      excludeDirs: config.excludeDirs ?? DEFAULTS.excludeDirs,
      excludeFiles: config.excludeFiles ?? DEFAULTS.excludeFiles,
      includeFiles: config.includeFiles ?? DEFAULTS.includeFiles,
      maxDepth: config.maxDepth ?? DEFAULTS.maxDepth,
    };
  } catch (e) {
    return { ...DEFAULTS };
  }
}

module.exports = { loadConfig, DEFAULTS };
