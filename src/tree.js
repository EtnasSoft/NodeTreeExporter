const fs = require("fs");
const path = require("path");
const { minimatch } = require("minimatch");

function getDirectoryStructure(dir, options, indent = "", depth = 0) {
  const items = fs.readdirSync(dir);

  const visibleItems = items.filter((item) => {
    const fullPath = path.join(dir, item);
    const isDir = fs.statSync(fullPath).isDirectory();

    if (isDir && options.excludeDirs.some((p) => minimatch(item, p)))
      return false;
    if (!isDir && options.excludeFiles.some((p) => minimatch(item, p)))
      return false;
    if (!options.includeFiles && !isDir) return false;

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

    if (isDir && (options.maxDepth == null || depth < options.maxDepth)) {
      result += getDirectoryStructure(fullPath, options, subIndent, depth + 1);
    }
  });

  return result;
}

module.exports = { getDirectoryStructure };
